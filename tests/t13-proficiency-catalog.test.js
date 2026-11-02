import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const copies = [
    'src/t13ne',
    'ttrpg-companion/src/t13ne'
];

for (const copy of copies) {
    test(`${copy}: indexes and resolves proficiency bundles`, async () => {
        const source = await readFile(path.join(root, copy, 'modules/codex/CodexLibrarian.js'), 'utf8');
        const moduleSource = source.replace(
            /import Logger from [^;]+;/,
            'const Logger = { message() {}, warn() {}, error() {} };'
        );
        const { CodexLibrarian } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
        const cache = new Map([
            ['T13NE_PROF_MANIFEST_VERSION', '1.0.0'],
            ['T13NE_PROF_MANIFEST', JSON.stringify({ paths: { 1: 'stale' } })]
        ]);
        globalThis.localStorage = {
            getItem: key => cache.get(key) ?? null,
            setItem: (key, value) => cache.set(key, value),
            removeItem: key => cache.delete(key)
        };
        const library = {
            async getData(category, file) {
                if (category === 'geometry') return [];
                const relative = file ? `${category}/${file}` : category;
                try {
                    return JSON.parse(await readFile(path.join(root, copy, 'data/json', relative), 'utf8'));
                } catch (error) {
                    if (error.code === 'ENOENT') return null;
                    throw error;
                }
            }
        };
        const librarian = new CodexLibrarian(library);
        const [manifest, concurrentManifest] = await Promise.all([
            librarian._getOrBuildProficiencyManifest(),
            librarian._getOrBuildProficiencyManifest()
        ]);
        assert.equal(manifest, concurrentManifest);
        assert.equal(Object.keys(manifest.paths).length, copy.startsWith('src/') ? 3899 : 3847);
        const engine = await librarian.getProficiency(1960);
        assert.equal(engine.prof.Name[0], 'Engine');
        assert.equal(librarian.matchesFilter(engine, { genre: ['6'], era: ['3'], scope: ['5'] }), true);
        assert.equal(librarian.matchesFilter({ prof: { Tags: { Genres: ['5'], Eras: ['2'], Scopes: ['5'] } } },
            { genre: ['6'], era: ['3'], scope: ['5'] }), false);
        assert.equal(librarian.matchesFilter({ tags: { genres: [6], eras: [3], scopes: [5] } },
            { genre: ['6'], era: ['3'], scope: ['5'] }), true);
        assert.ok(manifest.indexes.name.engine.includes('1960'));
        assert.ok(manifest.indexes.facet['23'].includes('1960'));
        assert.equal((await librarian.getProficiency(3613)).prof.Name[0], 'Shield');
        assert.equal(librarian.nextProfId, Math.max(...Object.keys(manifest.paths).map(Number)) + 1);
        assert.ok(librarian.nextProfId > 3853);
        assert.ok(await librarian.getProficiency(librarian.nextProfId - 1));
        assert.equal(cache.get('T13NE_PROF_MANIFEST_VERSION'), '3.0.0');
        librarian.profManifest.paths['1960'] = 'proficiencies/Profs/0/profs39.json';
        assert.equal((await librarian.getProficiency(1960)).id, 1960);

        const empty = new CodexLibrarian({ getData: async () => null });
        await assert.rejects(empty._buildProficiencyManifest(), /missing proficiency bundle inventory/);
        assert.equal(empty.profManifest, null);

        const gap = new CodexLibrarian({
            async getData(bundle) {
                if (bundle.endsWith('bundles.json')) return { version: 1, bundles: [
                    { path: 'proficiencies/Profs/0/profs0.json', count: 1 },
                    { path: 'proficiencies/Profs/0/profs1.json', count: 1 }
                ] };
                if (bundle.endsWith('profs0.json')) return { 1: { name: 'first' } };
                return null;
            }
        });
        await assert.rejects(gap._buildProficiencyManifest(), /Missing or incomplete proficiency bundle/);
        assert.equal(gap.profManifest, null);
    });
}
