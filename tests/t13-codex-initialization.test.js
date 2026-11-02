import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

for (const copy of ['src/t13ne', 'ttrpg-companion/src/t13ne']) {
    test(`${copy}: codex initialization propagates failure and permits retry`, async () => {
        const source = await readFile(path.join(process.cwd(), copy, 'modules/codex/CodexLibrary.js'), 'utf8');
        const stubbed = source
            .replace(/import Logger from [^;]+;/, 'const Logger = { message() {}, warn() {}, error() {} };')
            .replace(/import CodexDB from [^;]+;/, 'const CodexDB = { async open() {} };');
        const { CodexLibrary } = await import(`data:text/javascript;base64,${Buffer.from(stubbed).toString('base64')}`);
        const previousFetch = globalThis.fetch;
        try {
            let calls = 0;
            globalThis.fetch = async () => {
                calls++;
                if (calls === 1) return { ok: false, status: 503 };
                return { ok: true, json: async () => ({}) };
            };
            const library = new CodexLibrary();
            await assert.rejects(library.initialize(0, 0), /503/);
            assert.equal(library.codex, null);
            await Promise.all([library.initialize(0, 0), library.initialize(0, 0)]);
            assert.deepEqual(library.codex, {});
            assert.equal(calls, 2);
        } finally {
            globalThis.fetch = previousFetch;
        }
    });
}
