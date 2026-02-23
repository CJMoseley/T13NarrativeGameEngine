/**
 * WorkerPool.js
 * Manages a pool of Web Workers using the 'workerpool' library.
 * This provides a unified interface for all background processing.
 */
import workerpool from 'workerpool';
import { EventBus } from './EventBus.js';

export class WorkerPool {
    /**
     * @param {string} poolId - Unique identifier for this pool
     * @param {string|URL} workerUrl - URL to the worker script
     * @param {number} poolSize - Number of workers to spawn
     * @param {object} options - Worker constructor options
     */
    constructor(poolId, workerUrl, poolSize = 1, options = { type: 'module' }) {
        this.poolId = poolId;
        this.workerUrl = workerUrl;
        this.poolSize = poolSize;
        this.options = options;

        // Initialize workerpool
        // Note: For ESM workers in Vite, we often need to use the worker script directly.
        this.pool = workerpool.pool(this.workerUrl, {
            minWorkers: 1,
            maxWorkers: poolSize,
            workerType: 'web',
            ...options
        });

        this.completedResults = new Map();
    }

    /**
     * Executes a task on the pool.
     */
    async execute(type, data, transferables = []) {
        const requestId = Math.random().toString(36).substring(7);

        try {
            // Using workerpool's exec method
            // If transferables are provided, wrap the data in workerpool.Transfer
            const args = (transferables && transferables.length > 0)
                ? [new workerpool.Transfer(data, transferables)]
                : [data];

            const result = await this.pool.exec(type, args, {
                on: (payload) => {
                    // Optional: handle progress or intermediate messages
                }
            });

            // Compatibility with legacy event-based system
            // Handle both object results and primitive results gracefully
            const response = (typeof result === 'object' && result !== null)
                ? (Array.isArray(result) ? { result, requestId, type } : { ...result, requestId, type })
                : { result, requestId, type };

            this.completedResults.set(requestId, response);

            EventBus.emit(`worker:${this.poolId}:completed`, response);
            EventBus.emit(`worker:${this.poolId}:completed:${requestId}`, response);

            return response;
        } catch (error) {
            console.error(`WorkerPool: Pool ${this.poolId} execution failed:`, error);
            EventBus.emit(`worker:${this.poolId}:error`, { requestId, error, type });
            throw error;
        }
    }

    /**
     * Legacy broadcast support - runs on all workers (best effort)
     */
    async broadcast(type, data) {
        const promises = [];
        // Note: workerpool doesn't have a native 'broadcast' to all active workers.
        // We simulate it by submitting N tasks.
        for (let i = 0; i < this.poolSize; i++) {
            promises.push(this.pool.exec(type, [data]));
        }
        return Promise.all(promises);
    }

    /**
     * Polls for a result by requestId.
     */
    poll(requestId) {
        if (this.completedResults.has(requestId)) {
            const result = this.completedResults.get(requestId);
            this.completedResults.delete(requestId);
            return result;
        }
        return null;
    }

    /**
     * Shuts down the pool.
     */
    terminate() {
        this.pool.terminate();
    }
}
