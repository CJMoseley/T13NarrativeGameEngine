import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { RuleCatalog } from '../src/t13ne/modules/mechanics/RuleCatalog.js';
import facets from '../src/t13ne/modules/mechanics/t13ne-facets.js';

test('catalog includes all rule pages and Facet aspects without merging titles', async () => {
    const pages = JSON.parse(await readFile('src/t13ne/data/json/other/rules.json', 'utf8'));
    const codex = {
        async getData(category, file) {
            assert.equal(category, 'other');
            assert.equal(file, 'rules.json');
            return pages;
        }
    };
    const entries = await new RuleCatalog({ facets, codex }).list();
    const rules = entries.filter(entry => entry.kind === 'rule-page');
    assert.equal(rules.length, pages.length);
    assert.deepEqual(rules.filter(entry => entry.name === 'Character Arcs').map(entry => entry.id),
        ['T13-NE-RULE-36', 'T13-NE-RULE-47']);
    assert.equal(rules[0].rules, pages[0].data.Description);
    assert.equal(entries.filter(entry => entry.kind === 'facet-page').length, 24);
    assert.ok(entries.some(entry => entry.kind === 'facet-section' &&
        entry.facet === 'Craft' && entry.system === 'Gnarl'));
});

test('catalog surfaces missing or malformed source data', async () => {
    const missing = new RuleCatalog({ facets, codex: { async getData() { return null; } } });
    await assert.rejects(missing.list(), /could not load/);
    const malformed = new RuleCatalog({ facets, codex: { async getData() { return [{}]; } } });
    await assert.rejects(malformed.list(), /invalid rule page/);
});

test('individual rule components retain classification, source and draft status', async () => {
    const pages = JSON.parse(await readFile('src/t13ne/data/json/other/rules.json', 'utf8'));
    const records = [];
    const components = {
        async listRuleComponents() { return records; },
        async addRuleComponent(record) { records.push(record); return record; },
        async getRuleComponent(id) { return records.find(record => record.id === id); },
        async updateRuleComponent(record, expectedRevision) {
            const index = records.findIndex(item => item.id === record.id);
            if (index < 0 || records[index].revision !== expectedRevision) throw new Error('conflicting revision');
            records[index] = record;
            return record;
        }
    };
    const codex = { async getData() { return pages; } };
    const catalog = new RuleCatalog({ facets, codex, components });
    const source = { pageId: 'T13-NE-RULE-23', excerpt: 'Optional Rule: If the digits are added together' };
    const draft = await catalog.createComponent({
        name: 'Numerology', description: 'Optional numerology test modifier.',
        requirement: 'optional', source, contexts: ['Dice Test', 'Dice Test'],
        verification: 'verified', status: 'published'
    });
    assert.match(draft.id, /^rule-component-[0-9a-f]{32}$/);
    assert.equal(draft.status, 'draft');
    assert.equal(draft.verification, 'unverified');
    const found = (await catalog.list()).find(item => item.id === draft.id);
    assert.equal(found.kind, 'rule-component');
    assert.equal(found.sourceStatus, 'matched');
    assert.equal(found.requirement, 'optional');
    assert.deepEqual(found.contexts, ['Dice Test']);
    const updated = await catalog.updateComponent(draft.id, {
        description: 'Updated description', contexts: ['Dice Test', 'Card Draw']
    }, 1);
    assert.equal(updated.revision, 2);
    await assert.rejects(catalog.updateComponent(draft.id, { name: 'Stale' }, 1), /changed/);
    const facetDraft = await catalog.createComponent({
        name: 'Craft Gnarl', description: 'Difficulty increases while triggered.', requirement: 'required',
        source: { kind: 'facet-section', facet: 'Craft', section: 'Gnarl',
            excerpt: 'Difficulties Gnarls simply raise the Difficulty' }
    });
    assert.equal((await catalog.list()).find(item => item.id === facetDraft.id).sourceStatus, 'matched');
    await assert.rejects(catalog.createComponent({
        name: 'Invalid', description: 'Invalid excerpt', requirement: 'required',
        source: { ...source, excerpt: 'not in that page' }
    }), /source excerpt/);
    await assert.rejects(catalog.createComponent({
        name: 'Unclassified', description: 'Must classify explicitly', source
    }), /classification/);
    assert.equal(records.length, 2);
    pages.find(page => page.id === source.pageId).data.Description = 'Source changed';
    assert.equal((await catalog.list()).find(item => item.id === draft.id).sourceStatus, 'changed');
});
