import test from 'node:test';
import assert from 'node:assert/strict';

import T13NE from '../src/t13ne/T13NE.js';
import { T13Session, T13_SESSION_SCHEMA_VERSION } from '../src/t13ne/modules/systems/T13Session.js';
import {
    T13_SPECIES_CATEGORIES,
    createSpeciesDescendant,
    createHumanSpeciesDescendant,
    validateSpeciesDescendant,
    resolveCharacterSpecies
} from '../src/t13ne/modules/characters/T13SpeciesDescendant.js';
import { adaptWormholeSpeciesToT13Descendant } from '../src/t13ne/games/wormhole-racers/WormholeSpeciesAdapter.js';
import T13Boons from '../src/t13ne/modules/mechanics/t13ne-boon.js';
import T13Dice from '../src/t13ne/modules/mechanics/t13ne-dice.js';
import T13Wounds from '../src/t13ne/modules/mechanics/t13ne-wounds.js';
import T13Stress from '../src/t13ne/modules/mechanics/t13ne-stress.js';
import T13SwayAccount from '../src/t13ne/modules/mechanics/T13SwayAccount.js';

test('core T13 mechanics, species, session, and headless T13NE import cleanly in Node', async () => {
    assert.ok(T13Boons && typeof T13Boons.getBoonValue === 'function');
    assert.ok(T13Dice && typeof T13Dice.RNG === 'function');
    assert.ok(T13Wounds && T13Stress && T13SwayAccount);

    await T13NE.initializeEngine({ mode: 'headless', loadCodex: false, loadModules: false });
    assert.equal(T13NE.bootMode, 'headless');
    assert.equal(T13NE.viewManager, null);
    assert.equal(T13NE.loaderManager, null);
    assert.equal(T13NE.gameAdapter, null);
});

test('two concurrent T13Session instances run isolated seeded timelines without singleton bleed', () => {
    const a1 = new T13Session({ sessionId: 'alpha-1', seed: 'shared-seed' });
    const a2 = new T13Session({ sessionId: 'alpha-2', seed: 'shared-seed' });
    const b1 = new T13Session({ sessionId: 'beta-1', seed: 'different-seed' });

    const joinA1 = a1.dispatch({ id: 'c1', sessionId: 'alpha-1', actorId: 'alice', type: 'Session:Join', payload: { name: 'Alice' } });
    const joinA2 = a2.dispatch({ id: 'c1', sessionId: 'alpha-2', actorId: 'alice', type: 'Session:Join', payload: { name: 'Alice' } });
    const joinB1 = b1.dispatch({ id: 'c1', sessionId: 'beta-1', actorId: 'bob', type: 'Session:Join', payload: { name: 'Bob' } });
    assert.equal(joinA1.ok, true);
    assert.equal(joinA2.ok, true);
    assert.equal(joinB1.ok, true);

    const drawA1 = a1.dispatch({ id: 'd1', sessionId: 'alpha-1', actorId: 'alice', expectedRevision: 1, type: 'RNG:Draw', payload: { count: 6, sides: 13 } });
    // Advance beta extra times to verify no bleed into alpha-2
    b1.dispatch({ id: 'b-extra-1', sessionId: 'beta-1', actorId: 'bob', expectedRevision: 1, type: 'RNG:Draw', payload: { count: 10, sides: 20 } });
    const drawB1 = b1.dispatch({ id: 'd1', sessionId: 'beta-1', actorId: 'bob', expectedRevision: 2, type: 'RNG:Draw', payload: { count: 6, sides: 13 } });
    const drawA2 = a2.dispatch({ id: 'd1', sessionId: 'alpha-2', actorId: 'alice', expectedRevision: 1, type: 'RNG:Draw', payload: { count: 6, sides: 13 } });

    assert.deepEqual(drawA1.result.results, drawA2.result.results);
    assert.notDeepEqual(drawA1.result.results, drawB1.result.results);
    assert.equal(a1.revision, 2);
    assert.equal(b1.revision, 3);
    assert.equal(a1.getProjection({ role: 'referee' }).actors.bob, undefined);
});

