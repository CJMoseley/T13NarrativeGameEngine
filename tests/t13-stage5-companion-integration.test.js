import test from 'node:test';
import assert from 'node:assert/strict';

import { T13Session } from '../src/t13ne/modules/systems/T13Session.js';
import { InMemoryTransportHub, VTTSessionClient, VTTSessionHost } from '../src/t13ne/modules/vtt/VTTTransportService.js';
import { createSpeciesDescendant } from '../src/t13ne/modules/characters/T13SpeciesDescendant.js';
import { buildCharacterSheetAvatar, buildDescendantSheetAvatar } from '../ttrpg-companion/src/components/T13CharacterSheet.js';
import { formatSessionLogEntry } from '../ttrpg-companion/src/components/T13CardOrdealHud.js';
import { buildMinimalHexagramTable } from '../ttrpg-companion/src/components/T13RefereeConsole.js';
import { SessionCompanionBridge } from '../ttrpg-companion/src/services/SessionCompanionBridge.js';

test('Stage 5 integration: SessionCompanionBridge offline host/client & role-filtered secret non-disclosure', async () => {
    const bridge = new SessionCompanionBridge({
        sessionId: 'stage5-test',
        actorId: 'referee-1',
        mode: 'referee'
    });
    const conn = bridge.connectOfflineFallback();
    assert.equal(conn.transportMode, 'offline');
    assert.equal(conn.role, 'referee');

    // Join a restricted player into the same InMemoryTransportHub
    const hub = bridge.host.transport;
    bridge.host.session.dispatch({
        id: 'join-p1',
        sessionId: 'stage5-test',
        actorId: bridge.host.session.refereeId,
        type: 'Session:Join',
        payload: { actorId: 'player-1', role: 'player', name: 'Player One' }
    });
    bridge.host.peers.set('player-1', { actorId: 'player-1', role: 'player', lastSeq: 0 });
    const playerClient = new VTTSessionClient({ peerId: 'player-1', actorId: 'player-1', sessionId: 'stage5-test', transport: hub });
    playerClient.requestSync();

    // Referee registers Insectoid species, sets private secret note, spawns a hidden NPC & public PC
    const species = createSpeciesDescendant({
        id: 't13-species-insectoid',
        name: 'Insectoid',
        incarna: 'Trial',
        bodyPlan: 'insectoid',
        voiceProfile: { preset: 'chitin-click' }
    });
    bridge.client.sendCommand('Species:Register', { species });
    bridge.client.sendCommand('Referee:SetSecretNote', { key: 'vault', note: 'Secret code 77' });
    bridge.client.sendCommand('VTT:SpawnToken', {
        id: 'tok-hidden',
        name: 'Stalker',
        tokenType: 'creature',
        hidden: true,
        position: { x: 4, y: 0, z: 4 }
    });

    // Player registers character, executes T13 Test, Adjusts Sway
    const pc = {
        id: 'char-krix',
        ownerActorId: 'player-1',
        name: 'Krix',
        charType: 'Hero',
        creationModel: 'Detailed',
        speciesDescendantId: species.id,
        species,
        incarna: 'Trial',
        boons: { Awe: 12, Trial: 14 },
        sway: { Chi: 4, 'Tao:Yin': 2, 'Tao:Yang': 1 },
        stressState: { 'Facet:Trial': { stress: 2, strains: 0, shocks: 0 } },
        wounds: []
    };
    playerClient.sendCommand('Character:Register', { character: pc });
    playerClient.sendCommand('Test:Perform', {
        characterId: 'char-krix',
        testType: 'dice',
        options: { facet: 'Trial', difficulty: 2 }
    });
    playerClient.sendCommand('Sway:Adjust', { characterId: 'char-krix', currency: 'Chi', delta: -1 });
    playerClient.sendCommand('Drama:RelieveStress', { characterId: 'char-krix', facet: 'Trial', amount: 1 });

    // Referee deals private card, starts ordeal, draws stage, applies wound, grants reward, interprets quest spread
    bridge.client.sendCommand('Deck:Initialize', { deckCount: 1 });
    bridge.client.sendCommand('Card:Draw', { targetActorId: 'player-1', count: 1, cardContext: 'Ordeal' });
    bridge.client.sendCommand('Ordeal:Start', { stakes: 'Medium', participants: ['player-1'] });
    bridge.client.sendCommand('Ordeal:DrawStage', { cardCount: 2 });
    bridge.client.sendCommand('Wound:Apply', { characterId: 'char-krix', stakes: 'Low', totalPips: 3 });
    bridge.client.sendCommand('IChing:GrantReward', { characterId: 'char-krix', gainKey: 'g1', rewardType: 'Karma', amount: 2 });
    bridge.client.sendCommand('Spread:InterpretQuest', {
        title: 'Gate of Brass',
        spread: {
            spreadDefinition: { id: 'quest-6-card' },
            cards: [
                { position: 'L1', card: { data: { Tao: [1, 0] } } },
                { position: 'L2', card: { data: { Tao: [0, 0] } } },
                { position: 'L3', card: { data: { Tao: [1, 1] } } },
                { position: 'L4', card: { data: { Tao: [1, 0] } } },
                { position: 'L5', card: { data: { Tao: [0, 1] } } },
                { position: 'L6', card: { data: { Tao: [1, 1] } } }
            ]
        },
        hexagrams: buildMinimalHexagramTable()
    });

    assert.equal(playerClient.projection.characters['char-krix'].sway.Chi, 3);
    assert.equal(playerClient.projection.characters['char-krix'].sway.Karma, 2);
    assert.equal(playerClient.projection.characters['char-krix'].stressState['Facet:Trial'].stress, 1);
    assert.equal(playerClient.projection.characters['char-krix'].wounds.length, 1);
    assert.equal(playerClient.projection.privateHand.length, 1);
    assert.equal(playerClient.projection.table.activeOrdeal.status, 'Active');
    assert.equal(Object.keys(playerClient.projection.plots).length, 1);

    // Security non-disclosure assertions
    assert.equal(playerClient.projection.refereeSecrets, undefined);
    assert.equal(playerClient.projection.table.tokens['tok-hidden'], undefined);
    assert.ok(bridge.client.projection.table.tokens['tok-hidden']);
    assert.equal(bridge.client.projection.refereeSecrets.notes.vault, 'Secret code 77');

    // Snapshot & restore parity
    const snap = await bridge.fetchSnapshot();
    bridge.client.sendCommand('Referee:SetSecretNote', { key: 'temp', note: 'mutated' });
    assert.equal(bridge.client.projection.refereeSecrets.notes.temp, 'mutated');
    await bridge.restoreSnapshot(snap);
    assert.equal(bridge.client.projection.refereeSecrets.notes.temp, undefined);
    assert.equal(bridge.client.projection.refereeSecrets.notes.vault, 'Secret code 77');
    bridge.dispose();
});

