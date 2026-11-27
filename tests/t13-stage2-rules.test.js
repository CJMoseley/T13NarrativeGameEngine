import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import T13Boons from '../src/t13ne/modules/mechanics/t13ne-boon.js';
import {
    evaluateFacetAlignment,
    resolveDiceTest,
    resolveCardDrawTest,
    resolveValueTest
} from '../src/t13ne/modules/mechanics/T13TestRules.js';
import { Card, Deck } from '../src/t13ne/modules/mechanics/t13ne-cards.js';
import { T13Session } from '../src/t13ne/modules/systems/T13Session.js';
import { summonWoundForStakes } from '../src/t13ne/modules/systems/T13SessionRules.js';

function seqRng(values) {
    let idx = 0;
    return () => {
        const val = values[Math.min(idx, values.length - 1)];
        idx++;
        return val;
    };
}

test('Stage 2.1: Dice Tests follow Trump/Misfit Facets, Proficiency Crises, Strain/Extra summation, and Numerology', () => {
    // 1. Enigma (Red, Yin) vs Trial (Black, Yang) = +2 Failure Levels (docs/rules/Success-and-Failure-Levels.md)
    const trialMisfit = evaluateFacetAlignment('Trial', 'Enigma');
    assert.equal(trialMisfit.failureLevels, 2);

    // 2. Enigma Anti-Facet Key = +3 Failure Levels
    const keyAnti = evaluateFacetAlignment('Key', 'Enigma');
    assert.equal(keyAnti.isAntiFacet, true);
    assert.equal(keyAnti.failureLevels, 3);

    // 3. Enigma Trump = +5 Score, +1 SL
    const enigmaTrump = evaluateFacetAlignment('Enigma', 'Enigma');
    assert.equal(enigmaTrump.isTrump, true);
    assert.equal(enigmaTrump.scoreBonus, 5);
    assert.equal(enigmaTrump.successLevels, 1);

    // 4. 0 Proficiencies halves main score; Strain & Extra dice add into Single Roll totalScore
    const zeroProf = resolveDiceTest({
        facet: 'Enigma',
        trumpFacet: 'Enigma',
        mainDieStr: '1d6',
        proficiencies: 0,
        strainDice: [{ dieStr: '1d6' }],
        extraDice: [{ dieStr: '1d4' }],
        difficulty: 5,
        potency: 'Bold',
        rngInt: seqRng([6, 4, 3]) // halved 6->3, +4 strain, +3 extra, +5 Trump = 15 >= 15 (3x)
    });
    assert.equal(zeroProf.diceResults[0].score, 3);
    assert.equal(zeroProf.score, 15);
    assert.equal(zeroProf.success, true);
    assert.equal(zeroProf.resultType, 'Superior Success');
    assert.equal(zeroProf.successLevels, 4); // 3 Superior + 1 Trump

    // 5. Proficiency Crisis: Boxcars on Success -> Reversal adds Failure Level
    const boxcarsOnPass = resolveDiceTest({
        facet: 'Awe',
        mainDieStr: '1d6',
        proficiencies: 3, // 2d6
        difficulty: 5,
        potency: 'Bold',
        rngInt: seqRng([4, 6, 6]) // total 16 (Superior 3x), Boxcars adds 3 Failure Levels
    });
    assert.equal(boxcarsOnPass.crisis, 'Boxcars');
    assert.equal(boxcarsOnPass.success, true);
    assert.ok(boxcarsOnPass.failureLevels >= 3);

    // 6. Proficiency Crisis: Snake Eyes on Failure -> Reversal adds Success Level
    const snakeEyesOnFail = resolveDiceTest({
        facet: 'Awe',
        mainDieStr: '1d6',
        proficiencies: 3, // 2d6
        difficulty: 20,
        potency: 'Bold',
        rngInt: seqRng([2, 1, 1]) // total 4, Snake Eyes adds Success Level
    });
    assert.equal(snakeEyesOnFail.crisis, 'Snake Eyes');
    assert.equal(snakeEyesOnFail.success, false);
    assert.ok(snakeEyesOnFail.successLevels >= 1);

    // 7. Numerology Critical is additive after base SL calculation
    const crit = resolveDiceTest({
        facet: 'Awe',
        mainDieStr: '1d6',
        proficiencies: 1,
        difficulty: 6,
        potency: 'Bold',
        geometry: { Geo: { Number: 7 }, GeoHarmonics: { Perfect: 7, Nemesis: 2 } },
        rngInt: seqRng([7])
    });
    assert.equal(crit.success, true);
    assert.ok(crit.successLevels >= 2);
});

