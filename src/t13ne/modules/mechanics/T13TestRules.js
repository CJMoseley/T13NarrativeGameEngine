/**
 * @module Modules/Mechanics/T13TestRules
 * @description Pure, deterministic rulebook implementations for T13 Dice Tests, Card Draw Tests,
 * Value Tests, Potency Chi/Difficulty conversions, Proficiency Crises, Numerology Crits/Fumbles,
 * and Trump/Misfit Facet alignment (docs/rules/Test-Dice.md, Test-Card-Draw.md, Test-Value.md,
 * Success-and-Failure-Levels.md). Zero browser globals; runnable in Node, Workers, and T13Session.
 */

import T13Boons from './t13ne-boon.js';
import { getDifficultyModifiers } from './FacetRuleEffects.js';

import awe from '../../data/facets/awe.js';
import burden from '../../data/facets/burden.js';
import craft from '../../data/facets/craft.js';
import dominion from '../../data/facets/dominion.js';
import enigma from '../../data/facets/enigma.js';
import fury from '../../data/facets/fury.js';
import gossamer from '../../data/facets/gossamer.js';
import heresy from '../../data/facets/heresy.js';
import inertia from '../../data/facets/inertia.js';
import jeer from '../../data/facets/jeer.js';
import key from '../../data/facets/key.js';
import liberty from '../../data/facets/liberty.js';
import miasma from '../../data/facets/miasma.js';
import nature from '../../data/facets/nature.js';
import orthodox from '../../data/facets/orthodox.js';
import phoenix from '../../data/facets/phoenix.js';
import quiet from '../../data/facets/quiet.js';
import rook from '../../data/facets/rook.js';
import sin from '../../data/facets/sin.js';
import trial from '../../data/facets/trial.js';
import virtue from '../../data/facets/virtue.js';
import wyrd from '../../data/facets/wyrd.js';
import yonder from '../../data/facets/yonder.js';
import zeal from '../../data/facets/zeal.js';

export const SUIT_NAME_BY_ID = Object.freeze({
    0: 'Wildcard',
    1: 'Diamonds',
    2: 'Hearts',
    3: 'Clubs',
    4: 'Spades'
});

export const SUIT_ID_BY_NAME = Object.freeze({
    Wildcard: 0,
    wildcard: 0,
    '0': 0,
    Diamonds: 1,
    diamonds: 1,
    '♦': 1,
    '1': 1,
    Hearts: 2,
    hearts: 2,
    '♥': 2,
    '2': 2,
    Clubs: 3,
    clubs: 3,
    '♣': 3,
    '3': 3,
    Spades: 4,
    spades: 4,
    '♠': 4,
    '4': 4
});

// Canonical 24 Facets imported directly from src/t13ne/data/facets/*.js
export const FACET_CATALOG = Object.freeze([
    awe, burden, craft, dominion, enigma, fury, gossamer, heresy,
    inertia, jeer, key, liberty, miasma, nature, orthodox, phoenix,
    quiet, rook, sin, trial, virtue, wyrd, yonder, zeal
]);

// Main Boon -> Die progression from src/t13ne/data/json/tests/dice.json
const MAIN_BOON_DICE = Object.freeze([
    { boon: 1, die: '1d2-1' },
    { boon: 3, die: '1d2' },
    { boon: 5, die: '1d3' },
    { boon: 7, die: '1d4' },
    { boon: 8, die: '1d5' },
    { boon: 10, die: '1d6' },
    { boon: 13, die: '1d5+1' },
    { boon: 14, die: '1d4+2' },
    { boon: 15, die: '1d8' },
    { boon: 16, die: '1d3+3' },
    { boon: 20, die: '1d10' },
    { boon: 24, die: '1d12' },
    { boon: 50, die: '1d20' },
    { boon: 655, die: '1d100' },
    { boon: 2526, die: '1d200' }
]);

export function getFacetMeta(identifier) {
    if (identifier == null) return null;
    if (typeof identifier === 'object') {
        if (identifier.FacetName) return getFacetMeta(identifier.FacetName);
        if (identifier.FacetIndex !== undefined) return getFacetMeta(identifier.FacetIndex);
    }
    if (typeof identifier === 'number' || /^\d+$/.test(String(identifier))) {
        const idx = Number(identifier);
        return FACET_CATALOG.find(f => f.FacetIndex === idx) || null;
    }
    const norm = String(identifier).trim().toLowerCase();
    return FACET_CATALOG.find(f => f.FacetName.toLowerCase() === norm) || null;
}

