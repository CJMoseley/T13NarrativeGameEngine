/**
 * @module Modules/Mechanics/T13CardPlayRules
 * @description Pure, deterministic rulebook logic for Stage 2.6:
 * - Drama Dice (D2-D20), Drama Pools (Water/Fire/Wood/Earth/Metal/Void), Latent Drama,
 *   Card-based Drama, and Tension Levels (docs/rules/Drama.md, drama/*.json)
 * - Wyrd Tarot Hand Limits (Chi %), Court Persistence, Face-down suspension, and Wildcards
 *   (docs/rules/Card-Guide.md, cards.json)
 * - Yarn Top-of-Chi-Pool Math, Færy Yarn, Side-step / Quantum Swap / Retcon / Flip-Flop
 *   (docs/rules/Yarn.md)
 * - Narrative Tricks, Wild Pool Validation, Suit Parry/Soak, and Competitive Card Draw Tests
 *   (docs/rules/Narrative-Tricks.md, Ordeal-Rounds.md, Test-Card-Draw.md, Card-Guide-Wildcards.md)
 */

import T13Boons from './t13ne-boon.js';
import {
    SUIT_ID_BY_NAME,
    SUIT_NAME_BY_ID,
    resolveCardDrawTest
} from './T13TestRules.js';

// ---------------------------------------------------------------------------
// 1. Drama System Rules (docs/rules/Drama.md & drama/*.json)
// ---------------------------------------------------------------------------

export const DRAMA_DICE_TYPES = Object.freeze({
    Atmospheric: { type: 'Atmospheric', die: 'D2', sides: 2, defaultThresholdMod: 3 },
    Character: { type: 'Character', die: 'D3', sides: 3, defaultThresholdMod: 2 },
    Electrifying: { type: 'Electrifying', die: 'D4', sides: 4, defaultThresholdMod: 1 },
    Melodramatic: { type: 'Melodramatic', die: 'D5', sides: 5, defaultThresholdMod: 0 },
    Dramatic: { type: 'Dramatic', die: 'D6', sides: 6, defaultThresholdMod: 0 },
    Tense: { type: 'Tense', die: 'D8', sides: 8, defaultThresholdMod: 0 },
    Wearing: { type: 'Wearing', die: 'D10', sides: 10, defaultThresholdMod: -1 },
    Running: { type: 'Running', die: 'D12', sides: 12, defaultThresholdMod: -2 },
    'Drawn-out': { type: 'Drawn-out', die: 'D20', sides: 20, defaultThresholdMod: -3 }
});

export const DRAMA_POOL_TYPES = Object.freeze({
    Water: { type: 'Water', threshold: 2, multiplePairsAllowed: true },
    Fire: { type: 'Fire', threshold: 3, multiplePairsAllowed: false },
    Wood: { type: 'Wood', threshold: 4, multiplePairsAllowed: false },
    Earth: { type: 'Earth', threshold: 5, multiplePairsAllowed: false },
    Metal: { type: 'Metal', threshold: 6, multiplePairsAllowed: false },
    Void: { type: 'Void', threshold: 'All', multiplePairsAllowed: false }
});

export const TENSION_LEVELS = Object.freeze([
    { level: 1, type: 'None', latentLimit: 21 },
    { level: 2, type: 'Low', latentLimit: 19 },
    { level: 3, type: 'Medium', latentLimit: 16 },
    { level: 4, type: 'High', latentLimit: 13 },
    { level: 5, type: 'Open Conflict', latentLimit: 11 },
    { level: 6, type: 'Tragic Conflict', latentLimit: 9 }
]);

export const DRAMA_TYPES_BY_ROLL = Object.freeze({
    1: 'Atmospheric',
    2: 'Narrative Moment',
    3: 'Hazard',
    4: 'Prod',
    5: 'Break',
    6: 'Ratchet'
});

export function getDramaDieSpec(dieType = 'Dramatic') {
    const norm = String(dieType || 'Dramatic').trim().toLowerCase();
    for (const spec of Object.values(DRAMA_DICE_TYPES)) {
        if (spec.type.toLowerCase() === norm || spec.die.toLowerCase() === norm) {
            return spec;
        }
    }
    if (norm === 'standard') return DRAMA_DICE_TYPES.Dramatic;
    throw new Error(`Unknown Drama Die type '${dieType}'.`);
}