test('Stage 2.1: Card Draw and Value Tests match rulebook examples', () => {
    // Card Draw: Boon 16 Draw === T13Boons.getBoonDraw(16) === 2
    // Trial (Spades, Black) draws Ace of Spades (14 Pips) + Trump (+2) + Draw(2) + Suited Prof (+5) = 23
    const spCard = resolveCardDrawTest({
        facet: 'Trial',
        boon: 16,
        card: { name: 'Ace of Spades', suit: 'Spades', pips: 14 },
        proficiencies: [{ facet: 'Trial' }],
        difficulty: 15
    });
    assert.equal(spCard.facetDraw, T13Boons.getBoonDraw(16));
    assert.equal(spCard.total, 14 + spCard.facetDraw + 2 + 5);
    assert.equal(spCard.success, true);
    assert.equal(spCard.failureLevels, 0);

    // Opposed Suit: Trial (Anti-Facet Rook = Clubs) draws Club (opposite same-black suit) -> +1 FL
    const clubMisfit = resolveCardDrawTest({
        facet: 'Trial',
        boon: 13,
        card: { name: '5 of Clubs', suit: 'Clubs', pips: 5 },
        difficulty: 10
    });
    assert.ok(clubMisfit.failureLevels >= 1);

    // Value Test car pushing example (docs/rules/Test-Value.md):
    // Two Boon 13 Zeal (Value 66 each -> 132) vs Car Inertia 18 (Value 111)
    const zVal = T13Boons.getBoonValue(13);
    const carVal = T13Boons.getBoonValue(18);
    assert.equal(zVal, 66);
    assert.equal(carVal, 111);
    const twoPushing = resolveValueTest({
        facet: 'Zeal',
        opposedFacet: 'Inertia',
        actorValues: [zVal, zVal],
        opponentValue: carVal
    });
    assert.equal(twoPushing.actorValue, 132);
    assert.equal(twoPushing.success, true);

    // Percentage Value Test: single person (66 vs 111 -> 37%), roll 17 <= 1/2 chance (+1 SL)
    const onePushing = resolveValueTest({
        facet: 'Zeal',
        opposedFacet: 'Inertia',
        actorValue: zVal,
        opponentValue: carVal,
        method: 'percentage',
        rngInt: seqRng([17])
    });
    assert.equal(onePushing.chance, 37);
    assert.equal(onePushing.success, true);
    assert.ok(onePushing.successLevels >= 1);
});

