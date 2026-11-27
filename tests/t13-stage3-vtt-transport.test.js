import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

import { T13Session } from '../src/t13ne/modules/systems/T13Session.js';
import { InMemoryTransportHub, VTTSessionClient, VTTSessionHost } from '../src/t13ne/modules/vtt/VTTTransportService.js';
import {
    createAuthChallenge,
    createPassphraseVerifier,
    generateSessionKeyPair,
    signSessionJWT,
    solveAuthChallenge,
    verifyAuthChallengeResponse,
    verifySessionJWT
} from '../src/t13ne/modules/vtt/VTTAuthService.js';
import { AvatarEngine } from '../src/t13ne/procgen/avatar/AvatarEngine.js';
import { BODY_PLANS } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';
import { decodeSkinSyncPayload, encodeSkinSyncPayload, exportSkinDocument } from '../src/t13ne/procgen/avatar/AvatarSkinDocument.js';

const require = createRequire(import.meta.url);
const root = process.cwd();

test('VTTAuthService issues & verifies ECDSA P-256 JWTs and salted PBKDF2/HMAC challenge-response', async () => {
    const keypair = await generateSessionKeyPair();
    const token = await signSessionJWT({ sub: 'referee', sid: 'sess-auth', role: 'referee' }, keypair.privateKey, { kid: keypair.kid });

    const valid = await verifySessionJWT(token, keypair.publicJwk, { expectedSessionId: 'sess-auth' });
    assert.equal(valid.valid, true);
    assert.equal(valid.claims.role, 'referee');
    assert.equal(valid.claims.sub, 'referee');

    const wrongSession = await verifySessionJWT(token, keypair.publicJwk, { expectedSessionId: 'other-session' });
    assert.equal(wrongSession.valid, false);

    // Tampered payload fails signature check
    const parts = token.split('.');
    const tamperedClaims = Buffer.from(JSON.stringify({ sub: 'eve', sid: 'sess-auth', role: 'referee', exp: 9999999999 })).toString('base64url');
    const tampered = `${parts[0]}.${tamperedClaims}.${parts[2]}`;
    const tamperedCheck = await verifySessionJWT(tampered, keypair.publicJwk);
    assert.equal(tamperedCheck.valid, false);

    // Salted passphrase challenge-response
    const verifier = await createPassphraseVerifier('strange-weaver-key-99');
    const challenge = createAuthChallenge();
    const proof = await solveAuthChallenge('strange-weaver-key-99', {
        nonce: challenge.nonce,
        salt: verifier.salt,
        iterations: verifier.iterations
    });
    assert.equal(await verifyAuthChallengeResponse(proof, { nonce: challenge.nonce, verifier }), true);
    const badProof = await solveAuthChallenge('wrong-passphrase', {
        nonce: challenge.nonce,
        salt: verifier.salt,
        iterations: verifier.iterations
    });
    assert.equal(await verifyAuthChallengeResponse(badProof, { nonce: challenge.nonce, verifier }), false);
});

test('Server PermissionService creates challenges and verifies ES256 JWTs without hardcoded secrets', async () => {
    process.env.REFREE_SECRET = 'ephemeral-test-secret-for-node-suite';
    const PermissionService = require('../server/PermissionService.js');

    const challenge = PermissionService.createChallenge();
    const proof = await solveAuthChallenge('ephemeral-test-secret-for-node-suite', {
        nonce: challenge.nonce,
        salt: challenge.salt,
        iterations: challenge.iterations
    });
    const verified = PermissionService.verifyChallengeAndIssueJWT({
        challengeId: challenge.challengeId,
        response: proof,
        actorId: 'gm-1',
        sessionId: 'sess-1'
    });
    assert.equal(verified.ok, true);
    assert.equal(verified.role, 'referee');

    // Replay of consumed challenge fails
    const replay = PermissionService.verifyChallengeAndIssueJWT({
        challengeId: challenge.challengeId,
        response: proof,
        actorId: 'gm-1',
        sessionId: 'sess-1'
    });
    assert.equal(replay.ok, false);

    // Web Crypto can verify server-issued public JWK + JWT directly
    const webVerify = await verifySessionJWT(verified.token, verified.publicJwk, { expectedSessionId: 'sess-1' });
    assert.equal(webVerify.valid, true);
    assert.equal(webVerify.claims.role, 'referee');

    // Player JWT cannot elevate to referee
    const playerToken = PermissionService.issuePlayerJWT({ actorId: 'p1', sessionId: 'sess-1' });
    assert.equal(PermissionService.resolveTokenAuth(playerToken.token).role, 'player');
});