test('Stage 5 integration: buildCharacterSheetAvatar, buildDescendantSheetAvatar & formatSessionLogEntry', async () => {
    const builtChar = await buildCharacterSheetAvatar({
        id: 'pc-1',
        name: 'Vesper',
        incarna: 'Wyrd',
        species: 'Human'
    });
    assert.ok(builtChar.avatar);
    assert.ok(builtChar.measurements.heightDisplay);

    const builtBug = await buildCharacterSheetAvatar({
        id: 'pc-2',
        name: 'Krix',
        incarna: 'Trial',
        species: { name: 'Insectoid', bodyPlan: 'insectoid', incarna: 'Trial' }
    });
    assert.ok(builtBug.avatar);
    assert.equal(builtBug.measurements.formation, 'Trial');

    const builtDesc = await buildDescendantSheetAvatar({
        id: 'desc-1',
        name: 'Shard Halberd',
        descendantType: 'Item',
        incarna: 'Phoenix'
    });
    assert.ok(builtDesc.avatar);

    const logLine = formatSessionLogEntry({
        type: 'Test:Resolved',
        payload: { result: { facet: 'Trial', outcome: 'Success', total: 17, diceRolls: [5, 6] } }
    });
    assert.match(logLine, /Trial/);
    assert.match(logLine, /17/);
});