export function getDramaPoolSpec(poolType = 'Water') {
    const norm = String(poolType || 'Water').trim().toLowerCase();
    for (const spec of Object.values(DRAMA_POOL_TYPES)) {
        if (spec.type.toLowerCase() === norm) {
            return spec;
        }
    }
    throw new Error(`Unknown Drama Pool type '${poolType}'.`);
}

export function getLatentLimitForTension(level = 1) {
    if (typeof level === 'string') {
        const byName = TENSION_LEVELS.find(t => t.type.toLowerCase() === level.trim().toLowerCase());
        if (byName) return byName.latentLimit;
    }
    const n = Math.trunc(Number(level) || 1);
    const clamped = Math.max(1, Math.min(6, n));
    return TENSION_LEVELS.find(t => t.level === clamped)?.latentLimit ?? 21;
}

/**
 * Resolves a rolled Drama Die face (1..20) into a 1..6 Drama Type per docs/rules/Drama.md.
 */
export function resolveDramaTypeFromRoll(dieType, rolledValue, rollDie = (s) => 1 + Math.floor(Math.random() * s)) {
    const spec = getDramaDieSpec(dieType);
    const r = Math.max(1, Math.trunc(Number(rolledValue) || 1));
    let roll6;

    switch (spec.sides) {
        case 2:
            roll6 = r <= 2 ? r : Math.max(1, Math.min(6, Math.trunc(rollDie(6))));
            break;
        case 3:
            roll6 = r === 3 ? Math.max(1, Math.min(6, Math.trunc(rollDie(6)))) : (r <= 2 ? r : 1);
            break;
        case 4:
            roll6 = r <= 3 ? r : Math.max(1, Math.min(6, Math.trunc(rollDie(6))));
            break;
        case 5:
            roll6 = r === 1 ? Math.max(1, Math.min(6, Math.trunc(rollDie(6)))) : Math.min(6, r + 1);
            break;
        case 6:
            roll6 = Math.max(1, Math.min(6, r));
            break;
        case 8:
        case 10:
            roll6 = r <= 6 ? r : Math.max(1, Math.min(6, Math.trunc(rollDie(6))));
            break;
        case 12:
            roll6 = r <= 6 ? r : Math.max(1, Math.min(6, r - 6));
            break;
        case 20:
            roll6 = r <= 18 ? (((r - 1) % 6) + 1) : Math.max(1, Math.min(6, Math.trunc(rollDie(6))));
            break;
        default:
            roll6 = ((r - 1) % 6) + 1;
            break;
    }

    return {
        roll: roll6,
        dramaType: DRAMA_TYPES_BY_ROLL[roll6],
        rawRoll: r,
        dieType: spec.type
    };
}

/**
 * Evaluates a Drama Pool roll per docs/rules/Drama.md:
 * - Single die NEVER triggers Drama (not Void, not Overstressed, not reduced threshold).
 * - Multi-plot thresholds evaluated largest-first; triggered dice are consumed (no reuse, removed from pool).
 * - Water Pool pairs off all matching pairs when >=2 dice share a face.
 */
