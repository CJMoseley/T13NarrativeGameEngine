import WFC from '../../utils/ndwfc.js';

/**
 * @module UHPP/WFCWorker
 * @description Phase C: Assembly (Worker). Runs the N-Dimensional WFC solver.
 */

self.onmessage = async function(e) {
    const {
        weights,
        rules,
        nd,
        gridDimensions,
        pinnedTiles,
        sharedBuffer
    } = e.data;

    const grid = new Uint8Array(sharedBuffer);

    // Convert pinnedTiles (Map/Object) to initial wave state
    const initialWave = {};
    for (const [key, tileID] of Object.entries(pinnedTiles)) {
        initialWave[key] = tileID;

        // Also update shared buffer for initial state
        const [x, y, z] = key.split(',').map(Number);
        const idx = x + y * gridDimensions.x + z * gridDimensions.x * gridDimensions.y;
        grid[idx] = tileID + 1; // +1 because 0 usually means uncollapsed/void
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
    const maxIterations = gridDimensions.x * gridDimensions.y * gridDimensions.z * 2;

    while (iterations < maxIterations) {
        const done = wfc.step();

        // After each step, we can update the shared buffer for real-time visualization.
        // ndwfc stores collapsed tiles in its internal 'wave' state after they are fully resolved.
        const state = wfc.readout();

        for (const [key, value] of Object.entries(state)) {
            if (typeof value === 'number') {
                const [x, y, z] = key.split(',').map(Number);
                const idx = x + (y || 0) * gridDimensions.x + (z || 0) * gridDimensions.x * gridDimensions.y;
                grid[idx] = value + 1;
            }
        }

        if (done) break;
        iterations++;

        // Small yield to allow main thread to see updates if not using SAB properly,
        // but with SAB it's immediate.
        if (iterations % 100 === 0) {
            self.postMessage({ type: 'progress', iterations });
        }
    }

    self.postMessage({ type: 'complete', state: wfc.readout() });
};
