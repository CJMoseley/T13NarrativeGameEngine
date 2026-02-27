/**
 * T13 Gematria Utilities
 * Provides pure functions for calculating Gematria values, centralizing the logic
 * to be used by T13Name, T13Geometry, and other modules without code duplication
 * or circular dependencies.
 */

// Standard T13 Gematria Table, hardcoded for performance and stability.
const GEMATRIA_VALUES = {
    'a': 1, 'j': 1, 'q': 1, 'y': 1, 'i': 1,
    'b': 2, 'k': 2, 'r': 2, 'c': 2,
    'g': 3, 'l': 3,
    'd': 4, 'm': 4, 't': 4,
    'e': 5, 'n': 5,
    's': 6, 'u': 6, 'v': 6, 'w': 6, 'x': 6,
    'o': 7, 'z': 7,
    'f': 8, 'h': 8, 'p': 8
};

/**
 * Crunches a number down to a value between 1 and 13.
 * @param {number} num The number to crunch.
 * @returns {number} The crunched number.
 */
export function crunch(num) {
    while (num > 13) {
        num = String(num).split('').reduce((a, b) => a + parseInt(b, 10), 0);
    }
    return num;
}

/**
 * Calculates the Gematria value of a string.
 * @param {string} str The string to calculate.
 * @returns {number} The crunched number (1-13).
 */
export function calculateValue(str) {
    if (!str) return 0;
    const cleanStr = str.toLowerCase().replace(/[^a-z]/g, '');
    let sum = 0;
    for (let i = 0; i < cleanStr.length; i++) {
        sum += GEMATRIA_VALUES[cleanStr[i]] || 0;
    }
    return crunch(sum);
}