export function evaluateDramaPoolRoll({
    dice = [],
    plots = [],
    defaultPoolType = 'Water',
    thresholdModifier = 0,
    overstressed = false,
    rollDie = (s) => 1 + Math.floor(Math.random() * s)
} = {}) {
    const rolledDice = dice.map((die, index) => {
        const spec = getDramaDieSpec(die.type || 'Dramatic');
        const value = die.fixedRoll !== undefined && die.fixedRoll !== null
            ? Math.max(1, Math.min(spec.sides, Math.trunc(Number(die.fixedRoll))))
            : Math.max(1, Math.min(spec.sides, Math.trunc(Number(rollDie(spec.sides)))));
        return {
            ...die,
            id: die.id || `dd-${index + 1}`,
            type: spec.type,
            sides: spec.sides,
            value
        };
    });

    // Hard rule: a single die can NEVER trigger Drama
    if (rolledDice.length < 2) {
        return {
            rolledDice,
            triggered: [],
            remainingPool: rolledDice
        };
    }

    const candidates = (Array.isArray(plots) && plots.length > 0)
        ? plots.map((p, idx) => ({
            plotId: p.id || p.plotId || `plot-${idx + 1}`,
            poolType: getDramaPoolSpec(p.poolType || defaultPoolType).type,
            thresholdModifier: p.thresholdModifier ?? thresholdModifier,
            overstressed: p.overstressed ?? overstressed
        }))
        : [{
            plotId: null,
            poolType: getDramaPoolSpec(defaultPoolType).type,
            thresholdModifier,
            overstressed
        }];

    // Calculate effective threshold (clamped >= 2) and sort largest-first
    const resolvedCandidates = candidates.map(c => {
        const spec = getDramaPoolSpec(c.poolType);
        const mod = Number(c.thresholdModifier) || 0;
        const stressShift = c.overstressed ? 1 : 0;
        const rawThresh = spec.threshold === 'All'
            ? rolledDice.length + mod - stressShift
            : spec.threshold + mod - stressShift;
        return {
            ...c,
            isVoid: spec.threshold === 'All',
            multiplePairsAllowed: spec.multiplePairsAllowed,
            effectiveThreshold: Math.max(2, rawThresh)
        };
    }).sort((a, b) => b.effectiveThreshold - a.effectiveThreshold);

    const consumedIds = new Set();
    const triggered = [];

    // Group dice by face value regardless of die sides
    const valueOrder = [];
    const groupsByValue = new Map();
    for (const d of rolledDice) {
        if (!groupsByValue.has(d.value)) {
            groupsByValue.set(d.value, []);
            valueOrder.push(d.value);
        }
        groupsByValue.get(d.value).push(d);
    }

    for (const candidate of resolvedCandidates) {
        if (!candidate.multiplePairsAllowed && triggered.some(t => t.plotId === candidate.plotId)) {
            continue;
        }
        for (const faceValue of valueOrder) {
            const available = groupsByValue.get(faceValue).filter(d => !consumedIds.has(d.id));
            if (available.length < candidate.effectiveThreshold) continue;

            if (candidate.multiplePairsAllowed) {
                // Water triggers one Drama per pair
                let offset = 0;
                while (available.length - offset >= candidate.effectiveThreshold) {
                    const chunk = available.slice(offset, offset + candidate.effectiveThreshold);
                    for (const d of chunk) consumedIds.add(d.id);
                    const leadDie = chunk[0];
                    const resolved = resolveDramaTypeFromRoll(leadDie.type, faceValue, rollDie);
                    triggered.push({
                        plotId: candidate.plotId,
                        poolType: candidate.poolType,
                        thresholdUsed: candidate.effectiveThreshold,
                        faceValue,
                        roll: resolved.roll,
                        type: resolved.dramaType,
                        dice: chunk
                    });
                    offset += candidate.effectiveThreshold;
                }
            } else {
                // Non-Water claims all matching dice for this value once per plot evaluation
                for (const d of available) consumedIds.add(d.id);
                const leadDie = available[0];
                const resolved = resolveDramaTypeFromRoll(leadDie.type, faceValue, rollDie);
                triggered.push({
                    plotId: candidate.plotId,
                    poolType: candidate.poolType,
                    thresholdUsed: candidate.effectiveThreshold,
                    faceValue,
                    roll: resolved.roll,
                    type: resolved.dramaType,
                    dice: available
                });
                break; // One Drama per non-Water plot per roll check
            }
        }
    }

    const remainingPool = rolledDice.filter(d => !consumedIds.has(d.id));
    return {
        rolledDice,
        triggered,
        remainingPool
    };
}

// ---------------------------------------------------------------------------
// 2. Card Normalization, Card-Based Drama & Wyrd Tarot Rules
// ---------------------------------------------------------------------------

export function normalizeCardMeta(card = {}) {
    const rawSuit = card.suit ?? card.Suit ?? card.suitId ?? card.data?.Suit ?? 'Wildcard';
    const suitId = typeof rawSuit === 'number'
        ? rawSuit
        : (SUIT_ID_BY_NAME[String(rawSuit).trim()] ?? 0);
    const suitName = SUIT_NAME_BY_ID[suitId] || 'Wildcard';
    const rawName = String(card.name ?? card.Card ?? card.data?.Card ?? '');
    const parsedPips = parseInt(card.pips ?? card.Pips ?? card.data?.Pips ?? 0, 10);
    let pips = Number.isFinite(parsedPips) && parsedPips > 0 ? parsedPips : 0;
    if (!pips) {
        const n = rawName.toLowerCase();
        if (n.includes('jack')) pips = 11;
        else if (n.includes('queen')) pips = 12;
        else if (n.includes('king')) pips = 13;
        else if (n.includes('ace')) pips = 14;
        else if (n.includes('joker')) pips = 15;
    }

    let color = 'wild';
    if (suitId === 1 || suitId === 2) color = 'red';
    else if (suitId === 3 || suitId === 4) color = 'black';
    else {
        const lower = `${rawName} ${card.color || ''}`.toLowerCase();
        if (lower.includes('red') || lower.includes('light')) color = 'red';
        else if (lower.includes('black') || lower.includes('shadow')) color = 'black';
    }

    return {
        id: card.id || null,
        name: rawName || (pips === 15 ? `${color === 'black' ? 'Black' : 'Red'} Joker` : `${pips} of ${suitName}`),
        suitId,
        suit: suitName,
        pips,
        color,
        isWildcard: suitId === 0 || rawName.toLowerCase().includes('joker'),
        isCourt: pips >= 11 && pips <= 14
    };
}

