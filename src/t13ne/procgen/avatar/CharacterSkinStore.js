/**
 * Stores an avatar skin separately from character records in the Codex files
 * store, so saving an appearance never rewrites unrelated character fields.
 */
export class CharacterSkinStore {
    constructor(codexDB) {
        this.codexDB = codexDB;
    }

    path(characterId) {
        if ((typeof characterId !== 'string' && typeof characterId !== 'number') ||
            (typeof characterId === 'number' && !Number.isSafeInteger(characterId)) ||
            String(characterId).trim() === '') {
            throw new TypeError('A stable character id is required to store a skin.');
        }
        return `avatar-skins/${encodeURIComponent(String(characterId))}.json`;
    }

    async load(characterId) {
        const record = await this.codexDB.getFile(this.path(characterId));
        if (record == null) return null;
        if (!Number.isSafeInteger(record.revision) || record.revision < 1 || record.document?.format !== 't13-avatar-skin') {
            throw new Error('Stored character skin is invalid.');
        }
        return record;
    }

    async save(characterId, document, expectedRevision = 0) {
        const path = this.path(characterId);
        if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
            throw new TypeError('Skin revision must be a non-negative integer.');
        }
        if (document?.format !== 't13-avatar-skin') throw new TypeError('A skin document is required.');
        const db = await this.codexDB.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            let failure;
            const request = store.get(path);
            request.onsuccess = () => {
                const existing = request.result?.data;
                const current = existing == null ? 0 : existing.revision;
                if (existing != null && (!Number.isSafeInteger(current) || current < 1 || existing.document?.format !== 't13-avatar-skin')) {
                    failure = new Error('Stored character skin is invalid.');
                    transaction.abort();
                    return;
                }
                if (current !== expectedRevision) {
                    failure = new Error('Character skin changed in another editor. Reopen it before saving.');
                    transaction.abort();
                    return;
                }
                store.put({ path, data: { revision: current + 1, document } });
            };
            transaction.oncomplete = () => resolve(expectedRevision + 1);
            transaction.onerror = () => reject(failure || transaction.error || new Error('Character skin save failed.'));
            transaction.onabort = () => reject(failure || transaction.error || new Error('Character skin save was aborted.'));
        });
    }
}
