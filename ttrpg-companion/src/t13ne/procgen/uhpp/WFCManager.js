/**
 * @module UHPP/WFCManager
 * @description Phase C: Assembly (Manager). Orchestrates the WFC solver worker.
 */
export class WFCManager {
    constructor() {
        this.worker = null;
    }

    /**
     * @param {object} context
     */
    async execute(context) {
        const {
            gridDimensions = { x: 10, y: 10, z: 10 },
            weights,
            rules,
            pinnedTiles = {}
        } = context;

        // Initialize SharedArrayBuffer for real-time visualization
        const size = gridDimensions.x * gridDimensions.y * gridDimensions.z;
        const sharedBuffer = new SharedArrayBuffer(size);
        context.sharedBuffer = sharedBuffer;
        context.grid = new Uint8Array(sharedBuffer);

        return new Promise((resolve, reject) => {
            // Create worker using a blob or a direct URL.
            // In Vite, we use new URL(...)
            this.worker = new Worker(new URL('./WFCWorker.js', import.meta.url), { type: 'module' });

            this.worker.onmessage = (e) => {
                const { type, state, iterations } = e.data;
                if (type === 'progress') {
                    // Could emit event for UI
                } else if (type === 'complete') {
                    context.collapsedState = state;
                    this.worker.terminate();
                    console.log("WFCManager: Assembly complete.");
                    resolve(context);
                }
            };

            this.worker.onerror = (err) => {
                this.worker.terminate();
                reject(err);
            };

            // Pass pinnedTiles as a plain object for serialization
            const pinnedObj = pinnedTiles instanceof Map ? Object.fromEntries(pinnedTiles) : pinnedTiles;

            this.worker.postMessage({
                weights,
                rules,
                nd: 3,
                gridDimensions,
                pinnedTiles: pinnedObj,
                sharedBuffer
            });
        });
    }
}