export function suitColor(suitIdOrName) {
    const id = typeof suitIdOrName === 'number'
        ? suitIdOrName
        : (SUIT_ID_BY_NAME[String(suitIdOrName)] ?? 0);
    if (id === 1 || id === 2) return 'red';
    if (id === 3 || id === 4) return 'black';
    return 'wild';
}

export function defaultDiceForBoon(boon = 13) {
    const n = Number(boon);
    if (!Number.isFinite(n) || n <= 1) return '1d2-1';
    let best = MAIN_BOON_DICE[0].die;
    for (const entry of MAIN_BOON_DICE) {
        if (entry.boon === n) return entry.die;
        if (entry.boon < n) best = entry.die;
    }
    return best;
}

export function rollDiceSpec(diceStr, rngInt) {
    if (!diceStr || typeof rngInt !== 'function') {
        return { score: 0, rolls: [], str: String(diceStr || '0') };
    }
    const match = String(diceStr).trim().match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/i);
    if (!match) return { score: 0, rolls: [], str: String(diceStr) };

    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const op = match[3] || '+';
    const mod = match[4] ? parseInt(match[4], 10) : 0;

    const rolls = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
        const rolled = rngInt(1, sides);
        rolls.push(rolled);
        sum += rolled;
    }
    const score = op === '-' ? sum - mod : sum + mod;
    return { score, rolls, mod: op === '-' ? -mod : mod, str: String(diceStr) };
}

export function numerologyCrunch(value) {
    let n = Math.abs(Math.trunc(Number(value) || 0));
    if (n === 0) return 0;
    while (n > 13) {
        let s = 0;
        for (const ch of String(n)) s += Number(ch);
        n = s;
    }
    return n;
}

export function getBoonFromValue(value) {
    if (!Number.isFinite(value) || value <= 0) return 0;
    let boon = 0;
    while (T13Boons.getBoonValue(boon + 1) <= value) {
        boon++;
        if (boon > 200) break;
    }
    return boon;
}

export function calculateChi(score, potency = 'Intrepid') {
    const s = Number(score) || 0;
    switch (String(potency || 'Intrepid').toLowerCase()) {
        case 'banal':
            return getBoonFromValue(s);
        case 'bold':
            return s;
        case 'monstrous':
            return Number(T13Boons.getBoonValue(s));
        case 'twisted':
            return Number(T13Boons.getBoonValue(T13Boons.getBoonValue(s)));
        case 'intrepid':
        default:
            return Math.floor(s / 2);
    }
}

export function scaleDifficultyForPotency(baseDifficulty = 0, potency = 'Intrepid') {
    const d = Number(baseDifficulty) || 0;
    switch (String(potency || 'Intrepid').toLowerCase()) {
        case 'banal':
            return T13Boons.getBoonValue(d);
        case 'intrepid':
            return d * 2;
        case 'bold':
            return d;
        case 'monstrous':
            return Math.max(1, Number(T13Boons.getBoonReduced(d)) || 0);
        default:
            return d * 2;
    }
}

/**
 * Evaluates Trump vs Misfit Facet alignment per docs/rules/Success-and-Failure-Levels.md.
 * - Exact Trump match: +5 Score (Dice Test), +2 Pips (Card Test), +1 Success Level.
 * - Anti-Facet: +3 Failure Levels.
 * - Other Facets: +1 Failure Level if Suit color differs (Red vs Black);
 *   +1 Failure Level if Tao polarity differs (Yin vs Yang), unless same suit and ignoreYinYangOnSameSuit.
 */
