import { createNoise3D } from 'simplex-noise';

/**
 * @module UHPP/NoiseHeuristic
 * @description Phase A: Macro-Weighting. Generates a noise field to influence tile weights.
 */
export class NoiseHeuristic {
    constructor(seed = Math.random()) {
        // simplex-noise 4.x expects a function that returns 0-1
        const prng = () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };
        this.noise3D = createNoise3D(prng);
    }

    /**
     * @param {object} context
     */
    async execute(context) {
        const { tileSet, noiseScale = 0.05 } = context;
        if (!tileSet || !tileSet.weights) {
            console.warn("NoiseHeuristic: No tileSet or weights found in context.");
            return context;
        }

        // Generate macro weighting.
        // We use a low-frequency noise to decide the "theme" or overall weights.
        const nx = (context.gridDimensions?.x || 10) / 2;
        const ny = (context.gridDimensions?.y || 10) / 2;
        const nz = (context.gridDimensions?.z || 10) / 2;

        const macroValue = this.noise3D(nx * noiseScale, ny * noiseScale, nz * noiseScale);

        // Map macroValue (-1 to 1) to weights.
        // For example, high noise increases weight of "complex" or "peak" tiles.
        context.weights = tileSet.weights.map((baseWeight, index) => {
            const tileType = tileSet.tileTypes ? tileSet.tileTypes[index] : 'Default';

            if (macroValue > 0.8 && tileType === 'Peak') {
                return baseWeight * 5;
            }
            if (macroValue < -0.8 && tileType === 'Void') {
                return baseWeight * 10;
            }

            return baseWeight;
        });

        console.log(`NoiseHeuristic: Macro weight adjusted (value: ${macroValue.toFixed(2)})`);
        return context;
    }
}
