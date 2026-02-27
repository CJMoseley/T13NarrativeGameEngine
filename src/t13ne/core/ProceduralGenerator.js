import Logger from './Logger.js';

/**
 * ProceduralGenerator
 * Provides a collection of algorithms for procedural content generation.
 */
export class ProceduralGenerator {
    /**
     * Generates a structure using an L-system.
     * @param {string} axiom - The starting string.
     * @param {object} rules - Map of character -> replacement string.
     * @param {number} iterations - Number of times to apply the rules.
     * @returns {string} The resulting L-system string.
     */
    static generateLSystem(axiom, rules, iterations) {
        let result = axiom;
        for (let i = 0; i < iterations; i++) {
            let nextResult = '';
            for (let char of result) {
                nextResult += rules[char] || char;
            }
            result = nextResult;
        }
        return result;
    }

    /**
     * Wave Function Collapse (Simplified 2D)
     * Reduces entropy of a grid based on tile adjacency constraints.
     */
    static wfc(width, height, tiles, constraints) {
        Logger.message("ProceduralGenerator: Wave Function Collapse starting...");

        // Initialize grid with all possibilities
        let grid = Array(width * height).fill(null).map(() => tiles.map(t => t.id));

        const isCollapsed = (cell) => cell.length === 1;
        const getEntropy = (cell) => cell.length;

        // Simple collapse step
        let iterations = 0;
        const maxIterations = width * height;

        while (iterations < maxIterations) {
            // Find cell with lowest entropy (that isn't collapsed)
            let minEntropy = Infinity;
            let targetIdx = -1;

            for (let i = 0; i < grid.length; i++) {
                const e = getEntropy(grid[i]);
                if (e > 1 && e < minEntropy) {
                    minEntropy = e;
                    targetIdx = i;
                }
            }

            if (targetIdx === -1) break; // All collapsed

            // Collapse target cell
            const possibilities = grid[targetIdx];
            grid[targetIdx] = [possibilities[Math.floor(Math.random() * possibilities.length)]];

            // Propagate constraints (placeholder for actual propagation logic)
            // ... logic to reduce possibilities in neighbors ...

            iterations++;
        }

        Logger.message(`ProceduralGenerator: WFC complete after ${iterations} iterations.`);
        return grid.map(cell => cell[0]); // Return first possibility
    }

    /**
     * Generates Perlin Noise.
     * (Using a simple implementation or library integration)
     */
    static perlin(x, y, z = 0) {
        // Placeholder for multi-dimensional Perlin noise
        // Use a simple hash for deterministic result if no better generator available
        const hash = (x * 12345 + y * 67890 + z * 13579);
        return (Math.abs(Math.sin(hash)) % 1);
    }

    /**
     * Random Walk for Dungeon/Map generation.
     */
    static randomWalk(steps, startPos = { x: 0, y: 0 }, seed = 'walk') {
        let current = { ...startPos };
        const path = [current];

        let state = 0;
        const seedStr = String(seed);
        for (let i = 0; i < seedStr.length; i++) state = (Math.imul(31, state) + seedStr.charCodeAt(i)) | 0;

        for (let i = 0; i < steps; i++) {
            state = Math.sin(state++) * 10000;
            const rand = state - Math.floor(state);
            const dir = Math.floor(rand * 4);

            if (dir === 0) current.y += 1;
            else if (dir === 1) current.y -= 1;
            else if (dir === 2) current.x += 1;
            else current.x -= 1;
            path.push({ ...current });
        }
        return path;
    }
}