export function evaluateFacetAlignment(chosenFacet, trumpFacet, { ignoreYinYangOnSameSuit = false } = {}) {
    const chosen = getFacetMeta(chosenFacet);
    const trump = getFacetMeta(trumpFacet);

    if (!chosen || !trump) {
        return {
            isTrump: false,
            isAntiFacet: false,
            scoreBonus: 0,
            cardPipBonus: 0,
            successLevels: 0,
            failureLevels: 0,
            reasons: []
        };
    }

    if (chosen.FacetIndex === trump.FacetIndex) {
        return {
            isTrump: true,
            isAntiFacet: false,
            scoreBonus: 5,
            cardPipBonus: 2,
            successLevels: 1,
            failureLevels: 0,
            reasons: [`Trump Facet ${trump.FacetName} (+5 Score, +1 SL)`]
        };
    }

    if (chosen.FacetIndex === trump.AntiFacet) {
        return {
            isTrump: false,
            isAntiFacet: true,
            scoreBonus: 0,
            cardPipBonus: 0,
            successLevels: 0,
            failureLevels: 3,
            reasons: [`Anti-Facet ${chosen.FacetName} vs ${trump.FacetName} (+3 Failure Levels)`]
        };
    }

    let failureLevels = 0;
    const reasons = [];
    const sameSuit = chosen.Suit === trump.Suit;

    if (suitColor(chosen.Suit) !== suitColor(trump.Suit)) {
        failureLevels += 1;
        reasons.push(`Misfit Suit Colour (${chosen.FacetName} vs ${trump.FacetName}, +1 FL)`);
    }
    if (chosen.Yang !== trump.Yang && !(sameSuit && ignoreYinYangOnSameSuit)) {
        failureLevels += 1;
        reasons.push(`Misfit Tao Yin/Yang (${chosen.FacetName} vs ${trump.FacetName}, +1 FL)`);
    }

    return {
        isTrump: false,
        isAntiFacet: false,
        scoreBonus: 0,
        cardPipBonus: 0,
        successLevels: 0,
        failureLevels,
        reasons
    };
}

/**
 * Resolves a rulebook-backed Dice Test (Single Roll or Pools).
 */