/**
 * Classifies a Card played as Card-Based Drama per docs/rules/Drama.md Tension Dramas table.
 */
export function classifyCardDrama(card) {
    const meta = normalizeCardMeta(card);
    if (meta.pips >= 11) {
        if (meta.color === 'red' || (meta.isWildcard && meta.color !== 'black')) {
            return { roll: 5, type: 'Break', stressRelief: 'all', card: meta };
        }
        return { roll: 4, type: 'Prod', stressRelief: 2, card: meta };
    }
    switch (meta.suit) {
        case 'Diamonds':
            return { roll: 1, type: 'Atmospheric', stressRelief: 1, card: meta };
        case 'Hearts':
            return { roll: 2, type: 'Narrative Moment', stressRelief: 'facetDie', card: meta };
        case 'Spades':
            return { roll: 3, type: 'Hazard', stressRelief: '2+', card: meta };
        case 'Clubs':
            return { roll: 6, type: 'Ratchet', stressRelief: '2+', card: meta };
        default:
            return meta.color === 'black'
                ? { roll: 4, type: 'Prod', stressRelief: 2, card: meta }
                : { roll: 5, type: 'Break', stressRelief: 'all', card: meta };
    }
}

/**
 * Computes max Wyrd Tarot Hand size from Chi % per docs/rules/Card-Guide.md:
 * - Grunt: 100% per card, max 1 (or 0 if gruntAllowed is false)
 * - Mercari: 20% per card, max 5
 * - Solo: 10% per card, max 10
 */
export function calculateWyrdTarotHandLimit({
    powerTier = 'Mercari',
    currentChi = 0,
    maxChi = 0,
    gruntAllowed = true
} = {}) {
    const normTier = String(powerTier || 'Mercari').trim().toLowerCase();
    const cur = Math.max(0, Number(currentChi) || 0);
    const max = Math.max(0, Number(maxChi) || 0);
    const pct = max > 0 ? Math.min(100, Math.floor((cur / max) * 100)) : 0;

    if (normTier === 'extra') {
        return { powerTier: 'Extra', chiPercent: pct, limit: 0 };
    }
    if (normTier === 'grunt') {
        return {
            powerTier: 'Grunt',
            chiPercent: pct,
            limit: gruntAllowed && pct >= 100 ? 1 : 0
        };
    }
    if (normTier === 'solo') {
        return {
            powerTier: 'Solo',
            chiPercent: pct,
            limit: Math.min(10, Math.floor(pct / 10))
        };
    }
    return {
        powerTier: 'Mercari',
        chiPercent: pct,
        limit: Math.min(5, Math.floor(pct / 20))
    };
}

/**
 * Court cards + Aces remain atop a Character/Descendant's Wyrd Tarot spot ("while atop Target's pile");
 * Non-Court cards (2-10 and Jokers acting as Non-Court) take effect and are discarded.
 */
export function isPersistentWyrdTarotCard(card) {
    const meta = normalizeCardMeta(card);
    if (meta.isWildcard) return false;
    return meta.pips >= 11 && meta.pips <= 14;
}

// ---------------------------------------------------------------------------
// 3. Yarn Accounting & Reality Manipulation Rules (docs/rules/Yarn.md)
// ---------------------------------------------------------------------------

export const YARN_TECHNIQUE_COSTS = Object.freeze({
    'Side-step': 1,
    'Quantum Swap': 1,
    'Retcon:minimal': 2,
    'Retcon:personal': 4,
    'Retcon:extreme': 7,
    'Flip-Flop': 1
});

