/**
 * WorkerPool.js
 * Manages a pool of Web Workers using the 'workerpool' library.
 * This provides a unified interface for all background processing.
 */
import workerpool from 'workerpool';
import Logger from './Logger.js';
import { EventBus } from './EventBus.js';

export class WorkerPool {
    /**
     * @param {string} poolId - Unique identifier for this pool
     * @param {string|URL} workerScript - The path or URL to the worker script.
     * @param {number} poolSize - Number of workers to spawn
     * @param {object} options - Worker constructor options
     */
    constructor(poolId, workerScript, poolSize = 1, options = {}) {
        this.poolId = poolId;
        this.poolSize = poolSize;

        const scriptPath = (typeof workerScript === 'object' && workerScript.href) ? workerScript.href : workerScript;
        Logger.message(`[WorkerPool:${this.poolId}] Initializing with script: ${scriptPath}`);

        const poolOptions = {
            minWorkers: poolSize,
            maxWorkers: poolSize,
            workerType: 'web',
            workerOpts: { type: 'module' },
            ...options
        };

        this.pool = workerpool.pool(scriptPath, poolOptions);

        this.completedResults = new Map();
    }

    /**
     * Executes a task on the pool.
     */
    async execute(type, data, transferables = []) {
        const requestId = (performance.now() + (data?.seed || 0)).toString(36).replace('.', '');
        Logger.message(`[WorkerPool:${this.poolId}] Executing task '${type}' with requestId ${requestId}.`);

        try {
            // Using workerpool's exec method
            // If transferables are provided, wrap the data in workerpool.Transfer
            const args = (transferables && transferables.length > 0)
                ? [new workerpool.Transfer(data, transferables)]
                : [data];

            const result = await this.pool.exec(type, args, {
                on: (payload) => {
                    Logger.message(`[WorkerPool:${this.poolId}] Progress for '${type}':`, payload);
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
            Logger.error(`[WorkerPool:${this.poolId}] Task '${type}' (requestId: ${requestId}) execution failed:`, error);
            EventBus.emit(`worker:${this.poolId}:error`, { requestId, error, type });
            throw error;
        }
    }

    /**
     * Legacy broadcast support - runs on all workers (best effort)
     */
    async broadcast(type, data) {
        Logger.message(`[WorkerPool:${this.poolId}] Broadcasting task '${type}'.`);
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