test('T13Session enforces revision checks, idempotent deduplication, role authority, and rollback', () => {
    const session = new T13Session({ sessionId: 'sec-room', seed: 'retry-seed' });
    session.dispatch({ id: 'j1', sessionId: 'sec-room', actorId: 'alice', expectedRevision: 0, type: 'Session:Join', payload: { name: 'Alice' } });
    session.dispatch({ id: 'j2', sessionId: 'sec-room', actorId: 'bob', expectedRevision: 1, type: 'Session:Join', payload: { name: 'Bob', role: 'referee' } });

    // Non-referee self-join cannot escalate to referee role
    assert.equal(session.getActorRole('bob'), 'player');

    // Wrong sessionId
    const wrongSession = session.dispatch({ id: 'bad-sess', sessionId: 'other-room', actorId: 'alice', type: 'RNG:Draw', payload: {} });
    assert.equal(wrongSession.ok, false);
    assert.equal(wrongSession.error, 'SESSION_MISMATCH');

    // Optimistic revision conflict
    const stale = session.dispatch({ id: 'stale-1', sessionId: 'sec-room', actorId: 'alice', expectedRevision: 0, type: 'RNG:Draw', payload: {} });
    assert.equal(stale.ok, false);
    assert.equal(stale.error, 'REVISION_CONFLICT');
    assert.equal(stale.currentRevision, 2);

    // Role authorization enforced
    const forbiddenDeal = session.dispatch({
        id: 'forbid-deal',
        sessionId: 'sec-room',
        actorId: 'alice',
        expectedRevision: 2,
        type: 'Hand:DealPrivate',
        payload: { targetActorId: 'alice', count: 2 }
    });
    assert.equal(forbiddenDeal.ok, false);
    assert.equal(forbiddenDeal.error, 'FORBIDDEN');

    const forbiddenNote = session.dispatch({
        id: 'forbid-note',
        sessionId: 'sec-room',
        actorId: 'alice',
        expectedRevision: 2,
        type: 'Referee:SetSecretNote',
        payload: { key: 'plot', note: 'spoiler' }
    });
    assert.equal(forbiddenNote.ok, false);
    assert.equal(forbiddenNote.error, 'FORBIDDEN');

    // Character ownership enforcement
    session.dispatch({
        id: 'char-a',
        sessionId: 'sec-room',
        actorId: 'alice',
        expectedRevision: 2,
        type: 'Character:Register',
        payload: { character: { id: 'char-alice', name: 'Aeliana' } }
    });
    const forbiddenEdit = session.dispatch({
        id: 'char-hijack',
        sessionId: 'sec-room',
        actorId: 'bob',
        expectedRevision: 3,
        type: 'Character:Update',
        payload: { characterId: 'char-alice', patch: { name: 'Hacked' } }
    });
    assert.equal(forbiddenEdit.ok, false);
    assert.equal(forbiddenEdit.error, 'FORBIDDEN');

    // Rollback on handler error leaves state and RNG intact
    session.registerCommand('Test:ThrowAfterMutate', {
        roles: ['referee'],
        handler: ({ state, session: s }) => {
            s.nextRandom();
            state.table.corrupted = true;
            throw new Error('boom');
        }
    });
    const rngBeforeFail = session._rng.getState();
    const failed = session.dispatch({ id: 'fail-1', sessionId: 'sec-room', actorId: 'referee', expectedRevision: 3, type: 'Test:ThrowAfterMutate' });
    assert.equal(failed.ok, false);
    assert.equal(session.revision, 3);
    assert.equal(session._rng.getState(), rngBeforeFail);
    assert.equal(session._state.table.corrupted, undefined);

    // Idempotent retry returns exact same outcome and does not re-roll or deal twice
    const deal1 = session.dispatch({
        id: 'deal-once',
        sessionId: 'sec-room',
        actorId: 'referee',
        expectedRevision: 3,
        type: 'Hand:DealPrivate',
        payload: { targetActorId: 'alice', count: 3 }
    });
    assert.equal(deal1.ok, true);
    assert.equal(deal1.duplicate, false);
    assert.equal(deal1.revision, 4);

    const dealRetry = session.dispatch({
        id: 'deal-once',
        sessionId: 'sec-room',
        actorId: 'referee',
        expectedRevision: 3,
        type: 'Hand:DealPrivate',
        payload: { targetActorId: 'alice', count: 3 }
    });
    assert.equal(dealRetry.ok, true);
    assert.equal(dealRetry.duplicate, true);
    assert.equal(dealRetry.revision, 4);
    assert.deepEqual(dealRetry.result, deal1.result);
    assert.equal(session.getProjection({ role: 'player', actorId: 'alice' }).privateHand.length, 3);
});

