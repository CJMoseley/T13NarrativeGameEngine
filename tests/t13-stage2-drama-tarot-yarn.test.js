import test from 'node:test';
import assert from 'node:assert/strict';

import T13Session from '../src/t13ne/modules/systems/T13Session.js';
import {
    calculateTopOfPoolYarnChiDelta,
    calculateWyrdTarotHandLimit,
    calculateYarnManipulationCost,
    classifyCardDrama,
    detectOrdealTricks,
    evaluateDramaPoolRoll,
    getLatentLimitForTension,
    resolveCompetitiveCardDrawTest,
    resolveDramaTypeFromRoll,
    resolveSuitDefenseEffect
} from '../src/t13ne/modules/mechanics/T13CardPlayRules.js';

test('Drama rules: D2-D20 roll resolution, Water..Void thresholds, 1-die rule & Card Drama classification', () => {
    // 1-die-never-triggers rule (even Void, Overstressed, -3 threshold)
    const single = evaluateDramaPoolRoll({
        dice: [{ id: 'd1', type: 'Dramatic', fixedRoll: 3 }],
        plots: [{ id: 'p-void', poolType: 'Void', thresholdModifier: -3, overstressed: true }]
    });
    assert.equal(single.triggered.length, 0);
    assert.equal(single.remainingPool.length, 1);

    // Multi-plot priority: Fire (3) claims three 4s, Water (2) claims two 1s (mixed D20 + D2)
    const multi = evaluateDramaPoolRoll({
        dice: [
            { id: 'a', type: 'Drawn-out', fixedRoll: 1 },
            { id: 'b', type: 'Atmospheric', fixedRoll: 1 },
            { id: 'c', type: 'Dramatic', fixedRoll: 4 },
            { id: 'd', type: 'Tense', fixedRoll: 4 },
            { id: 'e', type: 'Running', fixedRoll: 4 },
            { id: 'f', type: 'Dramatic', fixedRoll: 2 }
        ],
        plots: [
            { id: 'p-water', poolType: 'Water' },
            { id: 'p-fire', poolType: 'Fire' }
        ]
    });
    assert.equal(multi.triggered.length, 2);
    const fireTrig = multi.triggered.find(t => t.plotId === 'p-fire');
    const waterTrig = multi.triggered.find(t => t.plotId === 'p-water');
    assert.equal(fireTrig.dice.length, 3);
    assert.equal(fireTrig.type, 'Prod'); // roll 4
    assert.equal(waterTrig.dice.length, 2);
    assert.equal(waterTrig.type, 'Atmospheric'); // roll 1 (D20 1 == D2 1)
    // Triggered dice removed for Drama Storm prevention; unmatched die remains
    assert.deepEqual(multi.remainingPool.map(d => d.id), ['f']);

    // D12 7..12 subtracts 6; D20 7..18 wraps 1..6; D5 shifts 2..5 -> 3..6
    assert.equal(resolveDramaTypeFromRoll('Running', 12).dramaType, 'Ratchet'); // 12 - 6 = 6
    assert.equal(resolveDramaTypeFromRoll('Drawn-out', 15).dramaType, 'Hazard'); // ((15-1)%6)+1 = 3
    assert.equal(resolveDramaTypeFromRoll('Melodramatic', 5).dramaType, 'Ratchet'); // 5 + 1 = 6

    // Card-based Drama table
    assert.equal(classifyCardDrama({ suit: 'Diamonds', pips: 7 }).type, 'Atmospheric');
    assert.equal(classifyCardDrama({ suit: 'Hearts', pips: 5 }).type, 'Narrative Moment');
    assert.equal(classifyCardDrama({ suit: 'Spades', pips: 9 }).type, 'Hazard');
    assert.equal(classifyCardDrama({ suit: 'Clubs', pips: 4 }).type, 'Ratchet');
    assert.equal(classifyCardDrama({ suit: 'Hearts', pips: 12 }).type, 'Break');
    assert.equal(classifyCardDrama({ suit: 'Spades', pips: 13 }).type, 'Prod');
    assert.equal(classifyCardDrama({ suit: 'Wildcard', name: 'Red Joker', pips: 15 }).type, 'Break');
    assert.equal(classifyCardDrama({ suit: 'Wildcard', name: 'Black Joker', pips: 15 }).type, 'Prod');

    // Latent Drama limits by Tension Level
    assert.equal(getLatentLimitForTension(1), 21);
    assert.equal(getLatentLimitForTension(6), 9);
});

