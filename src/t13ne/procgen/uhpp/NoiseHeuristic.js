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

        // Map macroValue (-1 to 1) to weights dynamically.
        // We look for 'noiseInfluence' rules in the tile definitions.
        context.weights = tileSet.weights.map((baseWeight, index) => {
            const tileData = tileSet.tiles[index];
            if (!tileData) return baseWeight;

            let multiplier = 1.0;

            // Handle tile-specific noise rules (generic)
            if (tileData.noiseInfluence) {
                const rules = Array.isArray(tileData.noiseInfluence) ? tileData.noiseInfluence : [tileData.noiseInfluence];
                for (const rule of rules) {
                    const min = rule.min ?? -1;
                    const max = rule.max ?? 1;
                    if (macroValue >= min && macroValue <= max) {
                        multiplier *= (rule.multiplier ?? 1.0);
                    }
                }
            }

            // Fallback for context-provided global mapping (allows editor-side overrides)
            if (context.noiseRules) {
                for (const rule of context.noiseRules) {
                    if (rule.tileType === tileData.type || rule.tileID === index) {
                        const min = rule.min ?? -1;
                        const max = rule.max ?? 1;
                        if (macroValue >= min && macroValue <= max) {
                            multiplier *= (rule.multiplier ?? 1.0);
                        }
                    }
                }
            }

            return baseWeight * multiplier;
        });

        console.log(`NoiseHeuristic: Macro weight adjusted (value: ${macroValue.toFixed(2)})`);
        return context;
    }
}
