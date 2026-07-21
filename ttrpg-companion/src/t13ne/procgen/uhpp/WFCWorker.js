import workerpool from 'workerpool';
import WFC from '../../utils/ndwfc.js';
import { tileToGrid } from './Aliases.js';

/**
 * @module UHPP/WFCWorker
 * @description Phase C: Assembly (Worker). Runs the N-Dimensional WFC solver.
 */

async function solve(data) {
    const {
        weights,
        rules,
        nd,
        gridDimensions,
        pinnedTiles,
        sharedBuffer
    } = data;

    const grid = new Uint8Array(sharedBuffer);

    // Convert pinnedTiles (Map/Object) to initial wave state
    const initialWave = {};
    let pinnedCount = 0;
    for (const [key, tileID] of Object.entries(pinnedTiles)) {
        initialWave[key] = tileID;
        pinnedCount++;

        // Also update shared buffer for initial state
        const [x, y, z] = key.split(',').map(Number);
        const idx = x + y * gridDimensions.x + z * gridDimensions.x * gridDimensions.y;
        grid[idx] = tileToGrid(tileID);
    }

    const wfc = new WFC({
        nd,
        weights,
        rules,
        wave: initialWave
    });

    // Define ROI
    wfc.expand(
        new Array(nd).fill(0),
        [gridDimensions.x, gridDimensions.y, gridDimensions.z].slice(0, nd)
    );

    let iterations = 0;
    const totalCells = gridDimensions.x * gridDimensions.y * gridDimensions.z;
    const cellsToCollapse = totalCells - pinnedCount;

    const maxIterations = cellsToCollapse;

    while (iterations < maxIterations) {
        const done = wfc.step();

        const state = wfc.readout();

        for (const [key, value] of Object.entries(state)) {
            if (typeof value === 'number') {
                const [x, y, z] = key.split(',').map(Number);
                const idx = x + (y || 0) * gridDimensions.x + (z || 0) * gridDimensions.x * gridDimensions.y;
                grid[idx] = tileToGrid(value);
            }
        }

        if (done) break;
        iterations++;
    }

    return { state: wfc.readout() };
}

// create a worker and register public functions
workerpool.worker({
    solve: solve
});