/**
 * Computes Yarn<->Chi conversions off the top of the stored Chi pool (docs/rules/Yarn.md).
 * Example: 20 Yarn = 131 Chi; spending 1 Yarn costs 10 Chi (131 -> 121 = 19 Yarn).
 * Gaining 1 Yarn at 0 Chi yields 2 Chi (Value(1) - Value(0) = 2).
 */
export function calculateTopOfPoolYarnChiDelta(currentChi = 0, yarnDelta = 0) {
    const chi = Math.max(0, Math.trunc(Number(currentChi) || 0));
    const delta = Math.trunc(Number(yarnDelta) || 0);
    const currentYarn = chi === 0 ? 0 : Math.max(0, Number(T13Boons.getBoonReduced(chi)) || 0);

    if (delta === 0) {
        return { ok: true, currentYarn, targetYarn: currentYarn, chiDelta: 0, newChi: chi };
    }

    if (delta < 0) {
        const spend = Math.abs(delta);
        if (currentYarn < spend) {
            return {
                ok: false,
                currentYarn,
                targetYarn: currentYarn - spend,
                chiDelta: 0,
                newChi: chi
            };
        }
        const cost = Number(T13Boons.getBoonValue(currentYarn)) - Number(T13Boons.getBoonValue(currentYarn - spend));
        return {
            ok: true,
            currentYarn,
            targetYarn: currentYarn - spend,
            chiDelta: -cost,
            newChi: Math.max(0, chi - cost)
        };
    }

    const gain = Number(T13Boons.getBoonValue(currentYarn + delta)) - Number(T13Boons.getBoonValue(currentYarn));
    return {
        ok: true,
        currentYarn,
        targetYarn: currentYarn + delta,
        chiDelta: gain,
        newChi: chi + gain
    };
}

export function calculateYarnManipulationCost({
    baseCost = 1,
    techniques = [],
    faeryType = null
} = {}) {
    let yarnCost = Math.max(0, Math.trunc(Number(baseCost) || 0));
    const techniqueBreakdown = [];

    for (const tech of techniques) {
        const key = String(tech || '').trim();
        const fee = YARN_TECHNIQUE_COSTS[key];
        if (fee === undefined) {
            throw new Error(`Unknown Yarn manipulation technique '${tech}'.`);
        }
        yarnCost += fee;
        techniqueBreakdown.push({ technique: key, yarnCost: fee });
    }

    let extraChi = 0;
    let extraYin = 0;
    let extraYang = 0;
    const normFaery = faeryType ? String(faeryType).trim().toLowerCase() : null;
    if (normFaery === 'seelie' || normFaery === 'divine' || normFaery === 'angelic') {
        extraChi = yarnCost;
        extraYin = yarnCost;
    } else if (normFaery === 'unseelie' || normFaery === 'devil' || normFaery === 'demonic') {
        extraChi = yarnCost;
        extraYang = yarnCost;
    }

    return {
        yarnCost,
        techniqueBreakdown,
        faeryType: normFaery,
        extraChi,
        extraYin,
        extraYang,
        causesMandelaEffect: techniques.includes('Quantum Swap')
    };
}

// ---------------------------------------------------------------------------
// 4. Narrative Tricks, Suit Parry/Soak & Competitive Card Draw Tests
// ---------------------------------------------------------------------------

export const SET_NARRATIVE_MEANINGS = Object.freeze({
    2: 'Twos signify conflict, opposition and choices.',
    3: 'Threes signify creativity and communication.',
    4: 'Fours signify stability and foundations.',
    5: 'Fives signify change and challenges.',
    6: 'Sixes signify harmony and adaptation.',
    7: 'Sevens signify surprises, conspiracies, illnesses and fun.',
    8: 'Eights signify karma and karmic retribution.',
    9: 'Nines signify fortune and rewards.',
    10: 'Tens indicate completion or endings.',
    11: 'Jacks signify youth, high spirits, quarrels and privilege.',
    12: 'Queens signify matriarchy, scandals, wisdom and betrayal.',
    13: 'Kings signify patriarchy, business, wisdom and good advice.',
    14: 'Aces signify beginnings, meetings, alliances and unions.'
});

