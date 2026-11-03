import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyHitchTier, evaluateHitch } from '../src/t13ne/modules/mechanics/HitchRules.js';
import { createCoreFacetRuleRegistry } from '../src/t13ne/modules/mechanics/FacetRuleRegistry.js';
import craft from '../src/t13ne/data/facets/craft.js';
import orthodox from '../src/t13ne/data/facets/orthodox.js';

const TIE = { ROOT: 1 << 4, GNARL: 1 << 9, TRIGGER: 1 << 13 };
const facets = {
    async getFacet(id) {
        return [craft, orthodox].find(f => f.FacetIndex === id || f.FacetName.toLowerCase() === String(id).toLowerCase()) || null;
    }
};

test('Hitch tiers use half the relevant Facet Boon numerically', () => {
    assert.equal(classifyHitchTier(10, 20), 'Quirk');
    assert.equal(classifyHitchTier(11, 20), 'Flaw');
    assert.equal(classifyHitchTier(20, 20), 'Flaw');
    assert.equal(classifyHitchTier(21, 20), 'Woe');
    assert.throws(() => classifyHitchTier(3, 0), /positive/);
});

async function loadBoons() {
    const source = await readFile('src/t13ne/modules/mechanics/t13ne-boon.js', 'utf8');
    const code = source
        .replace(/import dice from [^;]+;/, 'const dice = {};')
        .replace(/import CodexLoader from [^;]+;/, 'const CodexLoader = {};');
    return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
}

test('Hitch type, overlapping trigger and Gnarls use tagged Facet rules', async () => {
    const boons = await loadBoons();
    const records = {
        engine: { id: 'engine', prof: { Name: ['Engine'], Tags: { Facets: ['2'] } } },
        stress: { id: 'stress', name: 'Stress', tags: { facets: ['14'] } },
        combined: { id: 'combined', name: 'Mixed', tags: { facets: ['2', '14'] } }
    };
    const hitch = {
        bane: 10,
        knot: { getAssociations: () => new Map([
            ['engine', TIE.ROOT | TIE.TRIGGER | TIE.GNARL],
            ['stress', TIE.GNARL]
        ]) },
        codexLoader: { async getProficiency(id) { return records[id] || null; } }
    };
    const result = await evaluateHitch(hitch, { triggerIds: ['engine'], facets, facetBoon: 20 }, TIE, boons);
    assert.equal(result.triggered, true);
    assert.equal(result.tier, 'Quirk');
    assert.deepEqual(result.matchedTriggerIds, ['engine']);
    assert.equal(result.marks, 3);
    assert.equal(result.ruins, 1);
    assert.equal(result.type.facet, 'Craft');
    assert.deepEqual(result.gnarls.map(item => item.name), [craft.Gnarl, orthodox.Gnarl]);
    assert.equal(result.gnarls[0].rules, craft.Gnarl_Text);
    assert.deepEqual(result.effects, [
        { kind: 'difficulty', proficiencyId: 'engine', score: 10, pips: 3 },
        { kind: 'stress', proficiencyId: 'stress', amount: 3 }
    ]);
    const inactive = await evaluateHitch(hitch, { triggerIds: [], facets }, TIE, boons);
    assert.equal(inactive.triggered, false);
    assert.deepEqual(inactive.effects, []);
    const observedEvent = await evaluateHitch(hitch, {
        triggerIds: [], facets, event: { subject: 'engine' },
        matchTrigger: ({ proficiencyId, event }) => event.subject === proficiencyId
    }, TIE, boons);
    assert.equal(observedEvent.triggered, true);
    await assert.rejects(evaluateHitch(hitch, {
        triggerIds: [], facets, matchTrigger: () => 'yes'
    }, TIE, boons), /boolean/);
    const customRules = createCoreFacetRuleRegistry();
    customRules.register({
        facet: 'Orthodox', system: 'Failure',
        handler: () => ({ kind: 'authored-failure' })
    });
    assert.deepEqual((await evaluateHitch(hitch, {
        triggerIds: ['engine'], facets, facetRules: customRules
    }, TIE, boons)).effects, result.effects);
    for (const [bane, marks, ruins] of [[3, 1, 0.5], [5, 2, 1], [13, 4, 1]]) {
        hitch.bane = bane;
        const reduced = await evaluateHitch(hitch, { triggerIds: [], facets }, TIE, boons);
        assert.deepEqual([reduced.marks, reduced.ruins], [marks, ruins]);
    }

    hitch.knot.getAssociations = () => new Map([['combined', TIE.ROOT | TIE.TRIGGER | TIE.GNARL]]);
    await assert.rejects(evaluateHitch(hitch, { triggerIds: [], facets }, TIE, boons), /explicit Facet selection/);
    const selected = await evaluateHitch(hitch, {
        triggerIds: ['combined'], facets, typeFacet: 'Craft', gnarlFacets: { combined: 'Orthodox' }
    }, TIE, boons);
    assert.equal(selected.type.facet, 'Craft');
    assert.equal(selected.gnarls[0].facet, 'Orthodox');
    await assert.rejects(evaluateHitch(hitch, {
        triggerIds: [], facets, typeFacet: 'Awe', gnarlFacets: { combined: 'Orthodox' }
    }, TIE, boons), /Unknown Hitch type Facet/);
});

