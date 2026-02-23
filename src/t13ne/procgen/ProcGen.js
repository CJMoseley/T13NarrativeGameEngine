import { createNoise2D, createNoise3D } from 'simplex-noise';
import PRNG from '../modules/systems/t13ne-prng.js';

const noise2D = createNoise2D();
const noise3D = createNoise3D();

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
     * Generates a 3D Simplex noise value.
     * @param {number} x 
     * @param {number} y 
     * @param {number} z
     * @returns {number} Value between -1 and 1.
     */
    static simplex3D(x, y, z) {
        return noise3D(x, y, z);
    }

    /**
     * Generates Fractional Brownian Motion (FBM) in 3D.
     */
    static fbm3D(x, y, z, octaves = 4, lacunarity = 2.0, gain = 0.5) {
        let total = 0;
        let frequency = 1.0;
        let amplitude = 1.0;
        let maxValue = 0;  // Used for normalizing result to -1.0 to 1.0

        for (let i = 0; i < octaves; i++) {
            total += noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }

        return total / maxValue;
    }

    /**
     * Simplified Worley (Cellular) noise in 3D for craters and cells
     * Not a true worley implementation but approximations based on simplex.
     * @returns {number} Value between 0 and 1
     */
    static worley3D(x, y, z) {
        // A simple fake-worley using absolute simplex values
        let n = noise3D(x, y, z);
        let n2 = noise3D(x + 10, y + 10, z + 10);
        return 1.0 - Math.sqrt(Math.abs(n * n2));
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
