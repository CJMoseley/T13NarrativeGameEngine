/**
 * Normalises an Ordeal Stage's Difficulty cards to a 0 to 1 ratio.
 * The rulebook fixes the card count and the Pips sum (docs/rules/Ordeal-Stages.md).
 * It does not define a ratio, so the normalisation below is a platform convention.
 * Pure, so it can be tested under Node.
 */
import { MIN_STAGE_CARDS, MAX_STAGE_CARDS, sumPips } from './t13ne-ordeal-rules.js';

/** Highest Pip value seen on a card in src/t13ne/data/cards/individual (observed range 2 to 15). */
export const MAX_CARD_PIPS = 15;

const clamp01 = v => Math.min(1, Math.max(0, v));

/**
 * @param {Array<{pips: (string|number)}>} cards Stage Difficulty cards (1 to 3).
 * @returns {number} Difficulty from 0 to 1, from the summed Pips against the largest possible total.
 * @throws {RangeError} If the card count is outside the rulebook range.
 */
export function stageDifficultyRatio(cards) {
    if (!Array.isArray(cards) || cards.length < MIN_STAGE_CARDS || cards.length > MAX_STAGE_CARDS) {
        throw new RangeError(`A Stage needs ${MIN_STAGE_CARDS} to ${MAX_STAGE_CARDS} difficulty cards`);
    }
    return clamp01(sumPips(cards) / (MAX_STAGE_CARDS * MAX_CARD_PIPS));
}
