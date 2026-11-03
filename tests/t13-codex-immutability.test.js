import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isSafeProficiencyId } from '../src/t13ne/modules/codex/ProficiencyIdentity.js';
import { validateProficiency } from '../src/t13ne/modules/codex/ProficiencyValidation.js';

const root = process.cwd();

test('Proficiency references accept safe textual and legacy numeric identifiers', () => {
    for (const id of ['1960', 'prof_engine', 'custom-123']) assert.equal(isSafeProficiencyId(id), true);
    for (const id of ['', '../outside', '__proto__', 'constructor', 'x'.repeat(129)]) {
        assert.equal(isSafeProficiencyId(id), false);
    }
});

test('Proficiency minimum supports flat and wrapped multi-Facet records', () => {
    assert.doesNotThrow(() => validateProficiency({
        name: 'Engine', description: 'Moves a ship', tags: { facets: ['1'] }
    }));
    assert.doesNotThrow(() => validateProficiency({
        prof: { Name: ['Navigation'], Description: 'Finds a route', Tags: { Facets: ['1', '2'] } }
    }));
    for (const data of [
        { name: '', description: 'Description', tags: { facets: ['1'] } },
        { name: 'Name', description: ' ', tags: { facets: ['1'] } },
        { name: 'Name', description: 'Description', tags: { facets: [] } },
        { name: 'Name', description: 'Description', tags: { facets: [null] } }
    ]) assert.throws(() => validateProficiency(data), /Proficiency requires/);
});

test('CodexScribe rejects overwriting Core Proficiency records (immutability)', async () => {
    const scribeSource = await readFile(path.join(root, 'src/t13ne/modules/codex/CodexScribe.js'), 'utf8');
    const moduleSource = scribeSource
        .replace(/import Logger from [^;]+;/, 'const Logger = { message() {}, warn() {}, error() {}, start() {}, end() {} };')
        .replace(/import \{ isSafeProficiencyId \} from [^;]+;/, "const isSafeProficiencyId = id => /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id) && !Object.hasOwn(Object.prototype, id);")
        .replace(/import CodexDB from [^;]+;/, `const records = new Map(); const CodexDB = {
            async saveCustomProficiency(data, id) {
                id ||= '4000';
                const record = { ...records.get(id), ...data, id };
                records.set(id, record);
                return record;
            }
        };`);

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
        coreProficiencyIds: new Set(['1960', '3613']),
        async _getOrBuildProficiencyManifest() {
            return this.profManifest;
        },
        _indexProficiency() {},
        _calcNextProfId() {}
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
    assert.equal(await scribe.createProficiency({ name: 'Updated Warp Core' }, newId), newId);
    assert.equal(scribe.isCoreId(newId), false);
    assert.equal(scribe.dirtyFiles['custom-proficiencies/9999.json'].name, 'Updated Warp Core');
    assert.equal(await scribe.createProficiency({ name: 'Named' }, 'test_engine'), 'test_engine');
    await assert.rejects(scribe.createProficiency({ name: 'Invalid' }, '../outside'), /Invalid Proficiency ID/);
});

test('failed custom Proficiency writes do not change the manifest', async () => {
    const source = await readFile(path.join(root, 'src/t13ne/modules/codex/CodexScribe.js'), 'utf8');
    const moduleSource = source
        .replace(/import Logger from [^;]+;/, 'const Logger = { message() {}, warn() {}, error() {}, start() {}, end() {} };')
        .replace(/import \{ isSafeProficiencyId \} from [^;]+;/, 'const isSafeProficiencyId = () => true;')
        .replace(/import CodexDB from [^;]+;/, "const CodexDB = { saveCustomProficiency: async () => { throw new Error('storage failed'); } };");
    const { CodexScribe } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
    const librarian = {
        coreProficiencyIds: new Set(['1960']),
        profManifest: { paths: { 1960: 'core' }, indexes: { name: {}, facet: {}, geometry: {} } },
        async _getOrBuildProficiencyManifest() { return this.profManifest; },
        _indexProficiency() {}
    };
    const scribe = new CodexScribe({}, librarian);
    await assert.rejects(scribe.createProficiency({ name: 'Custom' }), /storage failed/);
    assert.deepEqual(librarian.profManifest.paths, { 1960: 'core' });
    assert.deepEqual(scribe.dirtyFiles, {});
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

    const calls = [];
    library._fetchFile = async (...args) => { calls.push(args); return {}; };
    for (const [category, file] of [
        ['proficiencies/Profs', '../../../../outside.json'],
        ['knots/Knots', '%2e%2e/outside.json'],
        ['tagging', '..\\outside.json'],
        ['dressing', '/outside.json'],
        ['proficiencies/Profs/../outside.json', undefined]
    ]) {
        assert.equal(await library.getData(category, file), null);
    }
    assert.equal(calls.length, 0);
    await library.getData('proficiencies/Profs/0/profs0.json');
    assert.equal(calls.length, 1);
});