test('all 24 Facet rules remain available without inventing their effects', async () => {
    const boons = await loadBoons();
    const { default: actualFacets } = await import('../src/t13ne/modules/mechanics/t13ne-facets.js');
    const all = await actualFacets.getFacetsArr();
    assert.equal(all.length, 24);
    for (const facet of all) {
        const record = { id: facet.FacetIndex, tags: { facets: [facet.FacetIndex] } };
        const hitch = {
            bane: 3,
            knot: { getAssociations: () => new Map([[record.id, TIE.ROOT | TIE.TRIGGER | TIE.GNARL]]) },
            codexLoader: { async getProficiency() { return record; } }
        };
        const result = await evaluateHitch(hitch, { triggerIds: [String(record.id)], facets: actualFacets }, TIE, boons);
        assert.equal(result.type.facet, facet.FacetName);
        assert.equal(result.gnarls[0].rules, facet.Gnarl_Text);
        const kinds = { Craft: 'difficulty', Orthodox: 'stress', Burden: 'sway-expense',
            Liberty: 'negative-bane-die', Miasma: 'toxin-attack' };
        assert.equal(result.effects[0].kind, kinds[facet.FacetName] || 'adjudication');
        if (facet.FacetName === 'Burden') assert.equal(result.effects[0].amount, 3);
        if (facet.FacetName === 'Miasma') assert.equal(result.effects[0].basePips, 1.5);
    }
});

test('Hitch round-trips roles and evaluates numeric and textual references', async () => {
    const boons = await loadBoons();
    const source = await readFile('src/t13ne/modules/mechanics/t13ne-knots.js', 'utf8');
    const code = source
        .replace(/import Logger from [^;]+;/, 'const Logger = { message() {}, start() {}, end() {}, warn() {} };')
        .replace(/import T13NE_Sway from [^;]+;/, 'const T13NE_Sway = {};')
        .replace(/import T13Name from [^;]+;/, 'class T13Name {}')
        .replace(/import T13Boons from [^;]+;/, 'const T13Boons = globalThis.__hitchBoons;')
        .replace(/import \{ evaluateHitch \} from [^;]+;/, 'const evaluateHitch = globalThis.__evaluateHitch;');
    globalThis.__hitchBoons = boons;
    globalThis.__evaluateHitch = evaluateHitch;
    try {
        const { Hitch, TIE: roles } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
        const record = { id: 1960, prof: { Name: ['Engine'], Tags: { Facets: ['2'] } } };
        let saved;
        const codex = {
            async getProficiency(id) { return String(id) === '1960' ? record : saved; },
            async createProficiency(data) { saved = { ...data, id: 'custom-hitch' }; return saved.id; },
            async updateProficiency(id, data) { Object.assign(saved, data); }
        };
        const hitch = new Hitch(codex, {
            name: 'Engine difficulty', description: 'Hard to start', bane: 3,
            root: 1960, triggers: ['1960'], gnarls: ['1960'], tier: 'Quirk'
        });
        assert.equal((await hitch.evaluateTrigger({ triggerIds: [1960], facets })).gnarls[0].facet, 'Craft');
        await hitch.saveAsProficiency();
        const restored = Hitch.fromProficiency(codex, saved);
        assert.equal(restored.tier, 'Quirk');
        assert.ok(restored.knot.get('custom-hitch') & roles.HITCH);
        const result = await restored.evaluateTrigger({ triggerIds: ['1960'], facets });
        assert.equal(result.triggered, true);
        assert.equal(result.marks, 1);
        assert.equal(result.gnarls.length, 1);
        assert.throws(() => Hitch.fromProficiency(codex, { id: 'broken' }), /missing sourceHitch/);
    } finally {
        delete globalThis.__hitchBoons;
        delete globalThis.__evaluateHitch;
    }
});
