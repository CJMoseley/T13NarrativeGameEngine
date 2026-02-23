import { createNoise2D } from 'simplex-noise';
import PRNG from '../modules/systems/t13ne-prng.js';

const noise2D = createNoise2D();

/**
 * ProcGen
 * Central utility for procedural generation algorithms and PRNG management.
 */
export class ProcGen {
    /**
     * Generates a 2D Simplex noise value.
     * @param {number} x 
     * @param {number} y 
     * @returns {number} Value between -1 and 1.
     */
    static simplex2D(x, y) {
        return noise2D(x, y);
    }

    /**
     * Mock for multi-dimensional noise.
     */
    static noise12D(x, y) {
        return noise2D(x, y);
    }

    /**
     * Creates a high-quality 64-bit seedable PRNG.
     * @param {string|number} seed 
     * @returns {object} PRNG instance.
     */
    static createPRNG(seed) {
        return PRNG.create(seed);
    }

    /**
     * Creates a fast 32-bit seedable PRNG (Mulberry32).
     * @param {string|number} seed 
     * @returns {object} PRNG instance.
     */
    static create32PRNG(seed) {
        return PRNG.create32(seed);
    }

    /**
     * Synchronizes procedural systems.
     */
    static sync() {
        // Placeholder for system-wide sync logic
    }
}

export default ProcGen;