export function getUnlockedNarrativeTricks(maxTrickSize = 0) {
    if (maxTrickSize < 2) return [];
    const unlocked = ['Advantage', 'Promise'];
    if (maxTrickSize >= 3) unlocked.push('Karmic Shift', 'Plight');
    if (maxTrickSize >= 4) unlocked.push('Discord');
    if (maxTrickSize >= 6) unlocked.push('Geas');
    if (maxTrickSize >= 9) unlocked.push('Schism');
    return unlocked;
}

/**
 * Detects Pairs / Sets / Runs / Flushes across played + Wild Pool cards and checks
 * whether all claimed Wild Pool cards participate in a valid Trick with played cards.
 */
export function detectOrdealTricks(playedCards = [], wildCards = [], { trumpSuit = null, allowTrumpShift = false } = {}) {
    const taggedPlayed = playedCards.map((c, idx) => ({
        raw: c,
        meta: normalizeCardMeta(c),
        source: 'played',
        uid: c.id || `p-${idx}`
    }));
    const taggedWild = wildCards.map((c, idx) => ({
        raw: c,
        meta: normalizeCardMeta(c),
        source: 'wild',
        uid: c.id || `w-${idx}`
    }));
    const combined = [...taggedPlayed, ...taggedWild];
    const tricks = [];

    const effectivePips = (entry) => {
        let p = entry.meta.pips;
        if (allowTrumpShift && trumpSuit && entry.meta.suit.toLowerCase() === String(trumpSuit).toLowerCase() && p <= 10) {
            p = Math.min(14, p + 2);
        }
        return p;
    };

    const wildcards = combined.filter(e => e.meta.isWildcard);
    const nonWilds = combined.filter(e => !e.meta.isWildcard);

    // Rank Sets (2+ cards sharing rank, + wildcards)
    const byRank = new Map();
    for (const e of nonWilds) {
        const r = effectivePips(e);
        if (!byRank.has(r)) byRank.set(r, []);
        byRank.get(r).push(e);
    }

    for (const [rank, entries] of byRank.entries()) {
        const cardsInSet = [...entries, ...wildcards];
        if (cardsInSet.length >= 2) {
            const label = cardsInSet.length === 2 ? 'Pair'
                : cardsInSet.length === 3 ? 'Set'
                : cardsInSet.length === 4 ? 'Quad'
                : `${cardsInSet.length}-of-a-Kind`;
            tricks.push({
                kind: 'RankSet',
                type: label,
                rank,
                count: cardsInSet.length,
                meaning: SET_NARRATIVE_MEANINGS[rank] || '',
                cardIds: cardsInSet.map(e => e.uid),
                hasPlayed: cardsInSet.some(e => e.source === 'played'),
                wildIds: cardsInSet.filter(e => e.source === 'wild').map(e => e.uid)
            });
        }
    }

    // Suit Flushes (3+ same suit)
    const bySuit = new Map();
    for (const e of nonWilds) {
        if (!bySuit.has(e.meta.suit)) bySuit.set(e.meta.suit, []);
        bySuit.get(e.meta.suit).push(e);
    }
    for (const [suit, entries] of bySuit.entries()) {
        const flushCards = [...entries, ...wildcards];
        if (flushCards.length >= 3) {
            tricks.push({
                kind: 'Flush',
                type: 'Flush',
                suit,
                count: flushCards.length,
                cardIds: flushCards.map(e => e.uid),
                hasPlayed: flushCards.some(e => e.source === 'played'),
                wildIds: flushCards.filter(e => e.source === 'wild').map(e => e.uid)
            });
        }
    }

    // Consecutive Runs (3+ distinct ranks, wildcards fill gaps)
    if (combined.length >= 3) {
        const uniqueRanks = Array.from(byRank.keys()).sort((a, b) => a - b);
        if (uniqueRanks.length + wildcards.length >= 3 && uniqueRanks.length >= 1) {
            for (let startIdx = 0; startIdx < uniqueRanks.length; startIdx++) {
                let remainingWilds = wildcards.length;
                const runEntries = [byRank.get(uniqueRanks[startIdx])[0]];
                let prevRank = uniqueRanks[startIdx];
                for (let j = startIdx + 1; j < uniqueRanks.length; j++) {
                    const gap = uniqueRanks[j] - prevRank - 1;
                    if (gap <= remainingWilds) {
                        remainingWilds -= gap;
                        runEntries.push(byRank.get(uniqueRanks[j])[0]);
                        prevRank = uniqueRanks[j];
                    } else {
                        break;
                    }
                }
                const usedWilds = wildcards.slice(0, wildcards.length - remainingWilds + remainingWilds);
                const runCards = [...runEntries, ...usedWilds];
                if (runCards.length >= 3 && runEntries.length >= 2) {
                    tricks.push({
                        kind: 'Run',
                        type: 'Run',
                        count: runCards.length,
                        cardIds: runCards.map(e => e.uid),
                        hasPlayed: runCards.some(e => e.source === 'played'),
                        wildIds: runCards.filter(e => e.source === 'wild').map(e => e.uid)
                    });
                    break;
                }
            }
        }
    }

    // Wild Pool validation: every Wild Pool card must be paired in a trick that includes >=1 played card
    let wildPoolTrickValid = true;
    if (taggedWild.length > 0) {
        const coveredWildIds = new Set();
        for (const trick of tricks) {
            if (!trick.hasPlayed) continue;
            for (const wid of trick.wildIds) coveredWildIds.add(wid);
        }
        wildPoolTrickValid = taggedWild.every(w => coveredWildIds.has(w.uid));
    }

    const maxTrickSize = tricks.reduce((max, t) => Math.max(max, t.count), 0);
    return {
        tricks,
        maxTrickSize,
        wildPoolTrickValid,
        unlockedNarrativeTricks: getUnlockedNarrativeTricks(maxTrickSize)
    };
}