test('Wyrd Tarot hand limits, Top-of-Chi-Pool Yarn math & Suit Parry/Soak rules', () => {
    assert.equal(calculateWyrdTarotHandLimit({ powerTier: 'Grunt', currentChi: 9, maxChi: 10 }).limit, 0);
    assert.equal(calculateWyrdTarotHandLimit({ powerTier: 'Grunt', currentChi: 10, maxChi: 10 }).limit, 1);
    assert.equal(calculateWyrdTarotHandLimit({ powerTier: 'Mercari', currentChi: 60, maxChi: 100 }).limit, 3);
    assert.equal(calculateWyrdTarotHandLimit({ powerTier: 'Solo', currentChi: 100, maxChi: 100 }).limit, 10);

    // docs/rules/Yarn.md golden math: 20 Yarn (131 Chi) spend 1 -> 19 Yarn (121 Chi), cost 10 Chi
    const spend = calculateTopOfPoolYarnChiDelta(131, -1);
    assert.equal(spend.ok, true);
    assert.equal(spend.currentYarn, 20);
    assert.equal(spend.targetYarn, 19);
    assert.equal(spend.chiDelta, -10);
    assert.equal(spend.newChi, 121);

    // Gaining 1 Yarn at 0 Chi yields 2 Chi
    const gainFromZero = calculateTopOfPoolYarnChiDelta(0, 1);
    assert.equal(gainFromZero.chiDelta, 2);
    assert.equal(gainFromZero.newChi, 2);

    // Færy Yarn surcharge & Quantum Swap Mandela flag
    const faeryCost = calculateYarnManipulationCost({
        baseCost: 2,
        techniques: ['Side-step', 'Quantum Swap'],
        faeryType: 'Seelie'
    });
    assert.equal(faeryCost.yarnCost, 4);
    assert.equal(faeryCost.extraChi, 4);
    assert.equal(faeryCost.extraYin, 4);
    assert.equal(faeryCost.causesMandelaEffect, true);

    // Suit Parry / Soak effects
    const clubsParry = resolveSuitDefenseEffect('Clubs', 'Parry', {
        attackCards: [{ id: 'atk1', suit: 'Spades', pips: 8 }],
        defenseCards: [{ id: 'def1', suit: 'Clubs', pips: 8 }, { id: 'def2', suit: 'Clubs', pips: 10 }]
    });
    assert.equal(clubsParry.effectName, 'Disarm');
    assert.equal(clubsParry.attackerRtAdded, 10);
    assert.equal(clubsParry.attackerGrtAdded, 2);

    const diamondsParry = resolveSuitDefenseEffect('Diamonds', 'Parry', {
        attackCards: [{ id: 'a1', suit: 'Hearts', pips: 4 }, { id: 'a2', suit: 'Spades', pips: 9 }],
        defenseCards: [{ id: 'd1', suit: 'Diamonds', pips: 4 }],
        matchedCardId: 'a1'
    });
    assert.equal(diamondsParry.effectName, 'Seize the initiative');
    assert.equal(diamondsParry.addToDefenderPool.length, 1);
    assert.equal(diamondsParry.addToDefenderPool[0].id, 'a2');
});