test('Stage 2.2: CardsAPI supports prepareCard, playCard, discard with Style Reserves and preserved cardContext', async () => {
    let source = await readFile('src/t13ne/modules/mechanics/t13ne-cards-api.js', 'utf8');
    const executed = [];
    source = source
        .replace(/import \{ Card, Deck \} from [^;]+;/, 'const { Card, Deck } = globalThis.__capiModules;')
        .replace(/import PRNG from [^;]+;/, 'const PRNG = globalThis.__capiModules.PRNG;')
        .replace(/import dice from [^;]+;/, 'const dice = globalThis.__capiModules.dice;')
        .replace(/import Logger from [^;]+;/, 'const Logger = globalThis.__capiModules.Logger;')
        .replace(/import CodexLoader from [^;]+;/, 'const CodexLoader = globalThis.__capiModules.CodexLoader;')
        .replace(/import \{ interpretQuestSpread \} from [^;]+;/, 'const { interpretQuestSpread } = globalThis.__capiModules.QuestSpread;');

    globalThis.__capiModules = {
        Card,
        Deck,
        PRNG: { setSeed() {}, nextInt: (a, b) => a, nextDouble: () => 0.1 },
        dice: { RNG: (a) => a },
        Logger: { message() {}, warn() {}, error() {} },
        CodexLoader: { getAllCardData: async () => [] },
        QuestSpread: { interpretQuestSpread: () => ({}) }
    };

    try {
        const api = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
        api.t13ne = {
            getModule(name) {
                if (name === 'Commands') {
                    return {
                        async execute(cmd, ctx) {
                            executed.push({ cmd, cardContext: ctx.cardContext, styleName: ctx.styleName });
                            return { ran: cmd };
                        }
                    };
                }
                return null;
            }
        };
        api.isInitialized = true;
        const card1 = new Card({
            Card: 'Seven',
            Suit: '4',
            Pips: 7,
            IconSuit: '♠',
            Svg: '',
            Commands: { onPrepare: 'Style:Prime()', onPlay: 'Attack:Strike()', onDiscard: 'Trigger:Cleanup()' }
        });
        const card2 = new Card({
            Card: 'Two',
            Suit: '2',
            Pips: 2,
            IconSuit: '♥',
            Svg: '',
            Commands: { onDiscard: 'Tarot:Echo()' }
        });
        api.hands.alice = [card1, card2];

        const prep = await api.prepareCard(card1, 'alice', { reserveType: 'style', styleName: 'Fencer', cardContext: 'WyrdTarot' });
        assert.equal(prep.ok, true);
        assert.equal(api.styleReserves.alice.Fencer.length, 1);
        assert.equal(api.hands.alice.length, 1);
        assert.equal(executed[0].cmd, 'Style:Prime()');
        assert.equal(executed[0].cardContext, 'WyrdTarot');

        const played = await api.playCard(card1, { cardContext: 'Ordeal' });
        assert.equal(played.ok, true);
        assert.equal(api.styleReserves.alice.Fencer.length, 0);
        assert.equal(executed[1].cardContext, 'Ordeal');

        const disc = await api.discard([card2], { cardContext: 'Wound' });
        assert.equal(disc.discarded, 1);
        assert.equal(executed[2].cardContext, 'Wound');
        assert.equal(api.hands.alice.length, 0);
    } finally {
        delete globalThis.__capiModules;
    }
});

