import Logger from "/src/t13ne/core/Logger.js";

class CodexDB {
    constructor() {
        this.dbName = 'T13Codex';
        this.version = 1;
        this.db = null;
    }

    async open() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Store for raw JSON files by path (mirroring the file system)
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files', { keyPath: 'path' });
                }
                // Store for parsed Knots/Entities by ID for quick lookup
                if (!db.objectStoreNames.contains('knots')) {
                    const knotStore = db.createObjectStore('knots', { keyPath: 'id' });
                    knotStore.createIndex('type', 'type', { unique: false });
                    // MultiEntry index for tags allows searching by individual tags
                    knotStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                Logger.message('CodexDB: Database opened successfully.');
                resolve(this.db);
            };

            request.onerror = (event) => {
                Logger.error('CodexDB: Failed to open database.', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getFile(path) {
        await this.open();
        const result = await this._get('files', path);
        return result ? result.data : null;
    }

    async saveFile(path, data) {
        await this.open();
        return this._put('files', { path, data });
    }

    async getKnot(id) {
        await this.open();
        return this._get('knots', id);
    }

    async saveKnot(knot) {
        await this.open();
        if (!knot.id) throw new Error("CodexDB: Cannot save knot without ID");
        return this._put('knots', knot);
    }

    async _get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async _put(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            // Deep sanitize to remove Promises and other uncloneable items
            const sanitize = (obj, path = 'root', seen = new WeakMap()) => {
                if (obj instanceof Promise) {
                    Logger.message(`CodexDB.sanitize: Stripping Promise at ${path}`);
                    return null;
                }
                if (typeof obj === 'function') {
                    Logger.message(`CodexDB.sanitize: Stripping Function at ${path}`);
                    return null;
                }
                if (typeof obj === 'symbol') {
                    Logger.message(`CodexDB.sanitize: Stripping Symbol at ${path}`);
                    return null;
                }
                if (typeof obj !== 'object' || obj === null) return obj;

                if (seen.has(obj)) return '[Circular]';

                const isArray = Array.isArray(obj);
                const copy = isArray ? [] : {};
                seen.set(obj, copy);

                // Handle both normal keys and symbols if they exist
                const keys = isArray ? obj.map((_, i) => i) : [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];

                for (const key of keys) {
                    const keyStr = typeof key === 'symbol' ? key.toString() : key;

                    // EXPLICIT SKIP for massive system-level objects to prevent traversal of the entire engine
                    if (['t13ne', 'codexLoader', 'viewManager', 'engine', 'pluginManager', 'gameEngine', 'sceneManager', 'renderer', 'workerPool', 'pool'].includes(keyStr)) {
                        copy[key] = `[SystemRef: ${keyStr}]`;
                        continue;
                    }

                    // Skip private properties or internal state that shouldn't be persisted if they start with underscore
                    // but we keep some critical ones. This is a heuristic.
                    if (typeof keyStr === 'string' && keyStr.startsWith('_') && !['_id', '_type', '_rev', '_data'].includes(keyStr)) {
                        continue;
                    }

                    const val = obj[key];
                    const sanitized = sanitize(val, `${path}.${keyStr}`, seen);

                    // We keep nulls if they were already there, but we skip undefined/stripped
                    if (sanitized !== undefined) {
                        copy[key] = sanitized;
                    }
                }
                return copy;
            };

            const sanitizedItem = sanitize(item);

            try {
                const request = store.put(sanitizedItem);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (e) {
                Logger.error(`CodexDB: Critical failure putting to ${storeName}. Sanitization may have missed something.`, e);
                // Last ditch effort: log the sanitized item structure if it still fails
                Logger.message("CodexDB: Failed Sanitized Item Structure:", Object.keys(sanitizedItem));
                reject(e);
            }
        });
    }
}
const instance = new CodexDB();
export default instance;