export function resolveDiceTest(params = {}) {
    const {
        facet = 'Awe',
        trumpFacet = null,
        boon = 13,
        mainDieStr = null,
        proficiencies = 1,
        descendantBoon = null,
        descendantDieStr = null,
        strainDice = [],
        extraDice = [],
        difficulty = 0,
        potency = 'Intrepid',
        pool = false,
        difficultyEffects = undefined,
        geometry = null,
        scoreBonus = 0,
        rngInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))
    } = params;

    let targetDifficulty = pool ? difficulty : scaleDifficultyForPotency(difficulty, potency);
    const difficultyModifiers = difficultyEffects === undefined ? null : getDifficultyModifiers(difficultyEffects);
    if (difficultyModifiers) targetDifficulty += difficultyModifiers.score;

    const alignment = evaluateFacetAlignment(facet, trumpFacet);
    const resolvedMainStr = mainDieStr || defaultDiceForBoon(boon);
    const mainRoll = rollDiceSpec(resolvedMainStr, rngInt);
    let mainDieScore = mainRoll.score;

    const diceResults = [{ type: 'Main', str: resolvedMainStr, rolls: mainRoll.rolls, score: mainDieScore }];
    const details = [...alignment.reasons, `Main Die (${resolvedMainStr}): ${mainDieScore}`];

    const profCount = Array.isArray(proficiencies) ? proficiencies.length : Math.max(0, Math.trunc(Number(proficiencies) || 0));
    let profScore = 0;
    let crisis = false;

    if (profCount === 0) {
        mainDieScore = Math.floor(mainDieScore / 2);
        diceResults[0].score = mainDieScore;
        details.push('No Proficiencies (0): Main Score Halved');
    } else if (profCount >= 2) {
        const numDice = profCount === 2 ? 1 : profCount === 3 ? 2 : 3;
        const profRolls = [];
        let ones = 0;
        let sixes = 0;
        for (let i = 0; i < numDice; i++) {
            const r = rngInt(1, 6);
            profRolls.push(r);
            profScore += r;
            if (r === 1) ones++;
            if (r === 6) sixes++;
        }
        if (ones === numDice) crisis = 'Snake Eyes';
        else if (sixes === numDice) crisis = 'Boxcars';
        diceResults.push({ type: 'Proficiency', str: `${numDice}d6`, rolls: profRolls, score: profScore });
        details.push(`Proficiency Dice (${numDice}d6): ${profScore} [${profRolls.join(', ')}]`);
    }

    let descScore = 0;
    if (descendantDieStr || descendantBoon != null) {
        const dStr = descendantDieStr || defaultDiceForBoon(descendantBoon);
        const dRoll = rollDiceSpec(dStr, rngInt);
        descScore = dRoll.score;
        diceResults.push({ type: 'Descendant', str: dStr, rolls: dRoll.rolls, score: descScore });
        details.push(`Descendant Die (${dStr}): ${descScore}`);
    }

    let strainTotal = 0;
    for (const s of strainDice) {
        const sStr = s.dieStr || defaultDiceForBoon(s.boon ?? boon);
        const sRoll = rollDiceSpec(sStr, rngInt);
        strainTotal += sRoll.score;
        diceResults.push({ type: 'Strain', str: sStr, rolls: sRoll.rolls, score: sRoll.score });
        details.push(`Strain Die (${sStr}): ${sRoll.score}`);
    }

    let extraTotal = 0;
    for (const e of extraDice) {
        const eStr = e.dieStr || defaultDiceForBoon(e.boon ?? boon);
        const eRoll = rollDiceSpec(eStr, rngInt);
        extraTotal += eRoll.score;
        diceResults.push({ type: 'Extra', str: eStr, rolls: eRoll.rolls, score: eRoll.score });
        details.push(`Extra Die (${eStr}): ${eRoll.score}`);
    }

    let success = false;
    let successLevels = alignment.successLevels;
    let failureLevels = alignment.failureLevels;
    let resultType = '';
    let totalScore = mainDieScore + profScore + descScore + strainTotal + extraTotal + alignment.scoreBonus + scoreBonus;

    if (pool) {
        let passes = 0;
        let fails = 0;
        const mainPoolScore = mainDieScore + alignment.scoreBonus + scoreBonus;
        if (mainPoolScore >= targetDifficulty) passes++; else fails++;
        if (profCount >= 2) {
            if (profScore >= targetDifficulty) passes++; else fails++;
        }
        if (descendantDieStr || descendantBoon != null) {
            if (descScore >= targetDifficulty) passes++; else fails++;
        }
        for (const r of diceResults) {
            if (r.type === 'Strain' || r.type === 'Extra') {
                if (r.score >= targetDifficulty) passes++; else fails++;
            }
        }
        if (passes > 0) {
            success = true;
            successLevels += passes - 1;
            resultType = passes >= 3 ? 'Superior Success' : passes === 2 ? 'Complete Success' : 'Moderate Success';
        } else {
            success = false;
            failureLevels += fails;
            resultType = fails >= 3 ? 'Serious Failure' : fails === 2 ? 'Complete Failure' : 'Moderate Failure';
        }
        totalScore = Math.max(mainPoolScore, ...diceResults.map(r => r.score));
    } else {
        let baseLevel = 0;
        if (totalScore >= targetDifficulty) {
            success = true;
            if (targetDifficulty > 0 && totalScore >= targetDifficulty * 3) {
                baseLevel = 3;
                resultType = 'Superior Success';
            } else if (targetDifficulty > 0 && totalScore >= targetDifficulty * 2) {
                baseLevel = 2;
                resultType = 'Complete Success';
            } else if (totalScore === targetDifficulty) {
                baseLevel = 1;
                resultType = 'Borderline/Stalemate';
                failureLevels += 1;
            } else {
                baseLevel = 1;
                resultType = 'Moderate Success';
            }
            successLevels += baseLevel;
        } else {
            success = false;
            if (totalScore < 0) {
                baseLevel = 3;
                resultType = 'Serious Failure';
            } else if (targetDifficulty > 0 && totalScore < targetDifficulty / 2) {
                baseLevel = 2;
                resultType = 'Complete Failure';
            } else {
                baseLevel = 1;
                resultType = 'Moderate Failure';
            }
            failureLevels += baseLevel;
        }

        // Doubles (11, 22, 33, ...) add +1 SL on pass or +1 FL on fail
        if (totalScore >= 11 && totalScore < 100 && totalScore % 11 === 0) {
            if (success) successLevels++; else failureLevels++;
            details.push(`Doubles (${totalScore}): +1 ${success ? 'Success' : 'Failure'} Level`);
        }

        // Optional Numerology check against Character Geometry / Perfect / Nemesis
        if (geometry) {
            const sum = numerologyCrunch(totalScore);
            const charGeo = geometry?.Geo?.Number ?? geometry?.Geo?.Geometry ?? geometry?.geometryNumber ?? null;
            if (geometry.GeoHarmonics?.Perfect === sum || charGeo === sum) {
                successLevels++;
                details.push(`Numerology Critical (${sum}) (+1 Success Level)`);
            } else if (geometry.GeoHarmonics?.Nemesis === sum) {
                failureLevels++;
                details.push(`Numerology Fumble (${sum}) (+1 Failure Level)`);
            }
        }

        // Proficiency Crisis rules (docs/rules/Test-Dice.md)
        if (crisis) {
            details.push(`Proficiency Crisis: ${crisis}`);
            if (success) {
                if (crisis === 'Snake Eyes') {
                    resultType = 'Borderline/Stalemate';
                } else if (crisis === 'Boxcars') {
                    failureLevels += baseLevel || 1;
                    details.push(`Reversal of Success (+${baseLevel || 1} Failure Level)`);
                }
            } else {
                if (crisis === 'Snake Eyes') {
                    successLevels += baseLevel || 1;
                    details.push(`Reversal of Success (+${baseLevel || 1} Success Level)`);
                } else if (crisis === 'Boxcars') {
                    resultType = 'Borderline/Stalemate';
                }
            }
        }
    }

    return {
        type: 'Dice',
        facet: getFacetMeta(facet)?.FacetName || facet,
        isPool: Boolean(pool),
        potency,
        score: totalScore,
        targetDifficulty,
        chi: calculateChi(totalScore, potency),
        success,
        successLevels,
        failureLevels,
        resultType,
        crisis,
        alignment,
        details,
        diceResults,
        ...(difficultyModifiers ? { difficultyModifiers } : {})
    };
}

