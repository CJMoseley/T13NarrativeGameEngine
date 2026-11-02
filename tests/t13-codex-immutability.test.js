import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

test('CodexScribe rejects overwriting Core Proficiency records (immutability)', async () => {
    const scribeSource = await readFile(path.join(root, 'src/t13ne/modules/codex/CodexScribe.js'), 'utf8');
    const moduleSource = scribeSource
        .replace(/import Logger from [^;]+;/, 'const Logger = { message() {}, warn() {}, error() {}, start() {}, end() {} };')
        .replace(/import CodexDB from [^;]+;/, 'const CodexDB = { saveKnot: async () => {} };');

    const { CodexScribe } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);

    const mockLibrarian = {
        profManifest: {
            paths: {
                '1960': '/plugins/t13ne/data/json/proficiencies/Profs/0/profs39.json',
                '3613': '/plugins/t13ne/data/json/proficiencies/Profs/1/profs72.json'
            },
            indexes: { name: {}, facet: {}, geometry: {} }
        },
        nextProfId: 4000,
        async _getOrBuildProficiencyManifest() {
            return this.profManifest;
        },
        _indexProficiency() {}
    };

    const mockLibrary = {
        cache: {},
        async getData() { return {}; }
    };

    const scribe = new CodexScribe(mockLibrary, mockLibrarian);

    assert.equal(scribe.isCoreId('1960'), true);
    assert.equal(scribe.isCoreId('3613'), true);
    assert.equal(scribe.isCoreId('9999'), false);

    // Attempting to overwrite Core ID 1960 must throw an Error
    await assert.rejects(
        scribe.createProficiency({ name: 'Tampered Engine' }, '1960'),
        /Cannot overwrite Core Proficiency ID '1960'/
    );

    // Creating a custom, non-core proficiency with custom ID or automatic ID must succeed
    const newId = await scribe.createProficiency({ name: 'Custom Warp Core' }, '9999');
    assert.equal(newId, '9999');
});

test('CodexLibrary rejects path traversal attempts in getFilePath', async () => {
    const libSource = await readFile(path.join(root, 'src/t13ne/modules/codex/CodexLibrary.js'), 'utf8');
    const moduleSource = libSource
        .replace(/import Logger from [^;]+;/, 'const Logger = { message() {}, warn() {}, error() {} };')
        .replace(/import CodexDB from [^;]+;/, 'const CodexDB = {};');

    const { CodexLibrary } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
    const library = new CodexLibrary();
    library.codex = { test: { files: { 'valid.json': true } } };

    assert.equal(library.getFilePath('../secret', 'passwords.json'), null);
    assert.equal(library.getFilePath('test', '../../etc/passwd'), null);
    assert.equal(library.getFilePath('/absolute/path', 'file.json'), null);
});
