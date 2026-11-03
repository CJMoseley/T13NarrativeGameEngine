import test from 'node:test';
import assert from 'node:assert/strict';
import craft from '../src/t13ne/data/facets/craft.js';
import awe from '../src/t13ne/data/facets/awe.js';
import { createCoreFacetRuleRegistry, describeFacetAspect, FacetRuleRegistry } from '../src/t13ne/modules/mechanics/FacetRuleRegistry.js';

test('Facet rule registry supports distinct rule systems and explicit adjudication', async () => {
    const registry = createCoreFacetRuleRegistry();
    const critical = await registry.resolve({ facet: craft, system: 'Critical', context: { actionId: 'repair' } });
    assert.equal(critical.kind, 'adjudication');
    assert.equal(critical.rules, craft.Critical_Text);
    assert.equal(critical.actionId, 'repair');
    const failure = await registry.resolve({ facet: craft, system: 'Failure', context: { kind: 'success' } });
    assert.equal(failure.kind, 'adjudication');
    assert.equal(failure.rules, craft.Failure_Text);

    registry.register({
        facet: 'Craft', system: 'Critical',
        handler: ({ context }) => ({ kind: 'skill-action-choice', actionId: context.actionId })
    });

    assert.deepEqual(await registry.resolve({ facet: craft, system: 'critical', context: { actionId: 'repair' } }),
        { kind: 'skill-action-choice', actionId: 'repair' });
    assert.throws(() => registry.register({ facet: 'craft', system: 'CRITICAL', handler() {} }), /already registered/);
    await assert.rejects(registry.resolve({ facet: craft, system: 'NotARule' }), /has no/);
});

test('structured and nonstandard Facet aspects retain their complete data', async () => {
    assert.equal(describeFacetAspect(craft, 'Narrative_Moment').rules, craft.Narrative_Text);
    assert.equal(describeFacetAspect(craft, 'Resolved_Hitch').rules, craft.Resolved_Text);
    const persona = describeFacetAspect(craft, 'Persona');
    assert.equal(persona.name, craft.Persona.Name);
    assert.deepEqual(persona.rules, craft.Persona);
    assert.deepEqual(describeFacetAspect(craft, 'Emotion_Positive').rules, craft.Emotion_Positive);
    const registry = createCoreFacetRuleRegistry();
    assert.deepEqual((await registry.resolve({ facet: craft, system: 'Persona' })).rules, craft.Persona);
    const catalog = registry.list(craft);
    assert.equal(catalog.find(item => item.system === 'Gnarl').status, 'handler-registered');
    assert.deepEqual(catalog.find(item => item.system === 'Gnarl').inputs, ['proficiencyId', 'bane', 'marks']);
    assert.deepEqual(catalog.find(item => item.system === 'Gnarl').source,
        { facet: 'Craft', facetIndex: 2, aspect: 'Gnarl' });
    assert.equal(catalog.find(item => item.system === 'Critical').status, 'not-assessed');
    assert.equal(catalog.find(item => item.system === 'Resolved_Hitch').rules, craft.Resolved_Text);
    assert.deepEqual(catalog.find(item => item.system === 'Persona').rules, craft.Persona);
});

test('authored Facet handlers are opt-in and invalid results are surfaced', async () => {
    const registry = new FacetRuleRegistry();
    registry.register({
        facet: 'Awe', system: 'Gnarl',
        handler: ({ context }) => ({ kind: 'authored-emotion', proficiencyId: context.proficiencyId })
    });

    assert.deepEqual(await registry.resolve({ facet: awe, system: 'Gnarl', context: { proficiencyId: 'fear' } }),
        { kind: 'authored-emotion', proficiencyId: 'fear' });
    assert.equal((await createCoreFacetRuleRegistry().resolve({ facet: awe, system: 'Gnarl' })).kind, 'adjudication');
    registry.register({ facet: 'Awe', system: 'Failure', handler: () => null });
    await assert.rejects(registry.resolve({ facet: awe, system: 'Failure' }), /invalid effect/);
});

test('engine Facets module exposes a catalog for every Facet', async () => {
    const { default: facets } = await import('../src/t13ne/modules/mechanics/t13ne-facets.js');
    const catalog = await facets.getRuleCatalog();
    assert.equal(new Set(catalog.map(item => item.source.facetIndex)).size, 24);
    const craftGnarl = catalog.find(item => item.facet === 'Craft' && item.system === 'Gnarl');
    assert.equal(craftGnarl.status, 'handler-registered');
    assert.equal(craftGnarl.rules, craft.Gnarl_Text);
    assert.ok(catalog.some(item => item.facet === 'Awe' && item.system === 'Critical' &&
        item.status === 'not-assessed'));
});