test('T13Session Stage 2.6: Drama loop + 3x Latent rotation, Face-down Wyrd Tarot privacy/flip, Yarn reality & Ordeal Tricks', () => {
    const session = new T13Session({ sessionId: 'drama-sess', seed: 'stage26-seed' });

    session.dispatch({ id: 'j1', sessionId: 'drama-sess', actorId: 'alice', type: 'Session:Join', payload: { name: 'Alice' } });
    session.dispatch({ id: 'j2', sessionId: 'drama-sess', actorId: 'bob', type: 'Session:Join', payload: { name: 'Bob' } });

    session.dispatch({
        id: 'c1',
        sessionId: 'drama-sess',
        actorId: 'alice',
        type: 'Character:Register',
        payload: {
            character: {
                id: 'hero-a',
                name: 'Vesper',
                powerTier: 'Mercari',
                maxChi: 131,
                scale: 2,
                facetweb: { Stats: { Trial: { Boon: 16 }, Enigma: { Boon: 13 } } },
                sway: { Chi: 131, Yarn: 3, 'Tao:Yin': 0, 'Tao:Yang': 0 }
            }
        }
    });
    session.dispatch({
        id: 'c2',
        sessionId: 'drama-sess',
        actorId: 'bob',
        type: 'Character:Register',
        payload: {
            character: {
                id: 'hero-b',
                name: 'Corvus',
                powerTier: 'Solo',
                maxChi: 100,
                scale: 1,
                facetweb: { Stats: { Trial: { Boon: 13 }, Awe: { Boon: 15 } } },
                sway: { Chi: 80, Yarn: 1, 'Tao:Yin': 0, 'Tao:Yang': 0 }
            }
        }
    });

    // Seed deck with balanced Court (Queen) and Non-Court (2/7) cards across a larger set,
    // and ensure Bob draws specific known Wyrd Tarot cards via Referee Card:Draw/Hand
    session.dispatch({
        id: 'dk1',
        sessionId: 'drama-sess',
        actorId: 'referee',
        type: 'Deck:Initialize',
        payload: { deckCount: 1 }
    });

    // 1. Test:Perform with stressGain automatically pushes a Character Drama Die + includes card complications
    const testWithStress = session.dispatch({
        id: 'tp-1',
        sessionId: 'drama-sess',
        actorId: 'alice',
        type: 'Test:Perform',
        payload: {
            testType: 'Card',
            characterId: 'hero-a',
            options: {
                facet: 'Trial',
                card: { id: 'td-1', name: 'Two of Diamonds', suit: 'Diamonds', pips: 2, data: { Wound_Level: 1, Tarot: { WyrdTarot: 'Foe' } } },
                stressGain: 1
            }
        }
    });
    assert.equal(testWithStress.ok, true);
    assert.equal(testWithStress.result.complications.wyrdTarot, 'Foe');
    assert.equal(session.getProjection().drama.pool.length, 1);

    // Competitive Card Draw Test ranks Alice & Bob cleanly
    const compTest = session.dispatch({
        id: 'tp-comp',
        sessionId: 'drama-sess',
        actorId: 'referee',
        type: 'Test:Perform',
        payload: {
            testType: 'card-competitive',
            options: {
                facet: 'Trial',
                difficulty: 8,
                placeBonuses: [2, 1],
                failureCutoffRank: 1,
                participants: [
                    { actorId: 'alice', characterId: 'hero-a', card: { suit: 'Spades', pips: 10, name: 'Ten of Spades' } },
                    { actorId: 'bob', characterId: 'hero-b', card: { suit: 'Diamonds', pips: 3, name: 'Three of Diamonds' } }
                ]
            }
        }
    });
    assert.equal(compTest.ok, true);
    assert.equal(compTest.result.ranked[0].actorId, 'alice');
    assert.equal(compTest.result.ranked[0].rank, 1);
    assert.equal(compTest.result.ranked[1].rank, 2);
    assert.ok(compTest.result.ranked[1].failureLevels >= 2); // Wrong colour + cutoff rank FL

    // 2. Latent Drama limit + 3-in-a-row Plot rotation
    session.dispatch({
        id: 'dc1',
        sessionId: 'drama-sess',
        actorId: 'referee',
        type: 'Drama:Configure',
        payload: { latentLimit: 2, tensionLevel: 5, poolType: 'Water' }
    });
    session.dispatch({
        id: 'pa1',
        sessionId: 'drama-sess',
        actorId: 'referee',
        type: 'Plot:Update',
        payload: { plotId: 'plot-missing' }
    }); // ensure Plot exists only after Spread or directly inject two plots via Trick/Spread
    session.dispatch({ id: 'da1', sessionId: 'drama-sess', actorId: 'alice', type: 'Drama:AddDie', payload: { characterId: 'hero-a', plotId: 'plot-alpha', spendChi: true } }); // triggers Latent #1
    session.dispatch({ id: 'da2a', sessionId: 'drama-sess', actorId: 'referee', type: 'Drama:AddDie', payload: { characterId: 'hero-a', plotId: 'plot-alpha' } });
    session.dispatch({ id: 'da2b', sessionId: 'drama-sess', actorId: 'referee', type: 'Drama:AddDie', payload: { characterId: 'hero-a', plotId: 'plot-alpha' } }); // triggers Latent #2
    session.dispatch({ id: 'da3a', sessionId: 'drama-sess', actorId: 'referee', type: 'Drama:AddDie', payload: { characterId: 'hero-a', plotId: 'plot-alpha' } });
    session.dispatch({ id: 'da3b', sessionId: 'drama-sess', actorId: 'referee', type: 'Drama:AddDie', payload: { characterId: 'hero-a', plotId: 'plot-alpha' } }); // triggers Latent #3
    // 4th Latent with no other Plot fails until another Plot exists
    session.dispatch({ id: 'da4a', sessionId: 'drama-sess', actorId: 'referee', type: 'Drama:AddDie', payload: { characterId: 'hero-a', plotId: 'plot-alpha' } });
    const blockedLatent = session.dispatch({ id: 'da4b', sessionId: 'drama-sess', actorId: 'referee', type: 'Drama:AddDie', payload: { characterId: 'hero-a', plotId: 'plot-alpha' } });
    assert.equal(blockedLatent.ok, false);
    assert.equal(blockedLatent.error, 'LATENT_PLOT_LIMIT_REACHED');

    // Reject Drama costs 1 Yarn & relieves 1 Stress on triggering character
    const pendingDramaId = session.getProjection().drama.activeDramas[0].id;
    const rejectRes = session.dispatch({
        id: 'dr1',
        sessionId: 'drama-sess',
        actorId: 'referee',
        type: 'Drama:Reject',
        payload: { dramaId: pendingDramaId, mode: 'type', newType: 'Break', payerCharacterId: 'hero-a' }
    });
    assert.equal(rejectRes.ok, true);
    assert.equal(rejectRes.result.stressReduced, 1);
    assert.equal(rejectRes.result.stressEffectCardEligible, true);
    assert.equal(session.getProjection().characters['hero-a'].sway.Yarn, 2);

    // 3. Wyrd Tarot Draw (Chi % limit), Privacy Masking, Court Card Persistence & Face-down Covering Auto-Flip
    const drawWt = session.dispatch({
        id: 'wt-d1',
        sessionId: 'drama-sess',
        actorId: 'bob',
        type: 'WyrdTarot:Draw',
        payload: { characterId: 'hero-b', count: 2 }
    });
    assert.equal(drawWt.ok, true);
    assert.equal(drawWt.result.totalWyrdTarotCount, 2);
    assert.equal(drawWt.result.handLimit, 8); // Solo at 80% Chi -> 8
    assert.equal(session.getProjection({ role: 'player', actorId: 'bob' }).wyrdTarotHand.length, 2);
    assert.equal(session.getProjection({ role: 'player', actorId: 'alice' }).wyrdTarotHand.length, 0);

    // Verify Chi % Wyrd Tarot limit rejection for Alice (Mercari with 130/131 = 99% -> limit 4)
    const tooManyWt = session.dispatch({
        id: 'wt-overlimit',
        sessionId: 'drama-sess',
        actorId: 'alice',
        type: 'WyrdTarot:Draw',
        payload: { characterId: 'hero-a', count: 5 }
    });
    assert.equal(tooManyWt.ok, false);
    assert.equal(tooManyWt.error, 'WYRD_TAROT_LIMIT_EXCEEDED');

    // Deal a guaranteed Court Card + Non-Court Card to Bob's private hand to test Court persistence vs Non-Court face-down covering
    const courtCard = { id: 'bob-q-hearts', name: 'Queen of Hearts', suit: 'Hearts', suitId: 2, pips: 12, data: { Tarot: { WyrdTarot: 'Love' } } };
    const nonCourtCard = { id: 'bob-2-diamonds', name: 'Two of Diamonds', suit: 'Diamonds', suitId: 1, pips: 2, data: { Tarot: { WyrdTarot: 'Foe' } } };
    session.dispatch({
        id: 'deal-wt-test',
        sessionId: 'drama-sess',
        actorId: 'referee',
        type: 'Hand:DealPrivate',
        payload: { targetActorId: 'bob', cards: [courtCard, nonCourtCard] }
    });

    // Play Court Card onto Alice's hero-a -> persists active
    const playCourt = session.dispatch({
        id: 'wt-p1',
        sessionId: 'drama-sess',
        actorId: 'bob',
        type: 'WyrdTarot:Play',
        payload: { cardId: courtCard.id, targetEntityId: 'hero-a', orientation: 'normal' }
    });
    assert.equal(playCourt.ok, true);
    assert.equal(playCourt.result.persisted, true);
    assert.equal(session.getProjection({ role: 'player', actorId: 'alice' }).wyrdTarotSlots['hero-a'][0].active, true);

    // Play Non-Court Face-Down covering the Court Card -> suspends Court card & hides card from Alice
    const playFaceDown = session.dispatch({
        id: 'wt-p2',
        sessionId: 'drama-sess',
        actorId: 'bob',
        type: 'WyrdTarot:Play',
        payload: { cardId: nonCourtCard.id, targetEntityId: 'hero-a', faceDown: true }
    });
    assert.equal(playFaceDown.ok, true);
    const aliceSlots = session.getProjection({ role: 'player', actorId: 'alice' }).wyrdTarotSlots['hero-a'];
    assert.equal(aliceSlots.length, 2);
    assert.equal(aliceSlots[0].suspended, true);
    assert.equal(aliceSlots[1].faceDown, true);
    assert.equal(aliceSlots[1].card, undefined); // Masked from target player!
    assert.ok(session.getProjection({ role: 'player', actorId: 'bob' }).wyrdTarotSlots['hero-a'][1].card); // Visible to player who placed it

    // When Alice acts in Test:Perform, the face-down Non-Court flips, discards, and reactivates Queen of Hearts!
    const flipOnAction = session.dispatch({
        id: 'tp-flip',
        sessionId: 'drama-sess',
        actorId: 'alice',
        type: 'Test:Perform',
        payload: { testType: 'Value', characterId: 'hero-a', options: { facet: 'Trial', difficulty: 5 } }
    });
    assert.equal(flipOnAction.ok, true);
    assert.equal(flipOnAction.result.wyrdTarotTriggered.discarded, true);
    assert.equal(session.getProjection({ role: 'player', actorId: 'alice' }).wyrdTarotSlots['hero-a'].length, 1);
    assert.equal(session.getProjection({ role: 'player', actorId: 'alice' }).wyrdTarotSlots['hero-a'][0].active, true);

    // 4. Yarn Reality Manipulation (top-of-Chi-pool + Flip-Flop duration matching)
    const flipFlop = session.dispatch({
        id: 'ym-1',
        sessionId: 'drama-sess',
        actorId: 'alice',
        type: 'Yarn:ManipulateReality',
        payload: {
            characterId: 'hero-a',
            baseCost: 1,
            techniques: ['Flip-Flop'],
            flipFlopDurationChi: 30,
            useChiPool: true,
            statement: 'The corridor door never locked.'
        }
    });
    assert.equal(flipFlop.ok, true);
    assert.equal(flipFlop.result.yarnCost, 2);

    const wrongCounter = session.dispatch({
        id: 'ym-2',
        sessionId: 'drama-sess',
        actorId: 'bob',
        type: 'Yarn:ManipulateReality',
        payload: {
            characterId: 'hero-b',
            baseCost: 2,
            counterWeaveId: flipFlop.result.id,
            matchFlipFlopDurationChi: 15
        }
    });
    assert.equal(wrongCounter.ok, true);
    assert.equal(wrongCounter.result.flipFlopConfused, true);

    // 5. Ordeal Wild Pool Trick Validation + Unlocked Discord Plot
    session.dispatch({
        id: 'cd-alice',
        sessionId: 'drama-sess',
        actorId: 'referee',
        type: 'Card:Draw',
        payload: { targetActorId: 'alice', count: 3 }
    });
    const ordealStart = session.dispatch({
        id: 'os-1',
        sessionId: 'drama-sess',
        actorId: 'referee',
        type: 'Ordeal:Start',
        payload: { type: 'Combat', stakes: 'Low', strictWildTricks: true, participants: ['alice', 'bob'], proficiencies: { alice: 2, bob: 2 } }
    });
    assert.equal(ordealStart.ok, true);

    const activeOrd = session.getProjection().table.activeOrdeal;
    const wildCheck = detectOrdealTricks(
        [{ id: 'p1', suit: 'Spades', pips: 7 }, { id: 'p2', suit: 'Hearts', pips: 7 }],
        [{ id: 'w1', suit: 'Clubs', pips: 7 }, { id: 'w2', suit: 'Diamonds', pips: 7 }]
    );
    assert.equal(wildCheck.wildPoolTrickValid, true);
    assert.ok(wildCheck.unlockedNarrativeTricks.includes('Discord'));

    const badWild = detectOrdealTricks(
        [{ id: 'p1', suit: 'Spades', pips: 2 }],
        [{ id: 'w1', suit: 'Clubs', pips: 9 }]
    );
    assert.equal(badWild.wildPoolTrickValid, false);

    // Inject known matching Wild Pool + Alice pool via Referee Ordeal state or test rejection directly when unmatched
    const wild0 = activeOrd.wildPool[0];
    const unmatchedInAlicePool = activeOrd.participants.alice.ordealPool.find(c => c.pips !== wild0.pips && c.suit !== wild0.suit);
    if (unmatchedInAlicePool && activeOrd.wildPool.length > 0 && !detectOrdealTricks([unmatchedInAlicePool], [wild0]).wildPoolTrickValid) {
        const rejectedWild = session.dispatch({
            id: 'op-bad',
            sessionId: 'drama-sess',
            actorId: 'alice',
            type: 'Ordeal:PlayCards',
            payload: { actionType: 'full', drawCount: 0, playCardIds: [unmatchedInAlicePool.id], wildCardIds: [wild0.id] }
        });
        assert.equal(rejectedWild.ok, false);
        assert.equal(rejectedWild.error, 'INVALID_WILD_TRICK');
    }

    // Play Yarn Cards from Alice's Hand for a 3-card Scene Beat
    const aliceCards = session.getProjection({ role: 'player', actorId: 'alice' }).privateHand;
    if (aliceCards.length >= 3) {
        const yarnPlay = session.dispatch({
            id: 'yp-1',
            sessionId: 'drama-sess',
            actorId: 'alice',
            type: 'Yarn:PlayCards',
            payload: {
                beatType: 'Scene',
                strictSceneMinimum: true,
                cardIds: aliceCards.slice(0, 3).map(c => c.id),
                roles: ['BeatType', 'Significator', 'Specifics']
            }
        });
        assert.equal(yarnPlay.ok, true);
        assert.equal(yarnPlay.result.recommendedMinCardsMet, true);
    }

    // 6. Snapshot / Restore preserves Drama, Wyrd Tarot Slots/Hands & Yarn Weaves
    const restored = T13Session.fromSnapshot(JSON.stringify(session.snapshot()));
    assert.deepEqual(restored.getProjection({ role: 'referee' }), session.getProjection({ role: 'referee' }));
});