/**
 * Computes Suit Parry / Soak effects per docs/rules/Card-Guide-Wildcards.md & Ordeal Suit text.
 */
export function resolveSuitDefenseEffect(suit, mode = 'Parry', {
    attackCards = [],
    defenseCards = [],
    matchedCardId = null
} = {}) {
    const normSuit = SUIT_NAME_BY_ID[SUIT_ID_BY_NAME[String(suit || '').trim()] ?? 0] || String(suit || '');
    const normMode = String(mode || 'Parry').trim().toLowerCase() === 'soak' ? 'Soak' : 'Parry';

    const matchedAttack = (matchedCardId
        ? attackCards.find(c => c.id === matchedCardId)
        : attackCards[0]) || null;
    const unmatchedAttack = attackCards.filter(c => !matchedAttack || c.id !== matchedAttack.id);
    const remainingDefense = defenseCards.slice(1);
    const totalPipsOf = (cards) => cards.reduce((sum, c) => sum + (normalizeCardMeta(c).pips || 0), 0);

    if (normSuit === 'Diamonds') {
        if (normMode === 'Parry') {
            return {
                suit: 'Diamonds',
                mode: 'Parry',
                effectName: 'Seize the initiative',
                addToDefenderPool: unmatchedAttack,
                discardedAttackIds: matchedAttack ? [matchedAttack.id] : [],
                discardAttack: false
            };
        }
        return {
            suit: 'Diamonds',
            mode: 'Soak',
            effectName: 'Ready',
            prepareForDefender: matchedAttack ? [matchedAttack] : [],
            discardedDefenseIds: defenseCards.slice(0, 1).map(c => c.id)
        };
    }

    if (normSuit === 'Clubs') {
        if (normMode === 'Parry') {
            const disarmPips = totalPipsOf(remainingDefense);
            return {
                suit: 'Clubs',
                mode: 'Parry',
                effectName: 'Disarm',
                discardedAttackIds: attackCards.map(c => c.id),
                discardAttack: true,
                attackerRtAdded: disarmPips,
                attackerGrtAdded: Math.floor(disarmPips / 5)
            };
        }
        const secondDiscard = unmatchedAttack[0] ? [unmatchedAttack[0].id] : [];
        return {
            suit: 'Clubs',
            mode: 'Soak',
            effectName: 'Ward',
            discardedAttackIds: [matchedAttack?.id, ...secondDiscard].filter(Boolean)
        };
    }

    if (normSuit === 'Hearts') {
        if (normMode === 'Parry') {
            const slowPips = totalPipsOf(unmatchedAttack);
            return {
                suit: 'Hearts',
                mode: 'Parry',
                effectName: 'Locked Respite',
                discardedAttackIds: attackCards.map(c => c.id),
                healOrStabilizeCount: unmatchedAttack.length,
                optionalAttackerRt: slowPips,
                optionalAttackerGrt: Math.floor(slowPips / 5)
            };
        }
        return {
            suit: 'Hearts',
            mode: 'Soak',
            effectName: 'Disengage',
            discardedAttackIds: matchedAttack ? [matchedAttack.id] : [],
            healWoundsUnderPips: normalizeCardMeta(matchedAttack || defenseCards[0] || {}).pips,
            healLevels: 1
        };
    }

    if (normSuit === 'Spades') {
        if (normMode === 'Parry') {
            return {
                suit: 'Spades',
                mode: 'Parry',
                effectName: 'Redirect-Attack',
                redirectedAttackCards: unmatchedAttack,
                discardedAttackIds: matchedAttack ? [matchedAttack.id] : []
            };
        }
        return {
            suit: 'Spades',
            mode: 'Soak',
            effectName: 'Counter-Attack',
            reflectedAttackCards: matchedAttack ? [matchedAttack] : []
        };
    }

    return { suit: normSuit, mode: normMode, effectName: 'Standard' };
}

