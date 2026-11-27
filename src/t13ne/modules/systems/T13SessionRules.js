/**
 * @module Modules/Systems/T13SessionRules
 * @description Authoritative Stage 2 rulebook commands wired into headless T13Session:
 * - T13 Tests (`Test:Perform` for Dice, Card, Value)
 * - Multi-deck, Reserves & Context-Preserving Card Triggers (`Deck:Initialize`, `Card:Draw`, `Card:Play`, `Card:Prepare`, `Card:Discard`)
 * - Ordeal State Machine (`Ordeal:Start`, `Ordeal:DrawStage`, `Ordeal:PlayCards`, `Ordeal:AdvancePhase`, `Ordeal:AdvanceRound`, `Ordeal:Resolve`)
 * - Quest Spreads & Plots (`Spread:InterpretQuest`, `Plot:Confirm`, `Plot:Update`)
 * - I-Ching Hexagrams & Adjudicated Gains (`IChing:Calculate`, `IChing:GrantReward`)
 * - Hitches, Wounds & Sway Persistence (`Hitch:Evaluate`, `Wound:Apply`, `Wound:UpdateState`, `Sway:Adjust`)
 */

import T13Boons from '../mechanics/t13ne-boon.js';
import {
    SUIT_ID_BY_NAME,
    SUIT_NAME_BY_ID,
    getFacetMeta,
    resolveCardDrawTest,
    resolveDiceTest,
    resolveValueTest
} from '../mechanics/T13TestRules.js';
import { interpretQuestSpread } from '../mechanics/QuestSpread.js';
import { classifyHitchTier } from '../mechanics/HitchRules.js';
import { describeFacetAspect } from '../mechanics/FacetRuleRegistry.js';
import { suitTheme, sumPips } from './ordeals/t13ne-ordeal-rules.js';
import { stageDifficultyRatio } from './ordeals/t13ne-stage-difficulty.js';

function resolveGnarlSync(facet, context) {
    const def = describeFacetAspect(facet, 'Gnarl');
    switch (facet.FacetName) {
        case 'Craft':
            return { kind: 'difficulty', proficiencyId: context.proficiencyId ?? null, score: context.bane, pips: context.marks };
        case 'Orthodox':
            return { kind: 'stress', proficiencyId: context.proficiencyId ?? null, amount: context.marks };
        case 'Burden':
            return { kind: 'sway-expense', proficiencyId: context.proficiencyId ?? null, amount: context.bane, sway: 'Tao' };
        case 'Liberty':
            return { kind: 'negative-bane-die', proficiencyId: context.proficiencyId ?? null, bane: context.bane };
        case 'Miasma':
            return { kind: 'toxin-attack', proficiencyId: context.proficiencyId ?? null, basePips: context.bane / 2, unsoakable: true };
        default:
            return { ...context, kind: 'adjudication', facet: facet.FacetName, name: def.name, rules: def.rules };
    }
}

export const WOUND_LEVELS = Object.freeze([
    { level: 0, name: 'Unwounded', basePips: 0, minPips: 0, chiReduceCost: 0 },
    { level: 1, name: 'Distract', basePips: 2, minPips: 2, chiReduceCost: 2 },
    { level: 2, name: 'Flesh', basePips: 5, minPips: 5, chiReduceCost: 5 },
    { level: 3, name: 'Maiming', basePips: 8, minPips: 8, chiReduceCost: 8 },
    { level: 4, name: 'Crippling', basePips: 12, minPips: 10, chiReduceCost: 12 },
    { level: 5, name: 'Mortal', basePips: 16, minPips: 12, chiReduceCost: 16 },
    { level: 6, name: 'Carnage', basePips: 21, minPips: 14, chiReduceCost: 21 },
    { level: 7, name: 'Carnage+', basePips: 26, minPips: 15, chiReduceCost: 26 }
]);

export const WOUND_FRESHNESS_STATES = Object.freeze([
    'Fresh',
    'Untreated',
    'Treated',
    'Stabilized',
    'Re-opened',
    'Festering'
]);

export const STAKES_RULES = Object.freeze({
    Low: { type: 'Low', wildPool: 2, woundMultiplier: 3, mode: 'multiplied', maxSoakLevels: 3 },
    Medium: { type: 'Medium', wildPool: 3, woundMultiplier: 2, mode: 'multiplied', maxSoakLevels: 2 },
    High: { type: 'High', wildPool: 4, woundMultiplier: 1, mode: 'basePlusLimit', maxSoakLevels: 3 },
    Extreme: { type: 'Extreme', wildPool: 5, woundMultiplier: 1, mode: 'limitOnly', maxSoakLevels: 4 },
    Soul: { type: 'Soul', wildPool: 6, woundMultiplier: 1, mode: 'limitOnlyPlusD6', maxSoakLevels: 1 },
    Paradoxical: { type: 'Paradoxical', wildPool: 3, woundMultiplier: 1, mode: 'limitOnlyShift1', maxSoakLevels: 2 }
});

