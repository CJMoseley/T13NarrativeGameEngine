/**
 * WorkerPool.js
 * Manages a pool of Web Workers for parallel processing and task queueing.
 */
import { EventBus } from './EventBus.js';

export class WorkerPool {
    /**
     * @param {string} poolId - Unique identifier for this pool (used in EventBus)
     * @param {string|URL} workerUrl - URL to the worker script
     * @param {number} poolSize - Number of workers to spawn
     * @param {object} options - Worker constructor options (e.g. { type: 'module' })
     */
    constructor(poolId, workerUrl, poolSize = 1, options = { type: 'module' }) {
        this.poolId = poolId;
        this.workerUrl = workerUrl;
        this.poolSize = poolSize;
        this.options = options;
        this.workers = [];
        this.queue = [];
        this.pendingRequests = new Map();
        this.completedResults = new Map(); // For "polling"
        this.initialized = false;
        this._initPromise = null;
    }

    /**
     * Spawns workers and waits for them to be ready.
     */
    async init() {
        if (this.initialized) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            for (let i = 0; i < this.poolSize; i++) {
                const worker = new Worker(this.workerUrl, this.options);
                const workerContext = {
                    instance: worker,
                    busy: false,
                    currentRequestId: null,
                    ready: true // Assume ready unless we add a handshake
                };

                worker.onmessage = (e) => this._handleMessage(workerContext, e.data);
                worker.onerror = (e) => this._handleError(workerContext, e);

                this.workers.push(workerContext);
            }
            this.initialized = true;
            this._initPromise = null;
        })();

        return this._initPromise;
    }

    /**
     * Sends a message to ALL workers in the pool (e.g. for initialization/data syncing).
     */
    async broadcast(type, data) {
        await this.init();
        const promises = this.workers.map(worker => {
            const requestId = 'broadcast_' + Math.random().toString(36).substring(7);
            return new Promise((resolve, reject) => {
                this.pendingRequests.set(requestId, { resolve, reject, worker });
                worker.instance.postMessage({ type, data, requestId });
            });
        });
        return Promise.all(promises);
    }

    /**
     * Executes a task on the next available worker.
     */
    async execute(type, data, transferables = []) {
        await this.init();
        const requestId = Math.random().toString(36).substring(7);

        return new Promise((resolve, reject) => {
            const task = { type, data, transferables, requestId, resolve, reject };
            this.queue.push(task);
            this._processQueue();
        });
    }

    _processQueue() {
        if (this.queue.length === 0) return;

        // Find an idle worker
        const availableWorker = this.workers.find(w => !w.busy && w.ready);
        if (!availableWorker) return;

        const task = this.queue.shift();
        availableWorker.busy = true;
        availableWorker.currentRequestId = task.requestId;

        this.pendingRequests.set(task.requestId, {
            resolve: task.resolve,
            reject: task.reject,
            worker: availableWorker
        });

        availableWorker.instance.postMessage({
            type: task.type,
            data: task.data,
            requestId: task.requestId
        }, task.transferables);
    }

    _handleMessage(workerContext, response) {
        if (!response) return;
        const { requestId, error, type } = response;

        // Handle potential responses that don't match a request (rare if protocol is followed)
        if (!requestId) return;

        const pending = this.pendingRequests.get(requestId);

        if (error) {
            const errObj = (typeof error === 'string') ? new Error(error) : error;
            if (pending) pending.reject(errObj);
            EventBus.emit(`worker:${this.poolId}:error`, { requestId, error: error.message || error, type });
        } else {
            // Store result for polling
            this.completedResults.set(requestId, response);

            if (pending) pending.resolve(response);

            // Emit completion event
            EventBus.emit(`worker:${this.poolId}:completed`, response);
            EventBus.emit(`worker:${this.poolId}:completed:${requestId}`, response);
        }

        if (pending) {
            this.pendingRequests.delete(requestId);
            workerContext.busy = false;
            workerContext.currentRequestId = null;

            // Trigger next task in queue
            this._processQueue();
        }
    }

    /**
     * Polls for a result by requestId. Returns null if not yet completed.
     * If completed, returns the result and removes it from the completed cache.
     */
    poll(requestId) {
        if (this.completedResults.has(requestId)) {
            const result = this.completedResults.get(requestId);
            this.completedResults.delete(requestId);
            return result;
        }
        return null;
    }

    _handleError(workerContext, error) {
        console.error("WorkerPool: Worker reported an error", error);

        if (workerContext.currentRequestId) {
            const pending = this.pendingRequests.get(workerContext.currentRequestId);
            if (pending) {
                pending.reject(error);
                this.pendingRequests.delete(workerContext.currentRequestId);
            }
        }

        workerContext.busy = false;
        workerContext.currentRequestId = null;
        this._processQueue();
    }

    /**
     * Shuts down all workers.
     */
    terminate() {
        this.workers.forEach(w => w.instance.terminate());
        this.workers = [];
        this.initialized = false;
        this.queue = [];
        this.pendingRequests.clear();
    }
}