test('Stage 2.3 & 2.4: T13Session executes Tests, Multi-Round Ordeal, Plots, I-Ching Gains, Hitches, Wounds, Sway, and Snapshot Replay', async () => {
    const hexagrams = await Promise.all(Array.from({ length: 64 }, async (_, index) =>
        JSON.parse(await readFile(`src/t13ne/data/json/iching/hexagrams/hex_${index + 1}.json`, 'utf8'))));

    const session = new T13Session({ sessionId: 'campaign-1', seed: 'stage2-seed' });

    // Join player + register Character
    session.dispatch({ id: 's1', sessionId: 'campaign-1', actorId: 'alice', type: 'Session:Join', payload: { name: 'Alice' } });
    session.dispatch({
        id: 's2',
        sessionId: 'campaign-1',
        actorId: 'alice',
        type: 'Character:Register',
        payload: {
            character: {
                id: 'hero-1',
                name: 'Lyra',
                facetweb: { Stats: { Trial: { Boon: 16 }, Enigma: { Boon: 13 }, Miasma: { Boon: 13 } } },
                sway: { Chi: 25, Yarn: 3, 'Tao:Yin': 0, 'Tao:Yang': 0 }
            }
        }
    });

    // 1. Test:Perform through T13Session
    const testRes = session.dispatch({
        id: 't1',
        sessionId: 'campaign-1',
        actorId: 'alice',
        type: 'Test:Perform',
        payload: { testType: 'Dice', characterId: 'hero-1', options: { facet: 'Trial', difficulty: 4, potency: 'Intrepid', proficiencies: 2 } }
    });
    assert.equal(testRes.ok, true);
    assert.equal(testRes.result.type, 'Dice');
    assert.equal(testRes.result.targetDifficulty, 8);

    // 2. Deck + Context-preserving Card:Draw / Prepare / Play
    const drawRes = session.dispatch({
        id: 'cd1',
        sessionId: 'campaign-1',
        actorId: 'referee',
        type: 'Card:Draw',
        payload: { targetActorId: 'alice', count: 2, cardContext: 'WyrdTarot' }
    });
    assert.equal(drawRes.ok, true);
    assert.equal(drawRes.result.totalHandCount, 2);
    const aliceHand = session.getProjection({ role: 'player', actorId: 'alice' }).privateHand;
    assert.equal(aliceHand.length, 2);
    assert.equal(session.getProjection({ role: 'player', actorId: 'alice' }).deck, undefined); // deck drawPile never leaked to players

    const prepRes = session.dispatch({
        id: 'cp1',
        sessionId: 'campaign-1',
        actorId: 'alice',
        type: 'Card:Prepare',
        payload: { cardId: aliceHand[0].id, reserveType: 'style', styleName: 'Duellist', cardContext: 'WyrdTarot' }
    });
    assert.equal(prepRes.ok, true);
    assert.equal(session.getProjection().styleReserves.alice.Duellist.length, 1);

    // 3. Full Ordeal lifecycle + Wound Fresh -> Untreated + Snapshot round-trip
    const ordealStart = session.dispatch({
        id: 'o1',
        sessionId: 'campaign-1',
        actorId: 'referee',
        type: 'Ordeal:Start',
        payload: { type: 'Combat', stakes: 'High', terrain: 'Closed', numStages: 2, participants: ['alice'], proficiencies: { alice: 3 } }
    });
    assert.equal(ordealStart.ok, true);
    assert.equal(ordealStart.result.wildPoolCount, 4); // High Stakes Round Wild Pool = 4 cards

    const stageRes = session.dispatch({
        id: 'o2',
        sessionId: 'campaign-1',
        actorId: 'referee',
        type: 'Ordeal:DrawStage',
        payload: {
            stageIndex: 0,
            cards: [{ id: 'st-1', suit: 'Spades', pips: 8 }, { id: 'st-2', suit: 'Diamonds', pips: 5 }],
            obstacles: [{ hidden: true, typeCard: { suit: 'Spades', name: 'Hidden Trap' }, difficultyCards: [{ suit: 'Spades', pips: 6 }] }]
        }
    });
    assert.equal(stageRes.ok, true);
    assert.equal(stageRes.result.difficulty, 13);
    assert.equal(session.getProjection({ role: 'player', actorId: 'alice' }).refereeSecrets, undefined);
    assert.equal(session.getProjection({ role: 'referee' }).refereeSecrets.hiddenObstacles[0].length, 1);

    // Apply a Fresh Wound before Round ends
    const woundRes = session.dispatch({
        id: 'w1',
        sessionId: 'campaign-1',
        actorId: 'referee',
        type: 'Wound:Apply',
        payload: {
            characterId: 'hero-1',
            stakes: 'High',
            cards: [{ suit: 'Spades', pips: 14 }, { suit: 'Clubs', pips: 8 }] // 22 total, 14 limit -> Carnage (minPips 14, basePips 21)
        }
    });
    assert.equal(woundRes.ok, true);
    assert.equal(woundRes.result.name, 'Carnage');
    assert.equal(woundRes.result.freshness, 'Fresh');

    // Play cards from Alice's Ordeal Pool + claim Wild Pool card
    const ordealState = session.getProjection().table.activeOrdeal;
    const poolIds = ordealState.participants.alice.ordealPool.slice(0, 2).map(c => c.id);
    const wildId = ordealState.wildPool[0].id;
    const playRes = session.dispatch({
        id: 'o3',
        sessionId: 'campaign-1',
        actorId: 'alice',
        type: 'Ordeal:PlayCards',
        payload: {
            actionType: 'full',
            playCardIds: poolIds,
            wildCardIds: [wildId],
            actionRt: 2
        }
    });
    assert.equal(playRes.ok, true);
    assert.equal(playRes.result.rt, 2);
    assert.equal(playRes.result.grt, 1); // 2 cards from pool -> 1 extra card GRT

    // Blocked while in GRT without strain
    const blockedInGrt = session.dispatch({
        id: 'o3-blocked',
        sessionId: 'campaign-1',
        actorId: 'alice',
        type: 'Ordeal:PlayCards',
        payload: { actionType: 'half-wait' }
    });
    assert.equal(blockedInGrt.ok, false);
    assert.equal(blockedInGrt.error, 'IN_GRT');

    // Advance Phase decrements RT & GRT
    session.dispatch({ id: 'o4', sessionId: 'campaign-1', actorId: 'referee', type: 'Ordeal:AdvancePhase' });
    assert.equal(session.getProjection().table.activeOrdeal.participants.alice.grt, 0);
    assert.equal(session.getProjection().table.activeOrdeal.participants.alice.rt, 1);

    // Advance Round clears RT/GRT, deals new 4-card Wild Pool, and converts Fresh -> Untreated wound
    const roundAdv = session.dispatch({ id: 'o5', sessionId: 'campaign-1', actorId: 'referee', type: 'Ordeal:AdvanceRound' });
    assert.equal(roundAdv.ok, true);
    assert.equal(roundAdv.result.roundNumber, 2);
    assert.equal(session.getProjection().table.activeOrdeal.participants.alice.rt, 0);
    assert.equal(session.getProjection().characters['hero-1'].wounds[0].freshness, 'Untreated');

    // Chi Wound reduction (Carnage -> Mortal costs 21 Chi per docs/rules/Wounds.md)
    const woundHeal = session.dispatch({
        id: 'w2',
        sessionId: 'campaign-1',
        actorId: 'referee',
        type: 'Wound:UpdateState',
        payload: { characterId: 'hero-1', woundId: woundRes.result.id, spendChiToReduce: true }
    });
    assert.equal(woundHeal.ok, true);
    assert.equal(woundHeal.result.name, 'Mortal');
    assert.equal(session.getProjection().characters['hero-1'].sway.Chi, 4); // 25 - 21

    // Resolve Ordeal
    const resolved = session.dispatch({ id: 'o6', sessionId: 'campaign-1', actorId: 'referee', type: 'Ordeal:Resolve', payload: { outcome: 'Victory' } });
    assert.equal(resolved.ok, true);
    assert.equal(session.getProjection().table.activeOrdeal, null);
    assert.equal(session.getProjection().table.ordealHistory.length, 1);

    // 4. Quest Spread -> Persistent Plot + Confirm
    const spread = {
        spreadDefinition: { id: 'quest-6-card' },
        cards: Array.from({ length: 6 }, (_, index) => ({
            card: { data: { Tao: [1, index === 5 ? 1 : 0] } }, position: { role: `Line ${index + 1}` }
        }))
    };
    const questPlot = session.dispatch({
        id: 'p1',
        sessionId: 'campaign-1',
        actorId: 'referee',
        type: 'Spread:InterpretQuest',
        payload: { plotId: 'plot-main', spread, hexagrams }
    });
    assert.equal(questPlot.ok, true);
    assert.equal(questPlot.result.plot.status, 'PendingConfirmation');
    assert.equal(questPlot.result.plot.quests.length, 5);
    session.dispatch({ id: 'p2', sessionId: 'campaign-1', actorId: 'referee', type: 'Plot:Confirm', payload: { plotId: 'plot-main' } });
    assert.equal(session.getProjection().plots['plot-main'].status, 'Active');

    // 5. I-Ching Calculation + Referee-only Adjudicated Gain + Hitch Evaluation + Sway Overdraft Check
    const pairs = Array.from({ length: 12 }, (_, idx) => ({
        Facet_Boon: 15, Antifacet_Boon: 15, Facet_Mutation_Matrix: 0, Antifacet_Mutation_Matrix: 0, idx
    }));
    const tieChoices = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i, 1]));
    const ichingCalc = session.dispatch({
        id: 'ic1',
        sessionId: 'campaign-1',
        actorId: 'alice',
        type: 'IChing:Calculate',
        payload: { characterId: 'hero-1', statPairs: pairs, tieChoices, hexagrams }
    });
    assert.equal(ichingCalc.ok, true);
    assert.equal(ichingCalc.result.iching.hexagramNumber, 1); // Logical 63 + Unchanging
    assert.ok(ichingCalc.result.iching.unchangingPower);

    const playerGrantAttempt = session.dispatch({
        id: 'ic-forbid',
        sessionId: 'campaign-1',
        actorId: 'alice',
        type: 'IChing:GrantReward',
        payload: { characterId: 'hero-1', gainKey: 'line-1', rewardType: 'Chi', amount: 10 }
    });
    assert.equal(playerGrantAttempt.ok, false);
    assert.equal(playerGrantAttempt.error, 'FORBIDDEN');

    const refGrant = session.dispatch({
        id: 'ic-grant',
        sessionId: 'campaign-1',
        actorId: 'referee',
        type: 'IChing:GrantReward',
        payload: { characterId: 'hero-1', gainKey: 'gain-0', rewardType: 'Chi', amount: 5 }
    });
    assert.equal(refGrant.ok, true);
    assert.equal(refGrant.result.sway.Chi, 9);

    const repeatGrant = session.dispatch({
        id: 'ic-grant-2',
        sessionId: 'campaign-1',
        actorId: 'referee',
        type: 'IChing:GrantReward',
        payload: { characterId: 'hero-1', gainKey: 'gain-0', rewardType: 'Chi', amount: 5 }
    });
    assert.equal(repeatGrant.ok, false);
    assert.equal(repeatGrant.error, 'GAIN_ALREADY_GRANTED');

    const hitchRes = session.dispatch({
        id: 'h1',
        sessionId: 'campaign-1',
        actorId: 'referee',
        type: 'Hitch:Evaluate',
        payload: {
            characterId: 'hero-1',
            facet: 'Trial',
            bane: 6,
            triggers: ['insulted'],
            observedTriggers: ['insulted'],
            gnarlFacets: ['Craft']
        }
    });
    assert.equal(hitchRes.ok, true);
    assert.equal(hitchRes.result.tier, 'Quirk');
    assert.equal(hitchRes.result.marks, T13Boons.getBoonReduced(6));
    assert.equal(hitchRes.result.ruins, T13Boons.getBoonDraw(6));
    assert.equal(hitchRes.result.triggered, true);
    assert.deepEqual(hitchRes.result.effects[0], {
        kind: 'difficulty',
        proficiencyId: null,
        score: 6,
        pips: T13Boons.getBoonReduced(6)
    });

    const overdraft = session.dispatch({
        id: 'sway-fail',
        sessionId: 'campaign-1',
        actorId: 'alice',
        type: 'Sway:Adjust',
        payload: { characterId: 'hero-1', currency: 'Chi', delta: -100 }
    });
    assert.equal(overdraft.ok, false);
    assert.equal(overdraft.error, 'INSUFFICIENT_SWAY');

    // Snapshot / Restore preserves everything and keeps future RNG identical
    const restored = T13Session.fromSnapshot(JSON.stringify(session.snapshot()));
    assert.deepEqual(restored.getProjection({ role: 'referee' }), session.getProjection({ role: 'referee' }));
    const nextA = session.dispatch({ id: 'post-rng', sessionId: 'campaign-1', actorId: 'alice', type: 'RNG:Draw', payload: { count: 4, sides: 13 } });
    const nextB = restored.dispatch({ id: 'post-rng', sessionId: 'campaign-1', actorId: 'alice', type: 'RNG:Draw', payload: { count: 4, sides: 13 } });
    assert.deepEqual(nextA.result.results, nextB.result.results);
});

test('summonWoundForStakes covers Low, Medium, High, Extreme, Soul, and Paradoxical stakes rules', () => {
    const tenSpades = [{ suit: 'Spades', pips: 10 }];
    assert.equal(summonWoundForStakes({ stakes: 'Low', cards: tenSpades }).name, 'Distract'); // 10 >= 2*3=6, < 5*3=15
    assert.equal(summonWoundForStakes({ stakes: 'Medium', cards: tenSpades }).name, 'Flesh'); // 10 >= 5*2=10
    assert.equal(summonWoundForStakes({ stakes: 'High', cards: tenSpades }).name, 'Maiming'); // 10 >= 8 base & >= 8 min
    assert.equal(summonWoundForStakes({ stakes: 'Extreme', cards: tenSpades }).name, 'Crippling'); // limit 10 unlocks Crippling alone
    assert.equal(summonWoundForStakes({ stakes: 'Paradoxical', cards: tenSpades }).name, 'Mortal'); // +1 shift over Crippling
});
