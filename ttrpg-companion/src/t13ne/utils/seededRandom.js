/**
 * Creates a seeded pseudo-random number generator function using a Linear Congruential Generator (LCG).
 * This generator produces a sequence of pseudo-randomized numbers based on an initial seed.
 *
 * @param {number} seed - The initial seed for the random number generator.
 * @returns {function(): number} A function that, when called, returns the next pseudo-random number
 *                               in the sequence, normalized to the range [0, 1).
 */
export function createSeededRandom(seed) {
    // LCG parameters: m (modulus), a (multiplier), c (increment - often 0 for simplicity)
    // Using common parameters for a simple LCG: m = 2^31 - 1 (a large prime), a = 16807.
    let s = seed % 2147483647; // Ensure seed is within a valid range for the LCG modulus.
    if (s <= 0) s += 2147483646; // Handle non-positive seeds by adjusting them.

    return function() {
        s = (s * 16807) % 2147483647; // Calculate the next state.
        return (s - 1) / 2147483646; // Normalize the result to [0, 1).
    };
}