function clone(value) {
    if (value === null || value === undefined || typeof value !== 'object') return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

export function getStakesRule(stakesName = 'Low') {
    const key = Object.keys(STAKES_RULES).find(k => k.toLowerCase() === String(stakesName).trim().toLowerCase());
    return STAKES_RULES[key] || null;
}

/**
 * Builds `deckCount` standard 54-card Yarn/Ordeal decks (52 suited + 2 Wildcards).
 */
export function buildStandardSessionDeck(deckCount = 1) {
    const count = Math.max(1, Math.trunc(deckCount));
    const suits = ['Diamonds', 'Hearts', 'Clubs', 'Spades'];
    const faceNames = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' };
    const cards = [];

    for (let d = 0; d < count; d++) {
        const deckId = `base-${d}`;
        for (const suit of suits) {
            for (let pips = 2; pips <= 14; pips++) {
                const label = faceNames[pips] || String(pips);
                cards.push({
                    id: `${deckId}-${suit.toLowerCase()}-${pips}`,
                    name: `${label} of ${suit}`,
                    suit,
                    suitId: SUIT_ID_BY_NAME[suit],
                    pips,
                    sourceDeckId: deckId
                });
            }
        }
        cards.push(
            { id: `${deckId}-wildcard-1`, name: 'Joker (Light)', suit: 'Wildcard', suitId: 0, pips: 15, sourceDeckId: deckId },
            { id: `${deckId}-wildcard-2`, name: 'Joker (Shadow)', suit: 'Wildcard', suitId: 0, pips: 15, sourceDeckId: deckId }
        );
    }
    return cards;
}

function shuffleWithSession(session, arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = session.nextInt(0, i);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function ensureSessionDeck(session, state, requestedDecks = null) {
    if (!state.deck) {
        state.deck = { drawPile: [], discardPile: [], deckCount: 0 };
    }
    if (state.deck.drawPile.length === 0 && state.deck.discardPile.length === 0) {
        const playerCount = Math.max(1, Object.values(state.actors || {}).filter(a => a.role === 'player').length);
        const decksNeeded = requestedDecks || (1 + Math.max(1, Math.ceil(playerCount / 4)));
        state.deck.drawPile = shuffleWithSession(session, buildStandardSessionDeck(decksNeeded));
        state.deck.deckCount = decksNeeded;
    }
    return state.deck;
}

function drawFromSessionDeck(session, state, count = 1) {
    const deck = ensureSessionDeck(session, state);
    const drawn = [];
    for (let i = 0; i < count; i++) {
        if (deck.drawPile.length === 0 && deck.discardPile.length > 0) {
            deck.drawPile = shuffleWithSession(session, deck.discardPile.splice(0, deck.discardPile.length));
        }
        if (deck.drawPile.length === 0) break;
        drawn.push(deck.drawPile.shift());
    }
    return drawn;
}

/**
 * Computes the summoned Wound level from Stakes + Cards/Pips per docs/rules/Stakes.md & Wounds.md.
 */
export function summonWoundForStakes({ stakes = 'High', cards = [], totalPips = null, limitPips = null, bonusDieRoll = 0 } = {}) {
    const rule = getStakesRule(stakes);
    if (!rule) throw new Error(`Unknown Stakes '${stakes}'.`);

    const cardPips = Array.isArray(cards) ? cards.map(c => parseInt(c.pips ?? c.Pips ?? 0, 10) || 0) : [];
    const computedTotal = (totalPips !== null ? Number(totalPips) : cardPips.reduce((a, b) => a + b, 0))
        + (rule.mode === 'limitOnlyPlusD6' ? (Number(bonusDieRoll) || 0) : 0);
    const computedLimit = (limitPips !== null ? Number(limitPips) : (cardPips.length ? Math.max(...cardPips) : computedTotal))
        + (rule.mode === 'limitOnlyPlusD6' ? (Number(bonusDieRoll) || 0) : 0);

    let chosen = WOUND_LEVELS[0];
    if (rule.mode === 'multiplied') {
        for (const w of WOUND_LEVELS) {
            if (w.level === 0) continue;
            if (computedTotal >= w.basePips * rule.woundMultiplier) chosen = w;
        }
    } else if (rule.mode === 'basePlusLimit') {
        for (const w of WOUND_LEVELS) {
            if (w.level === 0) continue;
            if (computedLimit >= w.minPips && computedTotal >= w.basePips) chosen = w;
        }
    } else {
        // Extreme / Soul / Paradoxical: summoned by Limit card Pips alone
        for (const w of WOUND_LEVELS) {
            if (w.level === 0) continue;
            if (computedLimit >= w.minPips) chosen = w;
        }
        if (rule.mode === 'limitOnlyShift1' && chosen.level > 0 && chosen.level < WOUND_LEVELS.length - 1) {
            chosen = WOUND_LEVELS[chosen.level + 1];
        }
    }

    const limitCard = Array.isArray(cards) && cards.length
        ? cards.reduce((best, cur) => ((parseInt(cur.pips ?? 0, 10) || 0) >= (parseInt(best.pips ?? 0, 10) || 0) ? cur : best), cards[0])
        : null;

    return {
        stakes: rule.type,
        level: chosen.level,
        name: chosen.name,
        pips: computedTotal,
        limitPips: computedLimit,
        suit: limitCard?.suit ?? 'Spades',
        freshness: 'Fresh'
    };
}

function getFacetBoonOnCharacter(character, facetName) {
    const meta = getFacetMeta(facetName);
    const key = meta?.FacetName || facetName;
    const stats = character?.facetweb?.Stats;
    if (stats && !Array.isArray(stats) && typeof stats === 'object') {
        if (stats[key]?.Boon !== undefined) return Number(stats[key].Boon);
        if (typeof stats[key] === 'number') return stats[key];
    }
    if (character?.boons && character.boons[key] !== undefined) return Number(character.boons[key]);
    if (character?.boons && meta && character.boons[meta.FacetIndex] !== undefined) return Number(character.boons[meta.FacetIndex]);
    return 13;
}

function ensureCharacterSway(character) {
    if (!character.sway || typeof character.sway !== 'object') {
        character.sway = { Chi: 0, Yarn: 0, Twists: 0, 'Tao:Yin': 0, 'Tao:Yang': 0 };
    }
    return character.sway;
}

function makeErr(code, message) {
    const err = new Error(message);
    err.code = code;
    return err;
}

export function registerStage2Commands(session) {
    // -------------------------------------------------------------------------
    // 2.1 Executable T13 Tests
    // -------------------------------------------------------------------------
    session.registerCommand('Test:Perform', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const testType = String(payload.testType ?? payload.type ?? 'Dice').toLowerCase();
            const isAuthority = actorRole === 'referee' || actorRole === 'system';

            const character = payload.characterId ? state.characters[payload.characterId] : payload.character;
            if (payload.characterId && !character) {
                throw makeErr('NOT_FOUND', `Character '${payload.characterId}' not found.`);
            }
            if (character && !isAuthority && character.ownerActorId && character.ownerActorId !== actorId) {
                throw makeErr('FORBIDDEN', `Actor '${actorId}' does not own character '${character.id}'.`);
            }

            const opts = payload.options || payload;
            const facetName = opts.facet || 'Awe';
            const boon = opts.boon ?? opts.annex?.boon ?? getFacetBoonOnCharacter(character, facetName);
            const rngInt = (min, max) => s.nextInt(min, max);

            let result;
            if (testType === 'dice') {
                result = resolveDiceTest({
                    facet: facetName,
                    trumpFacet: opts.trumpFacet ?? null,
                    boon,
                    mainDieStr: opts.mainDieStr ?? null,
                    proficiencies: opts.proficiencies ?? 1,
                    descendantBoon: opts.descendant?.masterAnnex?.boon ?? opts.descendantBoon ?? null,
                    descendantDieStr: opts.descendantDieStr ?? null,
                    strainDice: opts.strainDice ?? opts.strain ?? [],
                    extraDice: opts.extraDice ?? [],
                    difficulty: opts.difficulty ?? 0,
                    potency: opts.potency ?? 'Intrepid',
                    pool: opts.pool ?? false,
                    difficultyEffects: opts.difficultyEffects,
                    geometry: opts.geometry ?? character?.geometry ?? null,
                    scoreBonus: opts.scoreBonus ?? 0,
                    rngInt
                });
            } else if (testType === 'card') {
                let card = opts.card || null;
                if (!card) {
                    const drawn = drawFromSessionDeck(s, state, 1);
                    card = drawn[0];
                    if (card) state.deck.discardPile.push(card);
                }
                result = resolveCardDrawTest({
                    facet: facetName,
                    trumpFacet: opts.trumpFacet ?? null,
                    boon,
                    card,
                    difficulty: opts.difficulty ?? 10,
                    proficiencies: opts.proficiencies ?? [],
                    chiSpend: opts.chiSpend ?? 0,
                    stressGain: opts.stressGain ?? 0,
                    strainGain: opts.strainGain ?? 0,
                    shockGain: opts.shockGain ?? 0
                });
                if (character && (opts.chiSpend || opts.stressGain || opts.strainGain || opts.shockGain)) {
                    const sway = ensureCharacterSway(character);
                    if (opts.chiSpend > 0) {
                        if ((sway.Chi || 0) < opts.chiSpend) {
                            throw makeErr('INSUFFICIENT_SWAY', 'Insufficient Chi for Card Test.');
                        }
                        sway.Chi -= opts.chiSpend;
                    }
                    if (!character.stressState) character.stressState = {};
                    const key = `Facet:${facetName}`;
                    if (!character.stressState[key]) character.stressState[key] = { stress: 0, strains: 0, shocks: 0 };
                    character.stressState[key].stress += opts.stressGain || 0;
                    character.stressState[key].strains += opts.strainGain || 0;
                    character.stressState[key].shocks += opts.shockGain || 0;
                }
            } else if (testType === 'value') {
                result = resolveValueTest({
                    facet: facetName,
                    opposedFacet: opts.opposedFacet ?? null,
                    boon,
                    scaleModifier: character?.scaleModifier ?? opts.scaleModifier ?? 0,
                    actorValues: opts.actorValues ?? null,
                    actorValue: opts.actorValue ?? null,
                    opponentValue: opts.opponentValue ?? null,
                    difficulty: opts.difficulty ?? 0,
                    method: opts.method ?? 'direct',
                    geometry: opts.geometry ?? character?.geometry ?? null,
                    rngInt
                });
            } else {
                throw makeErr('INVALID_TEST_TYPE', `Unsupported Test type '${testType}'.`);
            }

            emit('Test:Resolved', { characterId: character?.id ?? null, actorId, testType, result }, 'public');
            return result;
        }
    });

    // -------------------------------------------------------------------------
    // 2.2 Deck, Hands, Reserves & Context-Preserving Card Triggers
    // -------------------------------------------------------------------------
    session.registerCommand('Deck:Initialize', {
        roles: ['referee', 'system'],
        handler: ({ session: s, state, payload, emit }) => {
            const playerCount = payload.playerCount
                ?? Math.max(1, Object.values(state.actors).filter(a => a.role === 'player').length);
            const deckCount = payload.deckCount ?? (1 + Math.max(1, Math.ceil(playerCount / 4)));
            const cards = Array.isArray(payload.cards) && payload.cards.length
                ? clone(payload.cards)
                : buildStandardSessionDeck(deckCount);
            state.deck = {
                deckCount,
                drawPile: shuffleWithSession(s, cards),
                discardPile: []
            };
            emit('Deck:Initialized', { deckCount, cardCount: state.deck.drawPile.length }, 'public');
            return { deckCount, cardCount: state.deck.drawPile.length };
        }
    });

    session.registerCommand('Card:Draw', {
        roles: ['referee', 'system'],
        handler: ({ session: s, state, payload, emit }) => {
            const targetActorId = String(payload.targetActorId ?? '');
            if (!targetActorId || !state.actors[targetActorId]) {
                throw makeErr('INVALID_TARGET', `Target actor '${targetActorId}' is not registered.`);
            }
            const count = Math.max(1, Math.trunc(payload.count ?? 1));
            const cardContext = payload.cardContext || 'Ordeal';
            const cards = drawFromSessionDeck(s, state, count);
            if (!Array.isArray(state.privateHands[targetActorId])) state.privateHands[targetActorId] = [];
            state.privateHands[targetActorId].push(...cards);
            state.publicHandCounts[targetActorId] = state.privateHands[targetActorId].length;

            emit('Card:DrawnPrivate', { targetActorId, cards, cardContext }, ['referee', `player:${targetActorId}`]);
            emit('Card:HandCountChanged', { targetActorId, added: cards.length, totalHandCount: state.publicHandCounts[targetActorId], cardContext }, 'public');
            return { targetActorId, drawnCount: cards.length, totalHandCount: state.publicHandCounts[targetActorId], cardContext };
        }
    });

    session.registerCommand('Card:Prepare', {
        roles: ['player', 'referee', 'system'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const ownerId = isAuthority && payload.ownerId ? String(payload.ownerId) : actorId;
            const cardId = String(payload.cardId ?? '');
            const cardContext = payload.cardContext || 'Ordeal';
            const reserveType = payload.reserveType === 'style' ? 'style' : 'prepared';
            const styleName = String(payload.styleName || 'Default');

            const hand = state.privateHands[ownerId] || [];
            const ordealPool = state.table?.activeOrdeal?.participants?.[ownerId]?.ordealPool || [];
            let card = null;
            let idx = hand.findIndex(c => c.id === cardId);
            if (idx !== -1) {
                card = hand.splice(idx, 1)[0];
                state.publicHandCounts[ownerId] = hand.length;
            } else {
                idx = ordealPool.findIndex(c => c.id === cardId);
                if (idx !== -1) card = ordealPool.splice(idx, 1)[0];
            }
            if (!card) {
                throw makeErr('CARD_NOT_FOUND', `Card '${cardId}' not found in hand or pool for '${ownerId}'.`);
            }

            if (reserveType === 'style') {
                if (!state.styleReserves[ownerId]) state.styleReserves[ownerId] = {};
                if (!state.styleReserves[ownerId][styleName]) state.styleReserves[ownerId][styleName] = [];
                state.styleReserves[ownerId][styleName].push(card);
            } else {
                if (!state.preparedReserves[ownerId]) state.preparedReserves[ownerId] = [];
                state.preparedReserves[ownerId].push(card);
            }

            emit('Card:Prepared', { ownerId, card, reserveType, styleName, cardContext }, 'public');
            return { ownerId, cardId: card.id, reserveType, styleName, cardContext };
        }
    });

    session.registerCommand('Card:Play', {
        roles: ['player', 'referee', 'system'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const ownerId = isAuthority && payload.ownerId ? String(payload.ownerId) : actorId;
            const cardId = String(payload.cardId ?? '');
            const cardContext = payload.cardContext || 'Ordeal';
            ensureSessionDeck({ nextInt: () => 0 }, state);

            let card = null;
            const hand = state.privateHands[ownerId] || [];
            const handIdx = hand.findIndex(c => c.id === cardId);
            if (handIdx !== -1) {
                card = hand.splice(handIdx, 1)[0];
                state.publicHandCounts[ownerId] = hand.length;
            }
            if (!card && state.preparedReserves?.[ownerId]) {
                const idx = state.preparedReserves[ownerId].findIndex(c => c.id === cardId);
                if (idx !== -1) card = state.preparedReserves[ownerId].splice(idx, 1)[0];
            }
            if (!card && state.styleReserves?.[ownerId]) {
                for (const cards of Object.values(state.styleReserves[ownerId])) {
                    const idx = cards.findIndex(c => c.id === cardId);
                    if (idx !== -1) { card = cards.splice(idx, 1)[0]; break; }
                }
            }
            if (!card) {
                throw makeErr('CARD_NOT_FOUND', `Card '${cardId}' not owned by '${ownerId}'.`);
            }

            if (!payload.retainInPlay) {
                state.deck.discardPile.push(card);
            }
            emit('Card:Played', { ownerId, card, cardContext, effect: payload.effect ?? null }, 'public');
            return { ownerId, card, cardContext };
        }
    });

    session.registerCommand('Card:Discard', {
        roles: ['player', 'referee', 'system'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const ownerId = isAuthority && payload.ownerId ? String(payload.ownerId) : actorId;
            const cardIds = Array.isArray(payload.cardIds) ? payload.cardIds : [payload.cardId];
            const cardContext = payload.cardContext || 'Ordeal';
            if (!state.deck) state.deck = { drawPile: [], discardPile: [], deckCount: 0 };

            const discarded = [];
            for (const cid of cardIds) {
                const hand = state.privateHands[ownerId] || [];
                const idx = hand.findIndex(c => c.id === cid);
                if (idx === -1) throw makeErr('CARD_NOT_FOUND', `Card '${cid}' not in hand for '${ownerId}'.`);
                const card = hand.splice(idx, 1)[0];
                state.publicHandCounts[ownerId] = hand.length;
                state.deck.discardPile.push(card);
                discarded.push(card);
            }
            emit('Card:Discarded', { ownerId, discarded, cardContext }, 'public');
            return { ownerId, discardedCount: discarded.length, cardContext };
        }
    });

    // -------------------------------------------------------------------------
    // 2.3 Authoritative Ordeal State Machine
    // -------------------------------------------------------------------------
    session.registerCommand('Ordeal:Start', {
        roles: ['referee', 'system'],
        handler: ({ session: s, state, payload, emit }) => {
            if (state.table?.activeOrdeal && state.table.activeOrdeal.status === 'Active') {
                throw makeErr('ORDEAL_ALREADY_ACTIVE', 'An Ordeal is already active.');
            }
            const stakesRule = getStakesRule(payload.stakes || 'Low');
            if (!stakesRule) throw makeErr('INVALID_STAKES', `Unknown Stakes '${payload.stakes}'.`);

            const numStages = Math.max(1, Math.trunc(payload.numStages ?? 3));
            const terrain = payload.terrain || 'Closed';
            const participantIds = Array.isArray(payload.participants) && payload.participants.length
                ? payload.participants.map(String)
                : Object.values(state.actors).filter(a => a.role === 'player').map(a => a.id);

            ensureSessionDeck(s, state);
            const participants = {};
            const profCounts = payload.proficiencies || {};

            for (const pid of participantIds) {
                const pCount = Math.max(0, Math.trunc(profCounts[pid] ?? 1));
                let drawCount = 1;
                if (pCount === 0) drawCount = 1;
                else if (pCount === 1) drawCount = 1;
                else {
                    const dieCount = Math.min(3, pCount - 1);
                    let profScore = 0;
                    for (let i = 0; i < dieCount; i++) profScore += s.rollDie(6);
                    drawCount = profScore <= 1 ? 1 : Math.max(1, Number(T13Boons.getBoonReduced(profScore)) || 1);
                }
                const initialPool = drawFromSessionDeck(s, state, drawCount);
                participants[pid] = {
                    actorId: pid,
                    proficiencyCount: pCount,
                    ordealPool: initialPool,
                    rt: 0,
                    grt: 0,
                    stageIndex: 0,
                    hasHalfCard: pCount === 0
                };
            }

            const wildPool = drawFromSessionDeck(s, state, stakesRule.wildPool);
            const stages = Array.from({ length: numStages }, (_, idx) => ({
                index: idx,
                type: payload.stageTypes?.[idx] || 'Standard',
                difficulty: null,
                difficultyRatio: null,
                progress: 0,
                cards: [],
                obstacles: [],
                isComplete: false
            }));

            const ordeal = {
                id: String(payload.id ?? `ordeal-${s.revision + 1}`),
                type: payload.type || 'Generic',
                stakes: stakesRule.type,
                wildPoolSize: stakesRule.wildPool,
                terrain,
                status: 'Active',
                currentStageIndex: 0,
                roundNumber: 1,
                phaseNumber: 1,
                roundComplete: false,
                stages,
                wildPool,
                participants
            };

            state.table.activeOrdeal = ordeal;
            emit('Ordeal:Started', { ordeal: clone(ordeal) }, 'public');
            return { ordealId: ordeal.id, stakes: ordeal.stakes, wildPoolCount: wildPool.length };
        }
    });

    session.registerCommand('Ordeal:DrawStage', {
        roles: ['referee', 'system'],
        handler: ({ session: s, state, payload, emit }) => {
            const ordeal = state.table?.activeOrdeal;
            if (!ordeal || ordeal.status !== 'Active') {
                throw makeErr('NO_ACTIVE_ORDEAL', 'No active Ordeal.');
            }
            const stageIndex = Math.trunc(payload.stageIndex ?? ordeal.currentStageIndex);
            const stage = ordeal.stages[stageIndex];
            if (!stage) throw makeErr('INVALID_STAGE', `Stage index ${stageIndex} out of range.`);

            let cards = Array.isArray(payload.cards) ? clone(payload.cards) : null;
            if (!cards) {
                const count = Math.max(1, Math.min(3, Math.trunc(payload.cardCount ?? 2)));
                cards = drawFromSessionDeck(s, state, count);
            }
            if (cards.length < 1 || cards.length > 3) {
                throw makeErr('INVALID_STAGE_CARDS', 'Stage Difficulty requires 1 to 3 cards.');
            }

            stage.cards = cards;
            stage.difficulty = sumPips(cards);
            stage.difficultyRatio = stageDifficultyRatio(cards);
            ordeal.currentStageIndex = stageIndex;

            if (Array.isArray(payload.obstacles)) {
                for (const obs of payload.obstacles) {
                    const typeCard = obs.typeCard || drawFromSessionDeck(s, state, 1)[0];
                    const diffCards = Array.isArray(obs.difficultyCards) && obs.difficultyCards.length
                        ? clone(obs.difficultyCards)
                        : drawFromSessionDeck(s, state, 1);
                    if (diffCards.length < 1 || diffCards.length > 2) {
                        throw makeErr('INVALID_OBSTACLE_CARDS', 'Obstacle difficulty requires 1 to 2 cards.');
                    }
                    const built = {
                        id: obs.id || `obs-${stageIndex}-${stage.obstacles.length + 1}`,
                        name: obs.name || typeCard.name,
                        suit: typeCard.suit,
                        type: suitTheme(typeCard.suit),
                        difficulty: sumPips(diffCards),
                        resolved: false
                    };
                    if (obs.hidden) {
                        if (!state.refereeSecrets.hiddenObstacles) state.refereeSecrets.hiddenObstacles = {};
                        if (!state.refereeSecrets.hiddenObstacles[stageIndex]) state.refereeSecrets.hiddenObstacles[stageIndex] = [];
                        state.refereeSecrets.hiddenObstacles[stageIndex].push(built);
                        emit('Ordeal:HiddenObstacleAdded', { stageIndex, obstacle: built }, 'referee');
                    } else {
                        stage.obstacles.push(built);
                    }
                }
            }

            emit('Ordeal:StageDrawn', { stageIndex, stage: clone(stage) }, 'public');
            return { stageIndex, difficulty: stage.difficulty, difficultyRatio: stage.difficultyRatio };
        }
    });

    session.registerCommand('Ordeal:PlayCards', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const ordeal = state.table?.activeOrdeal;
            if (!ordeal || ordeal.status !== 'Active') {
                throw makeErr('NO_ACTIVE_ORDEAL', 'No active Ordeal.');
            }
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const participantId = isAuthority && payload.actorId ? String(payload.actorId) : actorId;
            const participant = ordeal.participants[participantId];
            if (!participant) {
                throw makeErr('NOT_PARTICIPANT', `'${participantId}' is not a participant in the active Ordeal.`);
            }

            const actionType = payload.actionType || 'full';
            if (participant.grt > 0 && !payload.spendStrain) {
                throw makeErr('IN_GRT', `Participant '${participantId}' has ${participant.grt} GRT remaining.`);
            }

            ensureSessionDeck(s, state);
            let drawn = [];
            if (actionType === 'full' || actionType === 'half-wait') {
                const drawCount = actionType === 'half-wait' ? Math.max(1, Math.trunc(payload.drawCount ?? 1)) : Math.max(0, Math.trunc(payload.drawCount ?? 1));
                if (drawCount > 0) {
                    drawn = drawFromSessionDeck(s, state, drawCount);
                    participant.ordealPool.push(...drawn);
                }
            }

            const played = [];
            const playCardIds = Array.isArray(payload.playCardIds) ? payload.playCardIds : [];
            for (const cid of playCardIds) {
                const idx = participant.ordealPool.findIndex(c => c.id === cid);
                if (idx === -1) throw makeErr('CARD_NOT_IN_POOL', `Card '${cid}' not in Ordeal Pool.`);
                const card = participant.ordealPool.splice(idx, 1)[0];
                played.push(card);
                state.deck.discardPile.push(card);
            }

            const wildClaimed = [];
            const wildCardIds = Array.isArray(payload.wildCardIds) ? payload.wildCardIds : [];
            for (const wid of wildCardIds) {
                const idx = ordeal.wildPool.findIndex(c => c.id === wid);
                if (idx === -1) throw makeErr('WILD_CARD_MISSING', `Wild Pool card '${wid}' not available.`);
                const card = ordeal.wildPool.splice(idx, 1)[0];
                wildClaimed.push(card);
                state.deck.discardPile.push(card);
            }

            const allPlayed = [...played, ...wildClaimed];
            let totalPips = sumPips(allPlayed);
            if (payload.trumpSuit) {
                const tId = SUIT_ID_BY_NAME[String(payload.trumpSuit)] ?? 0;
                for (const c of allPlayed) {
                    const cId = c.suitId ?? SUIT_ID_BY_NAME[String(c.suit)] ?? 0;
                    if (cId === tId || cId === 0) totalPips += 2;
                }
            }

            const rtPaidPips = Math.max(0, Math.trunc(payload.payRtPips ?? 0));
            const grtPaidPips = Math.max(0, Math.trunc(payload.payGrtPips ?? 0));
            const costUsed = rtPaidPips + grtPaidPips;
            if (costUsed > totalPips) {
                throw makeErr('INSUFFICIENT_PIPS', 'RT/GRT paydown pips exceed played card pips.');
            }
            if (rtPaidPips > 0) participant.rt = Math.max(0, participant.rt - rtPaidPips);
            if (grtPaidPips > 0) participant.grt = Math.max(0, participant.grt - Math.floor(grtPaidPips / 5));

            const actionPips = totalPips - costUsed;
            const stage = ordeal.stages[ordeal.currentStageIndex];
            if (stage && payload.applyToStage !== false) {
                stage.progress += actionPips;
                if (stage.difficulty !== null && stage.progress >= stage.difficulty) {
                    stage.isComplete = true;
                }
            }
            if (stage && payload.obstacleIndex !== undefined) {
                const obs = stage.obstacles[payload.obstacleIndex];
                if (obs && actionPips >= obs.difficulty) obs.resolved = true;
            }

            if (actionType === 'full') {
                participant.rt += Math.max(0, Math.trunc(payload.actionRt ?? 0));
                const extraCards = Math.max(0, played.length - 1);
                participant.grt += Math.max(0, Math.trunc(payload.actionGrt ?? extraCards));
            }

            if (ordeal.wildPool.length === 0 || state.deck.drawPile.length === 0) {
                ordeal.roundComplete = true;
            }

            emit('Ordeal:CardsPlayed', {
                actorId: participantId,
                actionType,
                drawnCount: drawn.length,
                played: allPlayed,
                totalPips,
                actionPips,
                rt: participant.rt,
                grt: participant.grt,
                roundComplete: ordeal.roundComplete,
                stageComplete: stage?.isComplete ?? false
            }, 'public');

            return {
                totalPips,
                actionPips,
                rt: participant.rt,
                grt: participant.grt,
                roundComplete: ordeal.roundComplete,
                stageComplete: stage?.isComplete ?? false
            };
        }
    });

    session.registerCommand('Ordeal:AdvancePhase', {
        roles: ['referee', 'system'],
        handler: ({ state, emit }) => {
            const ordeal = state.table?.activeOrdeal;
            if (!ordeal || ordeal.status !== 'Active') throw makeErr('NO_ACTIVE_ORDEAL', 'No active Ordeal.');
            ordeal.phaseNumber += 1;
            for (const p of Object.values(ordeal.participants)) {
                if (p.rt > 0) p.rt -= 1;
                if (p.grt > 0) p.grt -= 1;
            }
            emit('Ordeal:PhaseAdvanced', { phaseNumber: ordeal.phaseNumber }, 'public');
            return { phaseNumber: ordeal.phaseNumber };
        }
    });

    session.registerCommand('Ordeal:AdvanceRound', {
        roles: ['referee', 'system'],
        handler: ({ session: s, state, payload, emit }) => {
            const ordeal = state.table?.activeOrdeal;
            if (!ordeal || ordeal.status !== 'Active') throw makeErr('NO_ACTIVE_ORDEAL', 'No active Ordeal.');

            ensureSessionDeck(s, state);
            if (ordeal.wildPool.length > 0) {
                state.deck.discardPile.push(...ordeal.wildPool.splice(0, ordeal.wildPool.length));
            }

            // Reduce each Ordeal Pool (Score/Reduced Boon of pool size) and clear RT/GRT chips
            for (const [pid, p] of Object.entries(ordeal.participants)) {
                p.rt = 0;
                p.grt = 0;
                const poolLen = p.ordealPool.length;
                if (poolLen > 1) {
                    const keepCount = Math.max(1, Math.min(poolLen, Number(T13Boons.getBoonReduced(poolLen)) || 1));
                    const discarded = p.ordealPool.splice(keepCount);
                    if (discarded.length) state.deck.discardPile.push(...discarded);
                }
                // Apply Fresh -> Untreated transition to participant's characters at end of Round (docs/rules/Wounds.md)
                for (const char of Object.values(state.characters)) {
                    if (char.ownerActorId === pid && Array.isArray(char.wounds)) {
                        for (const w of char.wounds) {
                            if (w.freshness === 'Fresh') w.freshness = 'Untreated';
                        }
                    }
                }
            }

            if (payload.advanceStage && ordeal.currentStageIndex < ordeal.stages.length - 1) {
                ordeal.currentStageIndex += 1;
            }
            ordeal.roundNumber += 1;
            ordeal.phaseNumber = 1;
            ordeal.roundComplete = false;
            ordeal.wildPool = drawFromSessionDeck(s, state, ordeal.wildPoolSize);

            emit('Ordeal:RoundAdvanced', {
                roundNumber: ordeal.roundNumber,
                wildPool: clone(ordeal.wildPool),
                currentStageIndex: ordeal.currentStageIndex
            }, 'public');
            return { roundNumber: ordeal.roundNumber, wildPoolCount: ordeal.wildPool.length };
        }
    });

    session.registerCommand('Ordeal:Resolve', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const ordeal = state.table?.activeOrdeal;
            if (!ordeal) throw makeErr('NO_ACTIVE_ORDEAL', 'No active Ordeal.');
            ordeal.status = 'Resolved';
            ordeal.outcome = payload.outcome || 'Completed';
            if (!Array.isArray(state.table.ordealHistory)) state.table.ordealHistory = [];
            const summary = {
                id: ordeal.id,
                type: ordeal.type,
                stakes: ordeal.stakes,
                outcome: ordeal.outcome,
                roundsCompleted: ordeal.roundNumber
            };
            state.table.ordealHistory.push(summary);
            state.table.activeOrdeal = null;
            emit('Ordeal:Resolved', summary, 'public');
            return summary;
        }
    });

    // -------------------------------------------------------------------------
    // 2.4 Quest Spreads, Plots, I-Ching Gains, Hitches, Wounds & Sway
    // -------------------------------------------------------------------------
    session.registerCommand('Spread:InterpretQuest', {
        roles: ['referee', 'system'],
        handler: ({ session: s, state, payload, emit }) => {
            const interpreted = interpretQuestSpread(payload.spread, payload.hexagrams);
            const plotId = String(payload.plotId ?? `plot-${s.revision + 1}`);
            const plot = {
                id: plotId,
                title: payload.title || interpreted.situation?.Hexagram?.Name || 'Untitled Quest',
                status: 'PendingConfirmation',
                tensionLevel: Number(payload.tensionLevel ?? 0),
                situationHexagram: interpreted.situation.Hexagram.Number,
                solutionHexagram: interpreted.solution.Hexagram.Number,
                changingMask: interpreted.changingMask,
                quests: interpreted.lines.filter(l => l.changing && l.quest).map(l => ({
                    line: l.number,
                    quest: l.quest,
                    completed: false
                }))
            };
            state.plots[plotId] = plot;
            emit('Plot:CreatedFromQuestSpread', { plot: clone(plot) }, 'public');
            return { plot: clone(plot), interpreted };
        }
    });

    session.registerCommand('Plot:Confirm', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const plot = state.plots[String(payload.plotId ?? '')];
            if (!plot) throw makeErr('NOT_FOUND', `Plot '${payload.plotId}' not found.`);
            plot.status = 'Active';
            if (payload.title) plot.title = String(payload.title);
            emit('Plot:Confirmed', { plot: clone(plot) }, 'public');
            return { plot: clone(plot) };
        }
    });

    session.registerCommand('Plot:Update', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const plot = state.plots[String(payload.plotId ?? '')];
            if (!plot) throw makeErr('NOT_FOUND', `Plot '${payload.plotId}' not found.`);
            if (payload.tensionLevel !== undefined) plot.tensionLevel = Number(payload.tensionLevel);
            if (payload.status) plot.status = String(payload.status);
            if (payload.completeQuestLine !== undefined) {
                const q = plot.quests?.find(item => item.line === payload.completeQuestLine);
                if (q) q.completed = true;
            }
            emit('Plot:Updated', { plot: clone(plot) }, 'public');
            return { plot: clone(plot) };
        }
    });

    session.registerCommand('IChing:Calculate', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const character = state.characters[String(payload.characterId ?? '')];
            if (!character) throw makeErr('NOT_FOUND', `Character '${payload.characterId}' not found.`);
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            if (!isAuthority && character.ownerActorId !== actorId) {
                throw makeErr('FORBIDDEN', `Actor '${actorId}' cannot edit character '${character.id}'.`);
            }
            if (character.iching && !payload.forceRecalculate) {
                throw makeErr('ICHING_EXISTS', 'Existing saved Character I-Ching is preserved unless forceRecalculate is true.');
            }

            const pairs = payload.statPairs ?? character.facetweb?.StatPairs;
            const hexagrams = payload.hexagrams;
            if (!Array.isArray(pairs) || pairs.length !== 12) {
                throw makeErr('INVALID_STAT_PAIRS', 'IChing:Calculate requires 12 Facet pairs.');
            }
            if (!Array.isArray(hexagrams) || hexagrams.length !== 64) {
                throw makeErr('INVALID_HEXAGRAMS', 'IChing:Calculate requires all 64 hexagrams.');
            }

            const tieChoices = payload.tieChoices || {};
            const logical = [0, 0];
            for (let i = 0; i < 12; i++) {
                const pair = pairs[i];
                const f = (pair.Facet_Boon || 0) + (pair.Facet_Mutation_Matrix || 0);
                const a = (pair.Antifacet_Boon || 0) + (pair.Antifacet_Mutation_Matrix || 0);
                const targetIdx = i < 6 ? 0 : 1;
                const bit = i % 6;
                if (f > a) {
                    logical[targetIdx] |= (1 << bit);
                } else if (f === a) {
                    const choice = tieChoices[i] !== undefined ? Number(tieChoices[i]) : s.nextInt(0, 1);
                    if (choice !== 0 && choice !== 1) throw makeErr('INVALID_TIE_CHOICE', 'Tie choice must be 0 or 1.');
                    logical[targetIdx] |= (choice << bit);
                }
            }

            const lookupIdx = (val) => {
                const idx = hexagrams.findIndex(h => h?.Hexagram?.Logical === val);
                if (idx < 0) throw makeErr('HEXAGRAM_NOT_FOUND', `No hexagram found with Logical ${val}.`);
                return idx;
            };
            const hexIndexes = [lookupIdx(logical[0]), lookupIdx(logical[1])];
            const changingMask = logical[0] ^ logical[1];
            const primary = hexagrams[hexIndexes[0]];
            const ichingRecord = {
                hexIndexes,
                logical,
                changingMask,
                hexagramNumber: primary.Hexagram.Number,
                name: primary.Hexagram.Name,
                gains: clone(primary.Hexagram_Character?.Gains || []),
                changingLines: (primary.Hexagram_Character?.LineGains || []).filter(lg => changingMask & (1 << (lg.Line - 1))),
                unchangingPower: changingMask === 0 ? primary.Hexagram.Unchanging : null
            };
            character.iching = ichingRecord;
            if (!Array.isArray(character.ichingGrants)) character.ichingGrants = [];

            emit('IChing:Calculated', { characterId: character.id, iching: ichingRecord }, 'public');
            return { characterId: character.id, iching: ichingRecord };
        }
    });

    session.registerCommand('IChing:GrantReward', {
        roles: ['referee', 'system'],
        handler: ({ state, actorId, payload, revision, emit }) => {
            const character = state.characters[String(payload.characterId ?? '')];
            if (!character) throw makeErr('NOT_FOUND', `Character '${payload.characterId}' not found.`);
            if (!Array.isArray(character.ichingGrants)) character.ichingGrants = [];

            const gainKey = String(payload.gainKey ?? `${payload.rewardType}:${payload.condition || payload.line || 'default'}`);
            if (character.ichingGrants.some(g => g.gainKey === gainKey && !payload.allowRepeat)) {
                throw makeErr('GAIN_ALREADY_GRANTED', `I-Ching Gain '${gainKey}' already adjudicated for '${character.id}'.`);
            }

            const rewardType = String(payload.rewardType ?? 'Chi');
            const amount = Number(payload.amount ?? 1);
            if (!Number.isFinite(amount) || amount <= 0) {
                throw makeErr('INVALID_AMOUNT', 'Gain amount must be positive.');
            }

            const sway = ensureCharacterSway(character);
            if (rewardType === 'Yin' || rewardType === 'Tao:Yin') sway['Tao:Yin'] = (sway['Tao:Yin'] || 0) + amount;
            else if (rewardType === 'Yang' || rewardType === 'Tao:Yang') sway['Tao:Yang'] = (sway['Tao:Yang'] || 0) + amount;
            else sway[rewardType] = (sway[rewardType] || 0) + amount;

            const grantRecord = {
                gainKey,
                rewardType,
                amount,
                adjudicatedBy: actorId,
                revision
            };
            character.ichingGrants.push(grantRecord);

            emit('IChing:RewardGranted', { characterId: character.id, grant: grantRecord, sway: clone(sway) }, 'public');
            return { characterId: character.id, grant: grantRecord, sway: clone(sway) };
        }
    });

    session.registerCommand('Hitch:Evaluate', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const character = state.characters[String(payload.characterId ?? '')];
            if (!character) throw makeErr('NOT_FOUND', `Character '${payload.characterId}' not found.`);

            const bane = Number(payload.bane);
            const facetName = String(payload.facet ?? 'Trial');
            const facetMeta = getFacetMeta(facetName);
            const facetBoon = payload.facetBoon !== undefined ? Number(payload.facetBoon) : getFacetBoonOnCharacter(character, facetName);
            const tier = classifyHitchTier(bane, facetBoon);
            const marks = Number(T13Boons.getBoonReduced(bane));
            const ruins = Number(T13Boons.getBoonDraw(bane));

            const triggers = Array.isArray(payload.triggers) ? payload.triggers : [];
            const observed = Array.isArray(payload.observedTriggers) ? payload.observedTriggers : [];
            const triggered = payload.triggered !== undefined
                ? Boolean(payload.triggered)
                : triggers.some(t => observed.includes(t));

            const effects = [];
            if (triggered && Array.isArray(payload.gnarlFacets)) {
                for (const gf of payload.gnarlFacets) {
                    const gMeta = getFacetMeta(gf);
                    if (gMeta) {
                        effects.push(resolveGnarlSync(gMeta, { bane, marks, ruins, proficiencyId: payload.proficiencyId ?? null }));
                    }
                }
            }

            const record = {
                id: String(payload.hitchId ?? `hitch-${facetName.toLowerCase()}-${bane}`),
                facet: facetMeta?.FacetName || facetName,
                bane,
                marks,
                ruins,
                tier,
                triggered,
                effects
            };

            if (!Array.isArray(character.hitches)) character.hitches = [];
            const existingIdx = character.hitches.findIndex(h => h.id === record.id);
            if (existingIdx !== -1) character.hitches[existingIdx] = record;
            else character.hitches.push(record);

            emit('Hitch:Evaluated', { characterId: character.id, hitch: record }, 'public');
            return record;
        }
    });

    session.registerCommand('Wound:Apply', {
        roles: ['referee', 'system'],
        handler: ({ session: s, state, payload, emit }) => {
            const character = state.characters[String(payload.characterId ?? '')];
            if (!character) throw makeErr('NOT_FOUND', `Character '${payload.characterId}' not found.`);

            const stakes = payload.stakes || state.table?.activeOrdeal?.stakes || 'High';
            const bonusRoll = stakes === 'Soul' ? s.rollDie(6) : 0;
            const summary = summonWoundForStakes({
                stakes,
                cards: payload.cards || [],
                totalPips: payload.totalPips ?? null,
                limitPips: payload.limitPips ?? null,
                bonusDieRoll: bonusRoll
            });

            const wound = {
                id: String(payload.woundId ?? `wound-${s.revision + 1}`),
                level: payload.overrideLevel ?? summary.level,
                name: WOUND_LEVELS[payload.overrideLevel ?? summary.level]?.name || summary.name,
                pips: summary.pips,
                suit: summary.suit,
                stakes: summary.stakes,
                freshness: 'Fresh',
                damageType: payload.damageType || 'Physical',
                targetSlot: payload.targetSlot || null
            };
            if (!Array.isArray(character.wounds)) character.wounds = [];
            character.wounds.push(wound);

            emit('Wound:Applied', { characterId: character.id, wound }, 'public');
            return wound;
        }
    });

    session.registerCommand('Wound:UpdateState', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const character = state.characters[String(payload.characterId ?? '')];
            if (!character) throw makeErr('NOT_FOUND', `Character '${payload.characterId}' not found.`);
            if (!Array.isArray(character.wounds)) throw makeErr('NOT_FOUND', 'Character has no wounds.');

            const idx = character.wounds.findIndex(w => w.id === payload.woundId);
            if (idx === -1) throw makeErr('NOT_FOUND', `Wound '${payload.woundId}' not found.`);

            const wound = character.wounds[idx];
            if (payload.spendChiToReduce) {
                const cost = WOUND_LEVELS[wound.level]?.chiReduceCost || 0;
                const sway = ensureCharacterSway(character);
                if ((sway.Chi || 0) < cost) throw makeErr('INSUFFICIENT_SWAY', `Need ${cost} Chi to reduce ${wound.name} Wound.`);
                sway.Chi -= cost;
                if (wound.level <= 1) {
                    character.wounds.splice(idx, 1);
                    emit('Wound:Removed', { characterId: character.id, woundId: wound.id, chiSpent: cost }, 'public');
                    return { removed: true, woundId: wound.id, chiSpent: cost };
                }
                wound.level -= 1;
                wound.name = WOUND_LEVELS[wound.level].name;
            }

            if (payload.action === 'remove') {
                character.wounds.splice(idx, 1);
                emit('Wound:Removed', { characterId: character.id, woundId: wound.id }, 'public');
                return { removed: true, woundId: wound.id };
            }

            if (payload.freshness) {
                if (!WOUND_FRESHNESS_STATES.includes(payload.freshness)) {
                    throw makeErr('INVALID_FRESHNESS', `Invalid wound freshness '${payload.freshness}'.`);
                }
                wound.freshness = payload.freshness;
            }
            if (payload.levelDelta) {
                wound.level = Math.max(1, Math.min(WOUND_LEVELS.length - 1, wound.level + Math.trunc(payload.levelDelta)));
                wound.name = WOUND_LEVELS[wound.level].name;
            }

            emit('Wound:Updated', { characterId: character.id, wound: clone(wound) }, 'public');
            return clone(wound);
        }
    });

    session.registerCommand('Sway:Adjust', {
        roles: ['player', 'referee', 'system'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const character = state.characters[String(payload.characterId ?? '')];
            if (!character) throw makeErr('NOT_FOUND', `Character '${payload.characterId}' not found.`);

            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const currency = String(payload.currency ?? 'Chi');
            const delta = Number(payload.delta ?? 0);
            if (!Number.isFinite(delta) || delta === 0) throw makeErr('INVALID_AMOUNT', 'Sway delta must be non-zero finite.');
            if (!isAuthority && (delta > 0 || character.ownerActorId !== actorId)) {
                throw makeErr('FORBIDDEN', 'Players may only spend Sway from their own character.');
            }

            const sway = ensureCharacterSway(character);
            const current = Number(sway[currency] ?? 0);
            const next = current + delta;
            if (next < 0) {
                throw makeErr('INSUFFICIENT_SWAY', `Insufficient ${currency} (have ${current}, tried ${delta}).`);
            }
            sway[currency] = next;

            emit('Sway:Adjusted', { characterId: character.id, currency, delta, balance: next }, 'public');
            return { characterId: character.id, currency, balance: next };
        }
    });
}
