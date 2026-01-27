/**
 * @module UHPP/CellularAutomata
 * @description Phase D: Iterative Simulation. Applies CA rules to the WFC grid.
 */
export class CellularAutomata {
    constructor(rules = []) {
        this.rules = rules; // Array of { if: tileID, neighbor: tileID, then: tileID }
    }

    /**
     * @param {object} context
     */
    async execute(context) {
        const {
            grid,
            gridDimensions,
            pinnedTiles = new Map(),
            caIterations = 3
        } = context;

        if (!grid) return context;

        let currentGrid = new Uint8Array(grid);
        const { x: X, y: Y, z: Z } = gridDimensions;

        for (let iter = 0; iter < caIterations; iter++) {
            const nextGrid = new Uint8Array(currentGrid);

            for (let z = 0; z < Z; z++) {
                for (let y = 0; y < Y; y++) {
                    for (let x = 0; x < X; x++) {
                        const idx = x + y * X + z * X * Y;

                        // Constraint: Never change pinned tiles
                        if (pinnedTiles.has(`${x},${y},${z}`)) continue;

                        const currentTile = currentGrid[idx] - 1; // -1 because grid stores ID+1
                        if (currentTile < 0) continue;

                        // Apply rules
                        for (const rule of this.rules) {
                            if (currentTile === rule.if) {
                                if (this._hasNeighbor(currentGrid, x, y, z, gridDimensions, rule.neighbor)) {
                                    nextGrid[idx] = rule.then + 1;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            currentGrid.set(nextGrid);
        }

        // Update context grid
        grid.set(currentGrid);
        console.log(`CellularAutomata: Simulated ${caIterations} iterations.`);
        return context;
    }

    /**
     * @private
     */
    _hasNeighbor(grid, x, y, z, dims, neighborID) {
        const { x: X, y: Y, z: Z } = dims;
        for (let dz = -1; dz <= 1; dz++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue;

                    const nx = x + dx;
                    const ny = y + dy;
                    const nz = z + dz;

                    if (nx >= 0 && nx < X && ny >= 0 && ny < Y && nz >= 0 && nz < Z) {
                        const nidx = nx + ny * X + nz * X * Y;
                        if (grid[nidx] - 1 === neighborID) return true;
                    }
                }
            }
        }
        return false;
    }
}
