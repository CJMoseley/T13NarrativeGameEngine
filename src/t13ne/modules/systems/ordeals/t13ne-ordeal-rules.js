/**
 * Pure Ordeal rules taken from the T13 rulebook (docs/rules/).
 * This module has no imports so it can run in the browser and under Node tests.
 */

/** Stage Difficulty is expressed by 1 to 3 cards (docs/rules/Ordeal-Stages.md). */
export const MIN_STAGE_CARDS = 1;
export const MAX_STAGE_CARDS = 3;

/** An Obstacle's Difficulty is given by 1 or 2 cards after its type card (docs/rules/Ordeal-Rounds.md). */
export const MIN_OBSTACLE_DIFFICULTY_CARDS = 1;
export const MAX_OBSTACLE_DIFFICULTY_CARDS = 2;

/**
 * Obstacle type by card suit (Card Suit Correspondences, docs/rules/Ordeals.md).
 * Card data stores suits as "1" to "4" (Diamonds, Hearts, Clubs, Spades). Names and symbols are also accepted.
 */
const SUIT_THEMES = {
    '1': 'Travel', Diamonds: 'Travel', '♦': 'Travel',
    '2': 'Relationships', Hearts: 'Relationships', '♥': 'Relationships',
    '3': 'Power', Clubs: 'Power', '♣': 'Power',
    '4': 'Conflict', Spades: 'Conflict', '♠': 'Conflict'
};

/**
 * @param {string|number} suit
 * @returns {string} The rulebook theme for the suit, or 'Unknown'.
 */
export function suitTheme(suit) {
    return SUIT_THEMES[String(suit)] || 'Unknown';
}

/**
 * @param {Array<{pips: (string|number)}>} cards
 * @returns {number} The sum of the cards' Pips.
 */
export function sumPips(cards) {
    return cards.reduce((sum, card) => sum + (parseInt(card.pips) || 0), 0);
}

/**
 * Finds a stake record by its level name (the `Type` field in stakes.json).
 * @param {Array<object>} stakesData
 * @param {string} name
 * @returns {object|null}
 */
export function findStake(stakesData, name) {
    if (!Array.isArray(stakesData) || name == null) return null;
    const wanted = String(name).toLowerCase();
    return stakesData.find(s => [s.Type, s.Level, s.Name].some(v => v && String(v).toLowerCase() === wanted)) || null;
}

/**
 * Reads the Round Wild Pool size from a stake record, e.g. "2 Cards" -> 2 (docs/rules/Stakes.md).
 * @param {object|null} stake
 * @returns {number} The pool size, or 0 if it cannot be read.
 */
export function wildPoolSize(stake) {
    return stake ? (parseInt(stake.Round_Wild_Pool) || 0) : 0;
}
