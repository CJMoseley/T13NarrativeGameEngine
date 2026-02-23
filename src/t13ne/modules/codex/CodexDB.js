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
            // Debug uncloneable data
            const findUncloneable = (obj, path = '') => {
                if (obj instanceof Promise) return path;
                if (typeof obj !== 'object' || obj === null) return null;
                for (const key in obj) {
                    try {
                        const res = findUncloneable(obj[key], path ? `${path}.${key}` : key);
                        if (res) return res;
                    } catch (e) {
                        return path ? `${path}.${key}` : key;
                    }
                }
                return null;
            };

            const uncloneablePath = findUncloneable(item);
            if (uncloneablePath) {
                Logger.error(`CodexDB: Uncloneable property found at item.${uncloneablePath}`);
                console.error('Uncloneable item:', item);
            }

            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

export default new CodexDB();






