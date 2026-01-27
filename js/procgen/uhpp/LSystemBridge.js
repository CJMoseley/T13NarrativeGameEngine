import LSystem from 'lindenmayer';

/**
 * @module UHPP/LSystemBridge
 * @description Phase B: Skeletonization. Generates a 3D path and pins tiles in the grid.
 */
export class LSystemBridge {
    constructor() {
    }

    /**
     * @param {object} context
     */
    async execute(context) {
        const {
            lsystemConfig = {
                axiom: 'F',
                productions: { 'F': 'F[+F]F[-F]F' },
                iterations: 2
            },
            gridDimensions = { x: 20, y: 20, z: 20 },
            pathTileID = 1 // Assuming 1 is the ID for "Path" tiles
        } = context;

        const ls = new LSystem({
            axiom: lsystemConfig.axiom,
            productions: lsystemConfig.productions
        });

        const expanded = ls.iterate(lsystemConfig.iterations);
        const points = this._turtle3D(expanded, gridDimensions);

        // Pin these points in the context
        if (!context.pinnedTiles) context.pinnedTiles = new Map();

        for (const p of points) {
            const key = `${p.x},${p.y},${p.z}`;
            context.pinnedTiles.set(key, pathTileID);
        }

        console.log(`LSystemBridge: Pinned ${points.length} coordinates as skeleton.`);
        return context;
    }

    /**
     * Simple 3D turtle to convert L-System string to grid coordinates.
     * @private
     */
    _turtle3D(lsString, bounds) {
        const points = [];
        const stack = [];
        let x = Math.floor(bounds.x / 2), y = 0, z = Math.floor(bounds.z / 2);
        let dx = 0, dy = 1, dz = 0; // Initial direction: up (+Y)

        // Simplified 3D rotation (just 90 deg steps for grid alignment)
        for (const char of lsString) {
            switch (char) {
                case 'F':
                    // Move forward and record point
                    points.push({ x, y, z });
                    x = Math.max(0, Math.min(bounds.x - 1, x + dx));
                    y = Math.max(0, Math.min(bounds.y - 1, y + dy));
                    z = Math.max(0, Math.min(bounds.z - 1, z + dz));
                    break;
                case '+': // Rotate around Z
                    [dx, dy] = [-dy, dx];
                    break;
                case '-': // Rotate around Z
                    [dx, dy] = [dy, -dx];
                    break;
                case '&': // Rotate around X
                    [dy, dz] = [-dz, dy];
                    break;
                case '^': // Rotate around X
                    [dy, dz] = [dz, -dy];
                    break;
                case '[':
                    stack.push({ x, y, z, dx, dy, dz });
                    break;
                case ']':
                    const state = stack.pop();
                    if (state) {
                        x = state.x; y = state.y; z = state.z;
                        dx = state.dx; dy = state.dy; dz = state.dz;
                    }
                    break;
            }
        }
        return points;
    }
}