test('T13Session enforces private hand and referee secret projection filtering and snapshot round-trip', () => {
    const original = new T13Session({ sessionId: 'table-1', seed: 'snapshot-seed' });
    original.dispatch({ id: 'j-a', sessionId: 'table-1', actorId: 'alice', type: 'Session:Join', payload: { name: 'Alice' } });
    original.dispatch({ id: 'j-b', sessionId: 'table-1', actorId: 'bob', type: 'Session:Join', payload: { name: 'Bob' } });
    original.dispatch({
        id: 'deal-a',
        sessionId: 'table-1',
        actorId: 'referee',
        type: 'Hand:DealPrivate',
        payload: { targetActorId: 'alice', cards: [{ id: 'c-d7', suit: 'Diamonds', pips: 7 }] }
    });
    original.dispatch({
        id: 'deal-b',
        sessionId: 'table-1',
        actorId: 'referee',
        type: 'Hand:DealPrivate',
        payload: { targetActorId: 'bob', cards: [{ id: 'c-s13', suit: 'Spades', pips: 13 }] }
    });
    original.dispatch({
        id: 'secret-1',
        sessionId: 'table-1',
        actorId: 'referee',
        type: 'Referee:SetSecretNote',
        payload: { key: 'villain', note: 'The duke is an enigma construct.' }
    });

    const aliceProj = original.getProjection({ role: 'player', actorId: 'alice' });
    assert.deepEqual(aliceProj.privateHand, [{ id: 'c-d7', suit: 'Diamonds', pips: 7 }]);
    assert.equal(aliceProj.publicHandCounts.bob, 1);
    assert.equal(aliceProj.privateHands, undefined);
    assert.equal(aliceProj.refereeSecrets, undefined);

    const aliceEvents = original.getEventsSince(0, { role: 'player', actorId: 'alice' });
    assert.ok(aliceEvents.some(e => e.type === 'Hand:DealtPrivate' && e.payload.targetActorId === 'alice'));
    assert.ok(!aliceEvents.some(e => e.type === 'Hand:DealtPrivate' && e.payload.targetActorId === 'bob'));
    assert.ok(!aliceEvents.some(e => e.type === 'Referee:SecretNoteUpdated'));

    const refProj = original.getProjection({ role: 'referee', actorId: 'referee' });
    assert.equal(refProj.refereeSecrets.notes.villain, 'The duke is an enigma construct.');
    assert.deepEqual(refProj.privateHands.bob, [{ id: 'c-s13', suit: 'Spades', pips: 13 }]);

    // JSON round-trip restores state, dedupe, and exact subsequent RNG stream
    const snap = original.snapshot();
    assert.equal(snap.schemaVersion, T13_SESSION_SCHEMA_VERSION);
    const json = JSON.stringify(snap);
    const restored = T13Session.fromSnapshot(json);

    assert.equal(restored.revision, original.revision);
    assert.deepEqual(restored.getProjection({ role: 'referee' }), refProj);

    const dupAfterRestore = restored.dispatch({ id: 'deal-b', sessionId: 'table-1', actorId: 'referee', type: 'Hand:DealPrivate', payload: {} });
    assert.equal(dupAfterRestore.duplicate, true);

    const nextOrig = original.dispatch({ id: 'rng-next', sessionId: 'table-1', actorId: 'alice', type: 'RNG:Draw', payload: { count: 8, sides: 13 } });
    const nextRestored = restored.dispatch({ id: 'rng-next', sessionId: 'table-1', actorId: 'alice', type: 'RNG:Draw', payload: { count: 8, sides: 13 } });
    assert.deepEqual(nextOrig.result.results, nextRestored.result.results);
});