test('VTTSessionHost enforces role-filtered privacy, anti-spoofing, and reconnect catch-up', async () => {
    const session = new T13Session({ sessionId: 'vtt-room-1', seed: 'vtt-seed' });
    let fakeNow = 1000;
    const hub = new InMemoryTransportHub();
    const host = new VTTSessionHost(session, { transport: hub, now: () => fakeNow });

    await host.initAuth('tabletop-ref-pass');
    const ch = host.createAuthChallenge();
    const proof = await solveAuthChallenge('tabletop-ref-pass', ch);
    const refAuth = await host.verifyChallengeAndIssueToken({ challengeId: ch.challengeId, response: proof, actorId: 'referee' });
    assert.equal(refAuth.ok, true);

    const refClient = new VTTSessionClient({ peerId: 'peer-ref', actorId: 'referee', sessionId: 'vtt-room-1', transport: hub });
    const p1Client = new VTTSessionClient({ peerId: 'peer-p1', actorId: 'player-1', sessionId: 'vtt-room-1', transport: hub });
    const p2Client = new VTTSessionClient({ peerId: 'peer-p2', actorId: 'player-2', sessionId: 'vtt-room-1', transport: hub });

    await host.registerPeerWithToken('peer-ref', { token: refAuth.token });
    host.registerPeer('peer-p1', { actorId: 'player-1', role: 'player' });
    host.registerPeer('peer-p2', { actorId: 'player-2', role: 'player' });

    // Referee sets a secret note, spawns a hidden ambush token, and deals private hands
    refClient.sendCommand('Referee:SetSecretNote', { key: 'ambush', note: 'Void Spider under floorboard' });
    refClient.sendCommand('VTT:SpawnToken', { id: 'tok-ambush', name: 'Void Spider', tokenType: 'creature', hidden: true, allegiance: 'enemy', position: { x: 4, z: -2 } });
    refClient.sendCommand('VTT:SpawnToken', { id: 'tok-p1', name: 'Kaelen', ownerActorId: 'player-1', position: { x: 0, z: 0 } });
    refClient.sendCommand('Hand:DealPrivate', { targetActorId: 'player-1', cards: [{ id: 'c1', suit: 'Spades', pips: 13 }] });
    refClient.sendCommand('Hand:DealPrivate', { targetActorId: 'player-2', cards: [{ id: 'c2', suit: 'Hearts', pips: 7 }] });

    // Player 1 sees own token & own hand ONLY; never sees hidden token, refereeSecrets, or Player 2's card
    assert.ok(p1Client.projection.table.tokens['tok-p1']);
    assert.equal(p1Client.projection.table.tokens['tok-ambush'], undefined);
    assert.equal(p1Client.projection.refereeSecrets, undefined);
    assert.equal(p1Client.projection.privateHands, undefined);
    assert.equal(p1Client.projection.privateHand.length, 1);
    assert.equal(p1Client.projection.privateHand[0].id, 'c1');
    assert.equal(p2Client.projection.privateHand.length, 1);
    assert.equal(p2Client.projection.privateHand[0].id, 'c2');
    assert.ok(refClient.projection.table.tokens['tok-ambush']);
    assert.equal(refClient.projection.refereeSecrets.notes.ambush, 'Void Spider under floorboard');

    // Player 2 cannot spoof Player 1's actorId or move Player 1's token
    hub.sendToHost('peer-p2', {
        type: 'SESSION_COMMAND',
        command: { id: 'spoof-1', sessionId: 'vtt-room-1', actorId: 'player-1', type: 'VTT:MoveToken', payload: { tokenId: 'tok-p1', position: { x: 9, z: 9 } } }
    });
    assert.equal(p2Client.errors.at(-1).error, 'FORBIDDEN');
    p2Client.sendCommand('VTT:MoveToken', { tokenId: 'tok-p1', position: { x: 9, z: 9 } });
    assert.equal(p2Client.errors.at(-1).error, 'FORBIDDEN');
    assert.equal(p1Client.projection.table.tokens['tok-p1'].position.x, 0);

    // Player 1 moves own token cleanly
    p1Client.sendCommand('VTT:MoveToken', { tokenId: 'tok-p1', position: { x: 2, z: 3 } });
    assert.equal(p2Client.projection.table.tokens['tok-p1'].position.x, 2);

    // Disconnect Player 2, Referee reveals hidden token & updates board, Player 2 reconnects and catches up
    hub.disconnectPeer('peer-p2');
    refClient.sendCommand('VTT:UpdateToken', { tokenId: 'tok-ambush', patch: { hidden: false } });
    refClient.sendCommand('VTT:SetBoardConfig', { gridType: 'hex', backdropUrl: '/maps/sector7.png' });
    assert.equal(p2Client.projection.table.tokens['tok-ambush'], undefined);

    hub.reconnectPeer('peer-p2');
    p2Client.requestSync();
    assert.ok(p2Client.projection.table.tokens['tok-ambush']);
    assert.equal(p2Client.projection.table.board.gridType, 'hex');

    // Rate-limited AVATAR_PUPPET frames drop cleanly above 25/sec
    const received = [];
    p2Client.on('puppet', p => received.push(p));
    for (let i = 0; i < 35; i++) {
        p1Client.sendPuppetFrame({ jawOpen: i / 35 });
    }
    assert.equal(received.length, 25);
});

