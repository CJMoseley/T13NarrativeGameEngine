import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterSkinStore } from '../src/t13ne/procgen/avatar/CharacterSkinStore.js';
import { CharacterSkinStore as CompanionStore } from '../ttrpg-companion/src/t13ne/procgen/avatar/CharacterSkinStore.js';

function fakeCodex() {
    const records = new Map();
    let abortNextWrite = false;
    return {
        getFile: async path => records.get(path) ?? null,
        abortNextWrite: () => { abortNextWrite = true; },
        open: async () => ({
            transaction() {
                let aborted = false;
                let pending;
                const transaction = {
                    objectStore() {
                        return {
                            get(path) {
                                const request = {};
                                queueMicrotask(() => {
                                    request.result = records.has(path) ? { path, data: records.get(path) } : undefined;
                                    request.onsuccess();
                                    if (!aborted) {
                                        if (abortNextWrite) {
                                            abortNextWrite = false;
                                            aborted = true;
                                            transaction.onabort();
                                        } else {
                                            if (pending) records.set(pending.path, pending.data);
                                            transaction.oncomplete();
                                        }
                                    }
                                });
                                return request;
                            },
                            put(value) { pending = value; }
                        };
                    },
                    abort() {
                        aborted = true;
                        queueMicrotask(() => transaction.onabort());
                    }
                };
                return transaction;
            }
        })
    };
}

for (const Store of [CharacterSkinStore, CompanionStore]) {
    test(`${Store === CharacterSkinStore ? 'root' : 'companion'} skin store saves, detects stale revisions and rejects aborted writes`, async () => {
        const db = fakeCodex();
        const store = new Store(db);
        const first = { format: 't13-avatar-skin', pixels: [1] };
        assert.equal(await store.load('character/one'), null);
        assert.equal(await store.save('character/one', first, 0), 1);
        assert.deepEqual(await store.load('character/one'), { revision: 1, document: first });
        await assert.rejects(store.save('character/one', { format: 't13-avatar-skin', pixels: [2] }, 0), /another editor/);
        db.abortNextWrite();
        await assert.rejects(store.save('character/one', { format: 't13-avatar-skin', pixels: [3] }, 1), /aborted/);
        assert.deepEqual(await store.load('character/one'), { revision: 1, document: first });
        assert.equal(await store.save('character/one', { format: 't13-avatar-skin', pixels: [4] }, 1), 2);
        assert.equal(await store.load('other'), null);
        assert.throws(() => store.path(''), /stable character id/);
        await assert.rejects(store.save('x', first, -1), /revision/);
    });
}