test('T13SpeciesDescendant and WormholeSpeciesAdapter preserve T13 vs Wormhole Racers boundaries', () => {
    assert.ok(T13_SPECIES_CATEGORIES.includes('human'));
    assert.ok(T13_SPECIES_CATEGORIES.includes('alien'));
    assert.ok(T13_SPECIES_CATEGORIES.includes('fantasy'));

    const human = createHumanSpeciesDescendant();
    assert.equal(human.descendantType, 'Species');
    assert.equal(human.category, 'human');
    assert.equal(human.incarna, 'Nature');
    assert.equal(human.formationMaterial, 'flesh');

    const resolvedHuman = resolveCharacterSpecies({ facetweb: { Stats: { Nature: { Boon: 13 } } } }, human);
    assert.ok(Math.abs(resolvedHuman.size.heightCm - 167.64) < 1e-6);
    assert.equal(resolvedHuman.formation, 'Nature');

    // Character Formation takes precedence over Species Formation
    const crystalSpecies = createSpeciesDescendant({
        id: 't13-golem-kin',
        name: 'Stoneborn',
        category: 'fantasy',
        incarna: 'Burden',
        voiceProfile: { preset: 'deep-resonator', pitchSemitones: -4, dryWet: 0.5 }
    });
    const resolvedOverride = resolveCharacterSpecies({ incarna: 'Phoenix' }, crystalSpecies);
    assert.equal(resolvedOverride.formation, 'Phoenix');
    assert.equal(resolvedOverride.material, 'fire');
    assert.equal(resolvedOverride.voiceProfile.preset, 'deep-resonator');

    const invalid = validateSpeciesDescendant({ name: 'Bad', incarna: 'NotAFacet' });
    assert.equal(invalid.valid, false);

    // Wormhole Racers subset maps onto T13 'human' and 'alien'
    const wrHumans = adaptWormholeSpeciesToT13Descendant({ id: 'SPECIES_HUMANS', name: 'Humans', derivesFrom: 'ARCHETYPE_BIOLOGICAL_CARBON' });
    assert.equal(wrHumans.category, 'human');
    assert.equal(wrHumans.sourceMetadata.source, 'wormhole-racers');

    const wrKathorri = adaptWormholeSpeciesToT13Descendant({ id: 'SPECIES_KATHORRI', name: 'Kathorri', derivesFrom: 'ARCHETYPE_BIOLOGICAL_CRYSTALLINE' });
    assert.equal(wrKathorri.category, 'alien');
    assert.equal(wrKathorri.incarna, 'Burden');
    assert.equal(wrKathorri.voiceProfile.preset, 'hive-chorus');

    const wrThf = adaptWormholeSpeciesToT13Descendant({ id: 'SPECIES_THFTHF', name: 'Thf-Thf' });
    assert.equal(wrThf.category, 'alien');
    assert.equal(wrThf.incarna, 'Gossamer');

    const wrVemlek = adaptWormholeSpeciesToT13Descendant({ id: 'SPECIES_VEMLEK', name: 'Vemleki' });
    assert.equal(wrVemlek.category, 'alien');
    assert.equal(wrVemlek.incarna, 'Trial');
    assert.equal(wrVemlek.formationMaterial, 'metal');

    const wrFirst = adaptWormholeSpeciesToT13Descendant({ id: 'SPECIES_FIRST_RELIC', name: 'The First (Relic Artifacts)' });
    assert.equal(wrFirst.category, 'alien');
    assert.equal(wrFirst.bodyPlan, 'spider');

    // Session Species:Register command validates and stores canonical species
    const session = new T13Session({ sessionId: 'sp-room', seed: 'sp-seed' });
    const reg = session.dispatch({
        id: 'reg-sp',
        sessionId: 'sp-room',
        actorId: 'referee',
        type: 'Species:Register',
        payload: wrKathorri
    });
    assert.equal(reg.ok, true);
    assert.equal(session.getProjection().speciesDescendants.SPECIES_KATHORRI.incarna, 'Burden');
});