test('P2PNetworkManager validates Stage 3 messages and compact SKIN_SYNC fits within 131KB limit', async () => {
    const p2pSource = await readFile(path.join(root, 'src/t13ne/core/P2PNetworkManager.js'), 'utf8');
    const moduleSource = p2pSource
        .replace(/import \{ EventBus \} from [^;]+;/, 'const EventBus = { emit() {} };')
        .replace(/import \{ Peer \} from [^;]+;/, 'const Peer = class {};');

    const { P2PNetworkManager } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
    const mgr = new P2PNetworkManager();

    assert.ok(mgr.validateIncomingMessage(JSON.stringify({
        type: 'SESSION_COMMAND',
        command: { id: 'c1', sessionId: 's1', actorId: 'p1', type: 'VTT:MoveToken', payload: { tokenId: 't1', position: { x: 1, z: 2 } } }
    }), 'peer-a'));

    assert.equal(mgr.validateIncomingMessage(JSON.stringify({
        type: 'SESSION_COMMAND',
        command: { id: 'c1' }
    }), 'peer-a'), null);

    // Compact RLE skin sync payload fits well inside P2P limit
    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
    const wireSkin = encodeSkinSyncPayload(exportSkinDocument(mesh));
    const serialized = JSON.stringify({ type: 'SKIN_SYNC', entityId: 'char-1', skinDocument: wireSkin });
    assert.ok(Buffer.byteLength(serialized, 'utf8') < 131072, `Compact SKIN_SYNC is ${Buffer.byteLength(serialized, 'utf8')} bytes`);
    assert.ok(mgr.validateIncomingMessage(serialized, 'peer-a'));

    const decoded = decodeSkinSyncPayload(wireSkin);
    assert.equal(decoded.pixels.length, 512 * 512 * 4);
});
