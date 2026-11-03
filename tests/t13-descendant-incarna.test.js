import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getComponentIncarnaCandidates } from '../src/t13ne/procgen/ships/components/ComponentFacetHints.js';

test('component Incarna hints are optional rule-backed candidates', () => {
    assert.deepEqual(getComponentIncarnaCandidates('engine'), ['Zeal']);
    assert.deepEqual(getComponentIncarnaCandidates('Shield'), ['Rook']);
    assert.deepEqual(getComponentIncarnaCandidates('vortex'), []);
    assert.deepEqual(getComponentIncarnaCandidates('constructor'), []);
    assert.throws(() => getComponentIncarnaCandidates(null), /usage/);
    const candidates = getComponentIncarnaCandidates('engine');
    candidates.push('Fury');
    assert.deepEqual(getComponentIncarnaCandidates('engine'), ['Zeal']);
});

test('Descendants retain their selected or generated Incarna', async () => {
    const source = await readFile('src/t13ne/modules/characters/t13ne-descendants.js', 'utf8');
    const code = source
        .replace(/import \{ SuperKnot \} from [^;]+;/, 'class SuperKnot { constructor(loader, data) { Object.assign(this, data); } }')
        .replace(/import T13SwayAccount from [^;]+;/, 'class T13SwayAccount { constructor(data) { this.data = data; } }')
        .replace(/import T13NE from [^;]+;/, 'const T13NE = globalThis.__descendantTestModules;')
        .replace(/import T13Dice from [^;]+;/, 'const T13Dice = { RNG: () => 0 };')
        .replace(/import Logger from [^;]+;/, 'const Logger = { start() {}, end() {}, message() {} };');
    const facets = [
        { FacetIndex: 0, FacetName: 'Awe' },
        { FacetIndex: 23, FacetName: 'Zeal' }
    ];
    const modules = {
        Facets: {
            async getFacetsArr() { return facets; },
            async getFacet(id) {
                return facets.find(f => f.FacetIndex === id || f.FacetName.toLowerCase() === String(id).toLowerCase()) || null;
            }
        },
        AnnexFactory: { async create(data) { return data; } }
    };
    globalThis.__descendantTestModules = { getModule: name => modules[name] };
    try {
        const { Descendant } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
        const manual = new Descendant({}, { name: 'Manual', incarna: 'Rook' });
        assert.equal(manual.incarna, 'Rook');
        assert.equal(new Descendant({}, { name: 'Legacy' }).incarna, null);

        const engine = await Descendant.generate({}, { name: 'Engine', incarna: 'Zeal' });
        assert.equal(engine.incarna, 'Zeal');
        assert.equal(engine.masterAnnex.name, 'Zeal Function');
        const authored = { name: 'Authored engine Annex' };
        assert.equal((await Descendant.generate({}, { incarna: 'Zeal', masterAnnex: authored })).masterAnnex, authored);
        assert.equal((await Descendant.generate({}, { incarna: 0 })).incarna, 'Awe');
        assert.equal((await Descendant.generate({}, { incarna: '0' })).incarna, 'Awe');
        assert.equal((await Descendant.generate({}, {})).incarna, 'Awe');
        await assert.rejects(Descendant.generate({}, { incarna: 'Not a Facet' }), /Unknown Incarna Facet/);
    } finally {
        delete globalThis.__descendantTestModules;
    }
});