/**
 * Extracts multi-context complication hooks from a played Card Draw Test card
 * (docs/rules/Test-Card-Draw.md "Complicating the Card Draw Test").
 */
export function extractCardComplications(card) {
    if (!card || typeof card !== 'object') return null;
    const meta = normalizeCardMeta(card);
    const data = card.data || {};
    return {
        cardName: meta.name,
        suit: meta.suit,
        pips: meta.pips,
        woundLevel: data.Wound_Level ?? card.woundLevel ?? null,
        wyrdTarot: data.Tarot?.WyrdTarot ?? card.wyrdTarot ?? null,
        yarnName: data.Yarn?.Yarn_Name ?? card.yarnName ?? null,
        suggestedAction: data.Ordeal?.Suggested_Action ?? card.suggestedAction ?? null,
        suggestedTest: data.Ordeal?.Test ?? card.suggestedTest ?? null,
        stressType: data.Stress?.Type ?? card.stressType ?? null,
        traumaType: data.Trauma?.Type ?? card.traumaType ?? null,
        cardDrama: classifyCardDrama(card)
    };
}

/**
 * Resolves a comparative multi-character Card Draw Test per docs/rules/Test-Card-Draw.md:
 * - Evaluates each participant's Card Draw Test.
 * - Sorts highest Pips total first and grants +1 SL (or placeBonuses[rank-1]) to top placers.
 * - Grants +1 FL to placements below failureCutoffRank when configured.
 */
export function resolveCompetitiveCardDrawTest(entries = [], {
    placeBonuses = [1],
    failureCutoffRank = null
} = {}) {
    const evaluated = entries.map((entry, idx) => {
        const res = resolveCardDrawTest(entry);
        return {
            actorId: entry.actorId ?? null,
            characterId: entry.characterId ?? null,
            entryIndex: idx,
            ...res,
            complications: extractCardComplications(entry.card)
        };
    });

    const sorted = [...evaluated].sort((a, b) => b.total - a.total);
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i].total < sorted[i - 1].total) {
            currentRank = i + 1;
        }
        sorted[i].rank = currentRank;
        const bonusSL = Array.isArray(placeBonuses) ? (Number(placeBonuses[currentRank - 1]) || 0) : 0;
        if (bonusSL > 0) {
            sorted[i].successLevels += bonusSL;
            sorted[i].details.push(`Competitive Rank #${currentRank} (+${bonusSL} Success Level${bonusSL > 1 ? 's' : ''})`);
        }
        if (failureCutoffRank !== null && currentRank > failureCutoffRank) {
            sorted[i].failureLevels += 1;
            sorted[i].details.push(`Below Rank #${failureCutoffRank} (+1 Failure Level)`);
        }
    }

    return sorted;
}

export default {
    DRAMA_DICE_TYPES,
    DRAMA_POOL_TYPES,
    TENSION_LEVELS,
    DRAMA_TYPES_BY_ROLL,
    YARN_TECHNIQUE_COSTS,
    SET_NARRATIVE_MEANINGS,
    getDramaDieSpec,
    getDramaPoolSpec,
    getLatentLimitForTension,
    resolveDramaTypeFromRoll,
    evaluateDramaPoolRoll,
    normalizeCardMeta,
    classifyCardDrama,
    calculateWyrdTarotHandLimit,
    isPersistentWyrdTarotCard,
    calculateTopOfPoolYarnChiDelta,
    calculateYarnManipulationCost,
    getUnlockedNarrativeTricks,
    detectOrdealTricks,
    resolveSuitDefenseEffect,
    extractCardComplications,
    resolveCompetitiveCardDrawTest
};