/**
 * Resolves a Card Draw Test per docs/rules/Test-Card-Draw.md.
 */
export function resolveCardDrawTest(params = {}) {
    const {
        facet = 'Awe',
        trumpFacet = null,
        boon = 13,
        card,
        difficulty = 10,
        proficiencies = [],
        chiSpend = 0,
        stressGain = 0,
        strainGain = 0,
        shockGain = 0
    } = params;

    if (!card) {
        return { error: 'No card provided for Card Draw Test.' };
    }

    const baseFacetMeta = getFacetMeta(facet);
    const activeFacet = getFacetMeta(trumpFacet) || baseFacetMeta;
    const cardSuitId = SUIT_ID_BY_NAME[String(card.suit ?? card.Suit ?? '')] ?? 0;
    const pips = parseInt(card.pips ?? card.Pips ?? 0, 10) || 0;
    const facetDraw = T13Boons.getBoonDraw(boon);

    let total = pips + facetDraw;
    let successLevels = 0;
    let failureLevels = 0;
    const details = [`Drawn ${card.name || card.Card || 'Card'} (${pips} Pips)`, `Facet Draw (+${facetDraw})`];

    if (activeFacet) {
        const antiMeta = getFacetMeta(activeFacet.AntiFacet);
        if (cardSuitId === 0 || cardSuitId === activeFacet.Suit) {
            total += 2;
            details.push(`Trump Suit ${SUIT_NAME_BY_ID[activeFacet.Suit]} (+2 Pips)`);
        }
        if (antiMeta && cardSuitId === antiMeta.Suit && cardSuitId !== 0) {
            failureLevels += 1;
            details.push(`Opposed Suit (${antiMeta.FacetName}, +1 Failure Level)`);
        } else if (cardSuitId !== 0 && suitColor(cardSuitId) !== suitColor(activeFacet.Suit)) {
            failureLevels += 1;
            details.push('Opposite Colour Suit (+1 Failure Level)');
        }
    }

    // Applicable Proficiencies by Suit (+5 Suited, +2 same-colour Unsuited, +1 other)
    if (Array.isArray(proficiencies)) {
        for (const prof of proficiencies) {
            const pFacet = getFacetMeta(prof?.facet ?? prof?.tags?.facets?.[0] ?? null);
            const pSuit = prof?.suit !== undefined ? (SUIT_ID_BY_NAME[String(prof.suit)] ?? 0) : (pFacet?.Suit ?? 0);
            if (pSuit && cardSuitId && pSuit === cardSuitId) {
                total += 5;
                details.push(`Suited Proficiency (+5)`);
            } else if (pSuit && cardSuitId && suitColor(pSuit) === suitColor(cardSuitId)) {
                total += 2;
                details.push(`Same-Colour Unsuited Proficiency (+2)`);
            } else {
                total += 1;
                details.push(`Unsuited Proficiency (+1)`);
            }
        }
    }

    if (chiSpend > 0) {
        total += chiSpend;
        details.push(`Chi Spend (+${chiSpend})`);
    }
    if (stressGain > 0) {
        total += stressGain;
        details.push(`Stress Gained (+${stressGain})`);
    }
    if (strainGain > 0) {
        total += strainGain * 2;
        details.push(`Strain Gained (+${strainGain * 2})`);
    }
    if (shockGain > 0) {
        total += shockGain * 5;
        details.push(`Shock Gained (+${shockGain * 5})`);
    }

    const success = total > difficulty || total >= difficulty;
    const passed = total >= difficulty;
    if (passed) {
        successLevels += 1;
        if (difficulty > 0 && total >= difficulty * 2) successLevels += 1;
    } else {
        failureLevels += 1;
        if (difficulty > 0 && total < difficulty / 2) failureLevels += 1;
    }

    return {
        type: 'Card',
        facet: baseFacetMeta?.FacetName || facet,
        card,
        pips,
        facetDraw,
        total,
        difficulty,
        success: passed,
        successLevels,
        failureLevels,
        details
    };
}

