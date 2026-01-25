import { createSeededRandom } from './seededRandom.js';

/**
 * Manages the generation of procedural noise for various game elements.
 * This class provides a seeded random number generator, which is fundamental
 * for creating reproducible and consistent noise patterns (e.g., for terrain,
 * galaxy generation, or other procedural content).
 */
export class NoiseGenerator {
    /**
     * @param {number} seed - The seed to initialize the noise generator.
     *                        Using the same seed will produce the same sequence of noise.
     */
    constructor(seed) {
        this.seed = seed;
        // Initialize a seeded random number generator instance for this NoiseGenerator.
        // The error "constseededRandom is not defined" was caused by a typo and a missing import.
        this.random = createSeededRandom(seed);
    }
}