test('Ordeal:YarnTangleAction handles 3-card pools, Bust >= 32 Knockout, and 4-Suit Victory', () => {
    const session = new T13Session({ sessionId: 'yt-1', seed: 'yarn-tangle-seed' });
    session.dispatch({ id: 'j1', sessionId: 'yt-1', actorId: 'alice', type: 'Session:Join', payload: { name: 'Alice' } });
    session.dispatch({ id: 'j2', sessionId: 'yt-1', actorId: 'bob', type: 'Session:Join', payload: { name: 'Bob' } });
    session.dispatch({
        id: 'dk',
        sessionId: 'yt-1',
        actorId: 'referee',
        type: 'Deck:Initialize',
        payload: {
            cards: [
                { id: 'a1', suit: 'Spades', pips: 12 }, { id: 'a2', suit: 'Spades', pips: 12 }, { id: 'a3', suit: 'Spades', pips: 10 }, // 34 -> Bust!
                { id: 'b1', suit: 'Hearts', pips: 6 }, { id: 'b2', suit: 'Hearts', pips: 5 }, { id: 'b3', suit: 'Clubs', pips: 4 },
                { id: 'w1', suit: 'Diamonds', pips: 2 }, { id: 'w2', suit: 'Clubs', pips: 3 }, { id: 'w3', suit: 'Hearts', pips: 8 }
            ]
        }
    });
    session.dispatch({
        id: 'os',
        sessionId: 'yt-1',
        actorId: 'referee',
        type: 'Ordeal:Start',
        payload: { type: 'YarnTangling', stakes: 'Paradoxical', participants: ['alice', 'bob'] }
    });
    session.dispatch({ id: 'yt-init', sessionId: 'yt-1', actorId: 'referee', type: 'Ordeal:YarnTangleAction', payload: { operation: 'initPools' } });
    const ko = session.dispatch({
        id: 'yt-ko',
        sessionId: 'yt-1',
        actorId: 'alice',
        type: 'Ordeal:YarnTangleAction',
        payload: { operation: 'knockout', defenderId: 'bob' }
    });
    assert.equal(ko.ok, true);
    assert.ok(['ChallengerBust32', 'DefenderBust32', 'Compare'].includes(ko.result.reason));

    for (const [idx, suit] of ['Diamonds', 'Hearts', 'Clubs', 'Spades'].entries()) {
        const win = session.dispatch({
            id: `yt-suit-${idx}`,
            sessionId: 'yt-1',
            actorId: 'referee',
            type: 'Ordeal:YarnTangleAction',
            payload: { operation: 'recordSuitWin', actorId: 'bob', suit }
        });
        assert.equal(win.ok, true);
        if (idx === 3) assert.equal(win.result.wonOrdeal, true);
    }
});