/**
 * Resolves a rulebook-backed Value Test per docs/rules/Test-Value.md.
 */
export function resolveValueTest(params = {}) {
    const {
        facet = 'Zeal',
        opposedFacet = null,
        boon = 13,
        scaleModifier = 0,
        actorValues = null,
        actorValue = null,
        opponentValue = null,
        difficulty = 0,
        method = 'direct',
        geometry = null,
        rngInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))
    } = params;

    let resolvedActorValue;
    if (Array.isArray(actorValues) && actorValues.length > 0) {
        resolvedActorValue = actorValues.reduce((sum, v) => sum + (Number(v) || 0), 0);
    } else if (actorValue !== null && actorValue !== undefined) {
        resolvedActorValue = Number(actorValue) || 0;
    } else {
        resolvedActorValue = T13Boons.getBoonValue((Number(boon) || 0) + (Number(scaleModifier) || 0));
    }

    const targetValue = Number(opponentValue ?? difficulty ?? 0) || 0;
    const details = [];
    let successLevels = 0;
    let failureLevels = 0;

    // Non-opposed Facet comparison penalties (docs/rules/Test-Value.md)
    const chosenMeta = getFacetMeta(facet);
    const targetMeta = getFacetMeta(opposedFacet);
    if (chosenMeta && targetMeta && chosenMeta.AntiFacet !== targetMeta.FacetIndex) {
        if (suitColor(chosenMeta.Suit) !== suitColor(targetMeta.Suit)) {
            failureLevels += 1;
            details.push(`Different Suit Colour (${chosenMeta.FacetName} vs ${targetMeta.FacetName}, +1 FL)`);
        }
        if (chosenMeta.Yang === targetMeta.Yang) {
            failureLevels += 1;
            details.push(`Same Tao (${chosenMeta.Yang ? 'Yang vs Yang' : 'Yin vs Yin'}, +1 FL)`);
        }
    }

    const result = {
        type: 'Value',
        method,
        facet: chosenMeta?.FacetName || facet,
        actorValue: resolvedActorValue,
        difficulty: targetValue,
        success: false,
        successLevels,
        failureLevels,
        details
    };

    if (method === 'percentage') {
        const total = resolvedActorValue + targetValue;
        const chance = total <= 0 ? 0 : Math.round((resolvedActorValue / total) * 100);
        const roll = rngInt(1, 100);

        result.roll = roll;
        result.chance = chance;
        result.success = roll <= chance;

        if (roll >= 11 && roll < 100 && roll % 11 === 0) {
            if (result.success) result.successLevels++;
            else result.failureLevels++;
            result.details.push(`Rolled Doubles (${roll}, +1 ${result.success ? 'Success' : 'Failure'} Level)`);
        }

        if (result.success && chance > 0) {
            let mult = 2;
            while (roll <= chance / mult && mult <= 8) {
                result.successLevels++;
                result.details.push(`Under 1/${mult} of ${chance}% (+1 Success Level)`);
                mult++;
            }
        } else if (!result.success && chance > 0) {
            if (roll >= chance * 2) {
                result.failureLevels++;
                result.details.push(`Multiple of ${chance}% (+1 Failure Level)`);
            }
        }

        const crunch = numerologyCrunch(roll);
        const charGeo = geometry?.Geo?.Number ?? geometry?.Geo?.Geometry ?? geometry?.geometryNumber ?? null;
        if (charGeo && charGeo === crunch) {
            result.successLevels++;
            result.details.push(`Numerology Match (${crunch}, +1 Success Level)`);
        }
    } else {
        result.success = resolvedActorValue >= targetValue;
        if (result.success) {
            result.successLevels += 1 + Math.floor((resolvedActorValue - targetValue) / Math.max(1, targetValue || 10));
        } else {
            result.failureLevels += 1 + Math.floor((targetValue - resolvedActorValue) / Math.max(1, targetValue || 10));
        }
    }

    return result;
}
