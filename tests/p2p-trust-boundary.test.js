import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

test('P2PNetworkManager enforces trust boundary on incoming messages', async () => {
    const p2pSource = await readFile(path.join(root, 'src/t13ne/core/P2PNetworkManager.js'), 'utf8');
    const moduleSource = p2pSource
        .replace(/import \{ EventBus \} from [^;]+;/, 'const EventBus = { emit() {} };')
        .replace(/import \{ Peer \} from [^;]+;/, 'const Peer = class {};');

    const { P2PNetworkManager } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
    const mgr = new P2PNetworkManager();

    // 1. Valid allowlisted message passes
    const valid = mgr.validateIncomingMessage(JSON.stringify({ type: 'DICE_ROLL', rolls: [6, 4] }), 'peer_1');
    assert.ok(valid);
    assert.equal(valid.type, 'DICE_ROLL');
    assert.deepEqual(valid.rolls, [6, 4]);

    // 2. Disallowed or arbitrary message types are rejected
    assert.equal(mgr.validateIncomingMessage(JSON.stringify({ type: 'EXECUTE_ARBITRARY_COMMAND', cmd: 'rm' }), 'peer_2'), null);
    assert.equal(mgr.validateIncomingMessage(JSON.stringify({ type: 'EVAL_CODE' }), 'peer_2'), null);

    // 3. Malformed JSON is rejected
    assert.equal(mgr.validateIncomingMessage('{ not valid json', 'peer_3'), null);

    // 4. Oversized payload is dropped
    const oversizedPayload = JSON.stringify({ type: 'TOKEN_MOVE', junk: 'x'.repeat(150000) });
    assert.equal(mgr.validateIncomingMessage(oversizedPayload, 'peer_4'), null);

    // 5. Non-object payload is dropped
    assert.equal(mgr.validateIncomingMessage(JSON.stringify(['array_payload']), 'peer_5'), null);
    assert.equal(mgr.validateIncomingMessage(null, 'peer_5'), null);
});