test('Ordeal:PlayCards unlocks & executes Promise (Wyrd Tarot), Plight (Yarn), Discord (Plot), Pool Limit & Ordeal:Defend', () => {
    const session = new T13Session({ sessionId: 'ord-trick', seed: 'trick-seed' });
    session.dispatch({ id: 'j1', sessionId: 'ord-trick', actorId: 'alice', type: 'Session:Join', payload: { name: 'Alice' } });
    session.dispatch({ id: 'j2', sessionId: 'ord-trick', actorId: 'bob', type: 'Session:Join', payload: { name: 'Bob' } });
    session.dispatch({
        id: 'c1',
        sessionId: 'ord-trick',
        actorId: 'alice',
        type: 'Character:Register',
        payload: { character: { id: 'hero-a', name: 'Alice', scale: 2, hitches: [{ id: 'h1', resolved: false }] } }
    });
    session.dispatch({
        id: 'c2',
        sessionId: 'ord-trick',
        actorId: 'bob',
        type: 'Character:Register',
        payload: { character: { id: 'hero-b', name: 'Bob', scale: 1, hitches: [] } }
    });

    // Build an all-7s deck so Wild Pool + Ordeal Pool cards always form valid Tricks (Pair/Set/Quad)
    const allSevens = ['Diamonds', 'Hearts', 'Clubs', 'Spades'].flatMap((suit, sIdx) =>
        Array.from({ length: 6 }, (_, k) => ({
            id: `s7-${sIdx}-${k}`,
            name: `Seven of ${suit}`,
            suit,
            suitId: sIdx + 1,
            pips: 7
        }))
    );
    session.dispatch({ id: 'dk', sessionId: 'ord-trick', actorId: 'referee', type: 'Deck:Initialize', payload: { cards: allSevens } });
    session.dispatch({
        id: 'os',
        sessionId: 'ord-trick',
        actorId: 'referee',
        type: 'Ordeal:Start',
        payload: { type: 'Combat', stakes: 'High', strictWildTricks: true, participants: ['alice', 'bob'], proficiencies: { alice: 4, bob: 3 } }
    });

    const ord0 = session.getProjection().table.activeOrdeal;
    const aPool = ord0.participants.alice.ordealPool;
    const wPool = ord0.wildPool;
    assert.ok(aPool.length >= 3 && wPool.length >= 2);

    // 1. Play 1 pool card + 1 wild card (Pair) -> unlock & execute Promise Wyrd Tarot card onto Bob
    const promisePlay = session.dispatch({
        id: 'tr-promise',
        sessionId: 'ord-trick',
        actorId: 'alice',
        type: 'Ordeal:PlayCards',
        payload: {
            actionType: 'full',
            drawCount: 0,
            playCardIds: [aPool[0].id],
            wildCardIds: [wPool[0].id],
            validateWildTrick: true,
            applyNarrativeTrick: 'Promise',
            trickTargetId: 'hero-b',
            promised: true
        }
    });
    assert.equal(promisePlay.ok, true);
    assert.equal(promisePlay.result.wildPoolTrickValid, true);
    assert.ok(promisePlay.result.unlockedNarrativeTricks.includes('Promise'));
    assert.equal(promisePlay.result.narrativeTrickResult.type, 'Promise');

    // Bob draws 2 extra cards via half-wait so he definitely holds >= 2 Defense cards, then Clubs Parry (Disarm)
    session.dispatch({
        id: 'bob-wait',
        sessionId: 'ord-trick',
        actorId: 'bob',
        type: 'Ordeal:PlayCards',
        payload: { actionType: 'half-wait', drawCount: 2 }
    });
    const bPool = session.getProjection().table.activeOrdeal.participants.bob.ordealPool;
    assert.ok(bPool.length >= 2);
    const defendRes = session.dispatch({
        id: 'def-1',
        sessionId: 'ord-trick',
        actorId: 'bob',
        type: 'Ordeal:Defend',
        payload: {
            suit: 'Clubs',
            mode: 'Parry',
            attackerId: 'alice',
            defenseCardIds: [bPool[0].id, bPool[1].id],
            attackCards: [{ id: 'incoming-1', suit: 'Spades', pips: 7 }]
        }
    });
    assert.equal(defendRes.ok, true);
    assert.equal(defendRes.result.effectName, 'Disarm');
    assert.equal(defendRes.result.attackerRtAdded, 7);
    assert.equal(defendRes.result.attackerGrtAdded, 1);

    // Bob's Disarm puts Alice into GRT=1; advance phase once to clear GRT before Alice's Quad play
    assert.equal(session.getProjection().table.activeOrdeal.participants.alice.grt, 1);
    session.dispatch({ id: 'ap-clear-grt', sessionId: 'ord-trick', actorId: 'referee', type: 'Ordeal:AdvancePhase' });
    assert.equal(session.getProjection().table.activeOrdeal.participants.alice.grt, 0);

    // Ensure Alice has at least 2 cards in Ordeal pool (draw via half-wait if needed) then play Quad -> Discord Plot
    if (session.getProjection().table.activeOrdeal.participants.alice.ordealPool.length < 2) {
        session.dispatch({
            id: 'alice-wait',
            sessionId: 'ord-trick',
            actorId: 'alice',
            type: 'Ordeal:PlayCards',
            payload: { actionType: 'half-wait', drawCount: 2 }
        });
    }

    const ord1 = session.getProjection().table.activeOrdeal;
    const aPool1 = ord1.participants.alice.ordealPool;
    const wPool1 = ord1.wildPool;
    assert.ok(aPool1.length >= 2 && wPool1.length >= 2);
    const quadPlay = session.dispatch({
        id: 'tr-discord',
        sessionId: 'ord-trick',
        actorId: 'alice',
        type: 'Ordeal:PlayCards',
        payload: {
            actionType: 'full',
            drawCount: 2,
            playCardIds: [aPool1[0].id, aPool1[1].id],
            wildCardIds: [wPool1[0].id, wPool1[1].id],
            validateWildTrick: true,
            applyNarrativeTrick: 'Discord',
            trickTargetId: 'hero-b',
            enforcePoolLimit: true
        }
    });
    assert.equal(quadPlay.ok, true);
    assert.ok(quadPlay.result.unlockedNarrativeTricks.includes('Discord'));
    assert.equal(quadPlay.result.narrativeTrickResult.type, 'Discord');
    assert.ok(session.getProjection().plots[quadPlay.result.narrativeTrickResult.plot.id]);
    assert.equal(quadPlay.result.poolLimit, 3); // Alice Scale 2 + 1 active Hitch
});

