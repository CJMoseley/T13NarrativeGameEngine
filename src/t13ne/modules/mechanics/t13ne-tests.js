import CodexLoader from "../codex/CodexLoader.js";
import Logger from "../../core/Logger.js";
import T13Dice from './t13ne-dice.js';
import T13NECardsAPI from "./t13ne-cards-api.js";
import T13NE_Facets from "./t13ne-facets.js";
import T13Boons from './t13ne-boon.js';
import T13NE_Sway from "./t13ne-sway.js";
import T13NE_Stress from "./t13ne-stress.js";
import T13NE_Resources from "./t13ne-resources.js";
import { getDifficultyModifiers } from './FacetRuleEffects.js';

/**
 * Module for handling T13NE Tests (Value, Card Draw, Dice).
 */
class T13NE_Tests {
    constructor() {
        this.successLevels = [];
        this.initialized = false;
        this.session = null;
    }

    /**
     * Binds or clears an authoritative T13Session so performTest routes through session commands.
     * @param {object|null} session
     */
    bindSession(session) {
        this.session = session || null;
    }

    /**
     * Initializes the Tests module.
     */
    async initialize() {
        if (this.initialized) return;
        try {
            this.successLevels = await CodexLoader.getData('successAndFailureLevels');
            this.initialized = true;
            Logger.message('T13NE_Tests: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_Tests: Initialization failed: ${error}`);
        }
    }

    /**
     * Helper to roll a dice string (e.g. "2d6+3").
     * @param {string} diceStr 
     * @returns {number}
     */
    rollDiceString(diceStr) {
        if (!diceStr) return 0;
        const match = diceStr.match(/(\d+)d(\d+)(?:([+-])(\d+))?/);
        if (match) {
            const num = parseInt(match[1], 10);
            const sides = parseInt(match[2], 10);
            const op = match[3] || '+';
            const mod = match[4] ? parseInt(match[4], 10) : 0;

            let total = 0;
            for (let i = 0; i < num; i++) {
                total += T13Dice.RNG(1, sides);
            }

            if (op === '+') total += mod;
            else total -= mod;

            return total;
        }
        return 0;
    }

    /**
     * Calculates Chi from a Score based on Tapestry settings (default Intrepid: Score / 2).
     * @param {number} score 
     * @param {string} [potency='Intrepid'] - 'Banal', 'Intrepid', 'Bold', 'Monstrous', 'Twisted'
     * @returns {number}
     */
    calculateChi(score, potency = 'Intrepid') {
        switch (potency) {
            case 'Banal':
                // Banal: Score is treated as Value, convert to Boon to get Chi.
                // "converting 66 points of Yin would generate 13 points of Chi"
                return this.getBoonFromValue(score);
            case 'Bold':
                // Bold: Score is equivalent to Chi (1:1)
                return score;
            case 'Monstrous':
                // Monstrous: Score is equivalent to Yarn
                return Number(T13Boons.getBoonValue(score));
            case 'Twisted':
                // Twisted: Score is equivalent to Twists 
                return Number(T13Boons.getBoonValue(T13Boons.getBoonValue(score)));
            case 'Intrepid':
            default:
                // Intrepid: Score is halved to create Chi
                return Math.floor(score / 2);
        }
    }

    /**
     * Helper to reverse Boon Value calculation (Value -> Boon).
     * Used for Banal potency conversion.
     * @param {number} score 
     * @returns {number}
     */
    getBoonFromValue(value) {
        if (value <= 0) return 0;
        let boon = 0;
        // Iteratively find the boon that produces this value (or close to it)
        // Optimization: Could use binary search or lookup table for speed
        while (T13Boons.getBoonValue(boon + 1) <= value) {
            boon++;
            if (boon > 200) break; // Safety break
        }
        return boon;
    }

    /**
     * Determines the difficulty Chi for a test.
     * @param {object} options 
     * @returns {Promise<number>} Difficulty in Chi.
     */
    async getDifficulty(options) {
        if (options.opponent) {
            const opponent = options.opponent;
            let annex = null;

            // Determine which Annex to roll for difficulty
            if (['Extra', 'Vex', 'Chorus', 'Cast'].includes(opponent.charType)) {
                annex = opponent.masterAnnex;
            } else {
                annex = opponent.personalityAnnex;
            }

            if (annex) {
                // Use Annex Boon to determine dice and roll
                const boon = annex.boon || 13; // Default to 13 if not set
                const diceStr = await T13Boons.getDiceForBoon(boon);
                const score = this.rollDiceString(diceStr);

                // Determine opponent potency from Tapestry if available
                let potency = 'Intrepid';
                if (options.tapestry) {
                    // Try to find the facet of the annex to determine potency
                    const facetName = annex.tags?.facets?.[0] || 'Awe';
                    const facetData = await options.tapestry.getFacetBoon(facetName);
                    if (facetData) {
                        potency = T13NE_Sway.getPotencyForBoon(facetData.Boon);
                    }
                }

                return this.calculateChi(score, potency);
            }
        }

        // If no opponent, use static difficulty (assumed to be in Chi)
        return options.difficulty || 0;
    }

    /**
     * Performs a test based on the specified type. If a T13Session is provided via
     * `options.session` or `this.session`, routes execution through `Test:Perform`.
     * @param {string} type - 'Value', 'Card', or 'Dice'.
     * @param {object} character - The character performing the test.
     * @param {object} [options={}] - Test options (difficulty, facet, etc.).
     * @returns {Promise<object>} The test result.
     */
    async performTest(type, character, options = {}) {
        if (options.difficultyEffects !== undefined && type.toLowerCase() !== 'dice') {
            throw new Error('Difficulty effects are currently supported only for Dice Tests.');
        }
        const activeSession = options.session || this.session;
        if (activeSession && typeof activeSession.dispatch === 'function' && options._fromSession !== true) {
            const cmdId = options.commandId || `test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
            const actorId = options.actorId || character?.ownerActorId || 'referee';
            const res = activeSession.dispatch({
                id: cmdId,
                sessionId: activeSession.sessionId,
                actorId,
                expectedRevision: options.expectedRevision,
                type: 'Test:Perform',
                payload: {
                    testType: type,
                    characterId: character?.id,
                    character,
                    options: { ...options, session: undefined, _fromSession: true }
                }
            });
            return res.ok ? res.result : res;
        }
        switch (type.toLowerCase()) {
            case 'value': return this.valueTest(character, options);
            case 'card': return this.cardTest(character, options);
            case 'dice': return this.diceTest(character, options);
            case 'ordeal': return this.ordealTest(character, options);
            default:
                Logger.warn(`T13NE_Tests: Unknown test type '${type}'.`);
                return null;
        }
    }

    /**
     * Performs a Value Test.
     * @param {object} character 
     * @param {object} options - { facet: string, difficulty: number, opponentValue: number, method: 'direct'|'percentage', actorValues?: number[] }
     */
    async valueTest(character, options = {}) {
        const facetName = options.facet || 'Awe';
        let actorValue = 0;

        if (Array.isArray(options.actorValues) && options.actorValues.length > 0) {
            actorValue = options.actorValues.reduce((sum, v) => sum + (Number(v) || 0), 0);
        } else if (options.actorValue !== undefined) {
            actorValue = Number(options.actorValue) || 0;
        } else if (character?.facetweb) {
            const facetData = await character.facetweb.getFacetBoon(facetName);
            if (facetData) actorValue = T13Boons.getBoonValue(facetData.Boon + (character.scaleModifier || 0));
        }

        const difficulty = options.opponentValue || options.difficulty || 0;
        const method = options.method || 'direct';

        let result = {
            type: 'Value',
            method: method,
            actorValue: actorValue,
            difficulty: difficulty,
            success: false,
            successLevels: 0,
            failureLevels: 0,
            details: []
        };

        if (method === 'percentage') {
            const total = actorValue + difficulty;
            const chance = total === 0 ? 0 : Math.round((actorValue / total) * 100);
            const roll = T13Dice.RNG(1, 100);

            result.roll = roll;
            result.chance = chance;
            result.success = roll <= chance;

            // Check for doubles (e.g., 11, 22)
            if (roll >= 11 && roll < 100 && roll % 11 === 0) {
                if (result.success) result.successLevels++;
                else result.failureLevels++;
                result.details.push('Rolled Doubles (+1 Level)');
            }

            // Multiples / Fractions of percentage target
            if (result.success && chance > 0) {
                let mult = 2;
                while (roll <= chance / mult && mult <= 8) {
                    result.successLevels++;
                    result.details.push(`Under 1/${mult} of ${chance}% (+1 Success Level)`);
                    mult++;
                }
            } else if (!result.success && chance > 0 && roll >= chance * 2) {
                result.failureLevels++;
                result.details.push(`Multiple of ${chance}% (+1 Failure Level)`);
            }

            // Numerology check (sum digits -> 1-13)
            const digits = roll.toString().split('').map(Number);
            let sum = digits.reduce((a, b) => a + b, 0);
            while (sum > 13) {
                sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
            }

            if (character?.geometry?.Geo && (character.geometry.Geo.Number === sum || character.geometry.Geo.Geometry === sum)) {
                result.successLevels++;
                result.details.push(`Numerology Match (${sum}) (+1 Success Level)`);
            }

        } else {
            // Direct comparison
            result.success = actorValue >= difficulty;
            if (result.success) {
                result.successLevels = 1 + Math.floor((actorValue - difficulty) / 10);
            } else {
                result.failureLevels = 1 + Math.floor((difficulty - actorValue) / 10);
            }
        }

        return result;
    }

    /**
     * Performs a Card Draw Test.
     * @param {object} character 
     * @param {object} options - { facet: string, difficulty: number }
     */
    async cardTest(character, options = {}) {
        const facetName = options.facet || 'Awe';
        const difficulty = options.difficulty || 10;

        // 1. Draw Card (or use supplied card)
        let card = options.card || null;
        if (!card) {
            if (!T13NECardsAPI.deck) await T13NECardsAPI.initialize();
            const cards = T13NECardsAPI.deck.draw(1);
            card = cards[0];
        }

        if (!card) return { error: 'No cards available' };

        let pips = parseInt(card.pips, 10) || 0;
        let total = pips;
        const details = [`Drawn ${card.name} (${pips})`];

        // 2. Add Facet Draw using T13Boons.getBoonDraw
        let facetDraw = 1;
        let facetObj = null;
        if (character?.facetweb) {
            const facetData = await character.facetweb.getFacetBoon(facetName);
            if (facetData) {
                facetDraw = typeof T13Boons.getBoonDraw === 'function'
                    ? T13Boons.getBoonDraw(facetData.Boon)
                    : Math.max(1, Math.floor(facetData.Boon / 4));
            }
            facetObj = typeof T13NE_Facets.getFacet === 'function' ? await T13NE_Facets.getFacet(facetName) : null;
        } else if (typeof T13NE_Facets.getFacet === 'function') {
            facetObj = await T13NE_Facets.getFacet(facetName);
        }
        total += facetDraw;
        details.push(`Facet Draw (+${facetDraw})`);

        let failureLevels = 0;

        // 3. Suit Modifiers
        if (facetObj) {
            const suitMap = { 'Diamonds': 1, 'Hearts': 2, 'Clubs': 3, 'Spades': 4, '1': 1, '2': 2, '3': 3, '4': 4 };
            const cardSuitVal = suitMap[String(card.suit)] || 0;

            if (cardSuitVal === 0 || cardSuitVal === facetObj.Suit) {
                total += 2;
                details.push('Trump Suit (+2)');
            }
            if (cardSuitVal !== 0) {
                const cardIsRed = cardSuitVal === 1 || cardSuitVal === 2;
                const facetIsRed = facetObj.Suit === 1 || facetObj.Suit === 2;
                if (cardIsRed !== facetIsRed) {
                    failureLevels++;
                    details.push('Opposite Colour Suit (+1 Failure Level)');
                }
            }
        }

        // 4. Calculate Success
        const success = total >= difficulty;
        let successLevels = success ? 1 : 0;
        if (!success) failureLevels += 1;

        if (success && difficulty > 0 && total >= difficulty * 2) successLevels++;
        if (!success && difficulty > 0 && total < difficulty / 2) failureLevels++;

        return {
            type: 'Card',
            card: card,
            total: total,
            difficulty: difficulty,
            success: success,
            successLevels: successLevels,
            failureLevels: failureLevels,
            details: details
        };
    }

    /**
     * Performs a Dice Test.
     * @param {object} character 
     * @param {object} options - { facet, difficulty, pool, proficiencies, descendant, annex, potency, difficultyEffects }
     */
    async diceTest(character, options) {
        const facetName = options.facet || 'Awe';
        const isPool = options.pool || false;
        const baseDifficulty = options.difficulty || 0;
        const tapestry = options.tapestry || (character.facetweb ? character.facetweb : null);

        // Determine Potency from Tapestry
        let potency = options.potency || 'Intrepid';
        if (tapestry && typeof tapestry.getFacetBoon === 'function') {
            const facetData = await tapestry.getFacetBoon(facetName);
            if (facetData) {
                potency = T13NE_Sway.getPotencyForBoon(facetData.Boon);
            }
        }

        // Calculate Target Difficulty
        let targetDifficulty = baseDifficulty;
        if (!isPool) {
            if (potency === 'Banal') targetDifficulty = T13Boons.getBoonValue(baseDifficulty);
            else if (potency === 'Intrepid') targetDifficulty = baseDifficulty * 2;
            else if (potency === 'Bold') targetDifficulty = baseDifficulty;
            // Monstrous/Twisted logic can be added if needed, usually lower
        }
        const difficultyModifiers = options.difficultyEffects === undefined
            ? null : getDifficultyModifiers(options.difficultyEffects);
        if (difficultyModifiers) targetDifficulty += difficultyModifiers.score;

        let diceResults = [];
        let details = [];
        let totalScore = 0;

        // 1. Get Facet Die
        let mainDieScore = 0;
        let mainDieStr = '1d6'; // Fallback

        if (options.annex) {
            const boon = options.annex.boon || 13;
            mainDieStr = await T13Boons.getDiceForBoon(boon);
        } else if (character.facetweb) {
            const facetData = await character.facetweb.getFacetBoon(facetName);
            if (facetData) {
                const boon = facetData.Boon + (character.scaleModifier || 0);
                mainDieStr = await T13Boons.getDiceForBoon(boon);
            }
        }

        mainDieScore = this.rollDiceString(mainDieStr);
        diceResults.push({ type: 'Main', score: mainDieScore, str: mainDieStr });
        details.push(`Main Die (${mainDieStr}): ${mainDieScore}`);

        // 2. Proficiency Dice
        let profCount = 0;
        if (Array.isArray(options.proficiencies)) profCount = options.proficiencies.length;
        else if (typeof options.proficiencies === 'number') profCount = options.proficiencies;

        let profScore = 0;
        let profDiceStr = '';
        let crisis = false;

        if (profCount === 0) {
            mainDieScore = Math.floor(mainDieScore / 2); // Halve main score
            details.push('No Proficiencies: Main Score Halved');
        } else if (profCount === 1) {
            // No modifier
        } else {
            let numDice = 0;
            if (profCount === 2) numDice = 1;
            else if (profCount === 3) numDice = 2;
            else if (profCount >= 4) numDice = 3;

            profDiceStr = `${numDice}d6`;

            // Roll individually to check for Crisis
            let ones = 0;
            let sixes = 0;
            for (let i = 0; i < numDice; i++) {
                const r = T13Dice.RNG(1, 6);
                profScore += r;
                if (r === 1) ones++;
                if (r === 6) sixes++;
            }

            if (numDice > 0) {
                if (ones === numDice) crisis = 'Snake Eyes';
                if (sixes === numDice) crisis = 'Boxcars';
                details.push(`Proficiency Dice (${profDiceStr}): ${profScore}`);
                diceResults.push({ type: 'Proficiency', score: profScore, str: profDiceStr });
            }
        }

        // 3. Descendant Dice
        let descScore = 0;
        if (options.descendant && options.descendant.masterAnnex) {
            const boon = options.descendant.masterAnnex.boon || 13;
            const descDieStr = await T13Boons.getDiceForBoon(boon);
            descScore = this.rollDiceString(descDieStr);
            diceResults.push({ type: 'Descendant', score: descScore, str: descDieStr });
            details.push(`Descendant Die (${descDieStr}): ${descScore}`);
        }

        // 4. Strain Dice (Stress)
        let strainScore = 0;
        if (options.strain && Array.isArray(options.strain)) {
            for (const s of options.strain) {
                // s: { dieId, amount, boon }
                const dieStr = await T13Boons.getDiceForBoon(s.boon);
                const roll = this.rollDiceString(dieStr);
                strainScore += roll;

                if (T13NE_Stress && typeof T13NE_Stress.resolveStrain === 'function') {
                    await T13NE_Stress.resolveStrain(character, s.dieId, s.amount, roll);
                }

                diceResults.push({ type: 'Strain', score: roll, str: dieStr });
                details.push(`Strain Die (${dieStr}): ${roll} (Spent ${s.amount} Stress)`);
            }
        }

        // 5. Extra Dice (Chi/Sway)
        let extraScore = 0;
        if (options.extraDice && Array.isArray(options.extraDice)) {
            for (const e of options.extraDice) {
                // e: { resource, cost, boon, type }
                let paid = false;
                if (T13NE_Resources && typeof T13NE_Resources.makePayment === 'function') {
                    paid = T13NE_Resources.makePayment(character, e.resource || 'Chi', e.cost);
                }

                if (paid) {
                    const dieStr = await T13Boons.getDiceForBoon(e.boon);
                    const roll = this.rollDiceString(dieStr);
                    extraScore += roll;

                    diceResults.push({ type: 'Extra', score: roll, str: dieStr });
                    details.push(`Extra Die (${dieStr}): ${roll} (Paid ${e.cost} ${e.resource || 'Chi'})`);
                } else {
                    details.push(`Failed to pay for Extra Die (${e.type || 'Unknown'})`);
                }
            }
        }

        // Calculate Result
        let success = false;
        let successLevels = 0;
        let failureLevels = 0;
        let resultType = '';

        if (isPool) {
            // Pool Logic: Each die vs Difficulty
            let passes = 0;
            let failures = 0;

            // Check Main
            if (mainDieScore >= targetDifficulty) passes++; else failures++;
            if (profCount >= 2 && profScore >= targetDifficulty) passes++; else if (profCount >= 2) failures++;
            if (options.descendant && descScore >= targetDifficulty) passes++; else if (options.descendant) failures++;

            diceResults.forEach(res => {
                if (res.type === 'Strain' || res.type === 'Extra') {
                    if (res.score >= targetDifficulty) passes++; else failures++;
                }
            });

            if (passes > 0) {
                success = true;
                successLevels = passes - 1;
                resultType = (successLevels >= 2) ? 'Superior Success' : (successLevels >= 1 ? 'Complete Success' : 'Moderate Success');
            } else {
                success = false;
                failureLevels = failures;
                resultType = (failureLevels >= 3) ? 'Serious Failure' : (failureLevels >= 2 ? 'Complete Failure' : 'Moderate Failure');
            }
        } else {
            // Single Roll Logic (sums Main, Proficiencies, Descendant, Strain, and Extra Dice)
            totalScore = mainDieScore + profScore + descScore + strainScore + extraScore;

            let baseLevel = 0;
            if (totalScore >= targetDifficulty) {
                success = true;
                if (targetDifficulty > 0 && totalScore >= targetDifficulty * 3) { baseLevel = 3; resultType = 'Superior Success'; }
                else if (targetDifficulty > 0 && totalScore >= targetDifficulty * 2) { baseLevel = 2; resultType = 'Complete Success'; }
                else if (totalScore === targetDifficulty) {
                    baseLevel = 1;
                    resultType = 'Borderline/Stalemate';
                    failureLevels++;
                } else {
                    baseLevel = 1;
                    resultType = 'Moderate Success';
                }
                successLevels += baseLevel;
            } else {
                success = false;
                if (totalScore < 0) { baseLevel = 3; resultType = 'Serious Failure'; }
                else if (targetDifficulty > 0 && totalScore < targetDifficulty / 2) { baseLevel = 2; resultType = 'Complete Failure'; }
                else { baseLevel = 1; resultType = 'Moderate Failure'; }
                failureLevels += baseLevel;
            }

            // Numerology Check (additive after base SL/FL calculation so it is preserved)
            if (character?.geometry?.Geo) {
                let sum = totalScore;
                while (sum > 13) {
                    sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
                }
                if (character.geometry.GeoHarmonics) {
                    if (character.geometry.GeoHarmonics.Perfect === sum) {
                        successLevels++;
                        details.push(`Numerology Critical (${sum})`);
                    } else if (character.geometry.GeoHarmonics.Nemesis === sum) {
                        failureLevels++;
                        details.push(`Numerology Fumble (${sum})`);
                    }
                }
            }

            // Apply Crisis Effects
            if (crisis) {
                details.push(`Crisis: ${crisis}`);
                if (success) {
                    if (crisis === 'Snake Eyes') {
                        resultType = 'Borderline/Stalemate';
                        success = true;
                    } else if (crisis === 'Boxcars') {
                        failureLevels += baseLevel || 1;
                        details.push('Reversal of Success (Added Failure Level)');
                    }
                } else {
                    if (crisis === 'Snake Eyes') {
                        successLevels += baseLevel || 1;
                        details.push('Reversal of Success (Added Success Level)');
                    } else if (crisis === 'Boxcars') {
                        resultType = 'Borderline/Stalemate';
                    }
                }
            }
        }

        return {
            type: 'Dice',
            isPool: isPool,
            score: totalScore,
            targetDifficulty: targetDifficulty,
            success: success,
            successLevels: successLevels,
            failureLevels: failureLevels,
            resultType: resultType,
            crisis: crisis,
            details: details,
            diceResults: diceResults,
            ...(difficultyModifiers ? { difficultyModifiers } : {})
        };
    }

    /**
     * Performs an Ordeal Test, adjusting difficulty based on Stakes.
     * @param {object} character 
     * @param {object} options - { facet: string, difficulty: number, stakes: string, method: 'dice'|'card' }
     */
    async ordealTest(character, options) {
        const baseDifficulty = options.difficulty || 10;
        const method = options.method || 'dice';

        const testOptions = { ...options, difficulty: baseDifficulty };

        if (method === 'card') {
            return this.cardTest(character, testOptions);
        } else {
            return this.diceTest(character, testOptions);
        }
    }

    /**
     * Checks for a Yarn Tangling Blitz condition (3 suited cards = 31 pips).
     * @param {Array} cards - Array of card objects.
     * @returns {boolean} True if a set of 3 cards sums to 31 and shares a suit.
     */
    yarnTangleCheck(cards) {
        if (!cards || cards.length < 3) return false;

        // Group by suit
        const suits = {};
        cards.forEach(card => {
            if (!suits[card.suit]) suits[card.suit] = [];
            suits[card.suit].push(card);
        });

        // Check each suit for a combination of 3 cards summing to 31
        for (const suit in suits) {
            const suitCards = suits[suit];
            if (suitCards.length >= 3) {
                // Simple check for any 3
                for (let i = 0; i < suitCards.length - 2; i++) {
                    for (let j = i + 1; j < suitCards.length - 1; j++) {
                        for (let k = j + 1; k < suitCards.length; k++) {
                            const p1 = parseInt(suitCards[i].pips) || 0;
                            const p2 = parseInt(suitCards[j].pips) || 0;
                            const p3 = parseInt(suitCards[k].pips) || 0;
                            if (p1 + p2 + p3 === 31) return true;
                        }
                    }
                }
            }
        }
        return false;
    }
}

export default new T13NE_Tests();




