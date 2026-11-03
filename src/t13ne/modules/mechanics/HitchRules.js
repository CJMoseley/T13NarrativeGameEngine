import { coreFacetRuleRegistry } from './FacetRuleRegistry.js';

function facetTags(record) {
    const data = record.prof || record;
    const tags = data.tags || data.Tags || {};
    return tags.facets || tags.Facets || [];
}

async function resolveFacet(record, selection, facets, role) {
    const tags = facetTags(record);
    if (!Array.isArray(tags) || !tags.length) {
        throw new Error(`Hitch ${role} Proficiency '${record.id}' has no Facet.`);
    }
    if (selection === undefined && tags.length !== 1) {
        throw new Error(`Hitch ${role} Proficiency '${record.id}' requires an explicit Facet selection.`);
    }
    const selected = selection ?? tags[0];
    let identifier = selected;
    if (typeof identifier === 'string' && /^\d+$/.test(identifier)) identifier = Number(identifier);
    const facet = await facets.getFacet(identifier);
    if (!facet) throw new Error(`Unknown Hitch ${role} Facet '${selected}'.`);
    const matches = tags.some(tag => String(tag).toLowerCase() === String(facet.FacetName).toLowerCase() ||
        String(tag) === String(facet.FacetIndex));
    if (!matches) throw new Error(`Facet '${selected}' is not tagged on Hitch ${role} Proficiency '${record.id}'.`);
    return facet;
}

export function classifyHitchTier(bane, facetBoon) {
    if (!Number.isFinite(bane) || bane <= 0 || !Number.isFinite(facetBoon) || facetBoon <= 0) {
        throw new Error('Hitch tier requires a positive Bane and relevant Facet Boon.');
    }
    if (bane <= facetBoon / 2) return 'Quirk';
    if (bane <= facetBoon) return 'Flaw';
    return 'Woe';
}

export async function evaluateHitch(hitch, options, masks, boons) {
    const { triggerIds, facets, typeFacet, gnarlFacets = {}, facetBoon, facetRules = coreFacetRuleRegistry,
        matchTrigger, event } = options;
    if (!Array.isArray(triggerIds) || !facets || typeof facets.getFacet !== 'function') {
        throw new Error('Hitch evaluation requires trigger IDs and a Facets provider.');
    }
    if (!Number.isFinite(hitch.bane) || hitch.bane <= 0) {
        throw new Error('Hitch evaluation requires a positive Bane.');
    }
    const merged = new Map();
    for (const [id, mask] of hitch.knot.getAssociations()) {
        const key = String(id);
        const existing = merged.get(key);
        merged.set(key, existing ? [existing[0], existing[1] | mask] : [id, mask]);
    }
    const associations = [...merged.values()];
    const roots = associations.filter(([, mask]) => (mask & masks.ROOT) !== 0);
    const triggers = associations.filter(([, mask]) => (mask & masks.TRIGGER) !== 0);
    const gnarls = associations.filter(([, mask]) => (mask & masks.GNARL) !== 0);
    if (roots.length !== 1 || !triggers.length) {
        throw new Error('Hitch requires exactly one type Proficiency and at least one trigger Proficiency.');
    }
    const getRecord = async id => {
        const record = await hitch.codexLoader.getProficiency(id);
        if (!record) throw new Error(`Hitch Proficiency '${id}' was not found.`);
        return record;
    };
    const rootRecord = await getRecord(roots[0][0]);
    const rootFacet = await resolveFacet(rootRecord, typeFacet, facets, 'type');
    const triggerRecords = await Promise.all(triggers.map(([id]) => getRecord(id)));
    const gnarlRecords = await Promise.all(gnarls.map(([id]) => getRecord(id)));
    const gnarlDefinitions = await Promise.all(gnarlRecords.map(async (record, index) => {
        const id = gnarls[index][0];
        const facet = await resolveFacet(record, gnarlFacets[id], facets, 'Gnarl');
        return { facet, rule: {
            proficiencyId: id,
            facet: facet.FacetName,
            name: facet.Gnarl,
            rules: facet.Gnarl_Text
        } };
    }));
    const gnarlRules = gnarlDefinitions.map(item => item.rule);
    if (matchTrigger !== undefined && typeof matchTrigger !== 'function') {
        throw new TypeError('Hitch trigger matcher must be a function.');
    }
    const observed = new Set(triggerIds.map(String));
    const matched = [];
    for (let index = 0; index < triggers.length; index++) {
        const proficiencyId = triggers[index][0];
        const matches = matchTrigger
            ? await matchTrigger({ proficiencyId, record: triggerRecords[index], triggerIds, event })
            : observed.has(String(proficiencyId));
        if (typeof matches !== 'boolean') throw new TypeError('Hitch trigger matcher must return a boolean.');
        if (matches) matched.push(proficiencyId);
    }
    const marks = boons.getBoonReduced(hitch.bane);
    const ruins = boons.getBoonDraw(hitch.bane);
    if (!Number.isFinite(marks) || !Number.isFinite(ruins)) {
        throw new Error('Hitch Bane could not be reduced to Marks and Ruins.');
    }
    if (!facetRules || typeof facetRules.resolve !== 'function') {
        throw new TypeError('Hitch evaluation requires a Facet rule registry.');
    }
    const effects = matched.length ? await Promise.all(gnarlDefinitions.map(({ facet, rule }) =>
        facetRules.resolve({
            facet, system: 'Gnarl',
            context: { proficiencyId: rule.proficiencyId, bane: hitch.bane, marks, ruins }
        })
    )) : [];
    return {
        bane: hitch.bane, marks, ruins,
        tier: facetBoon === undefined ? hitch.tier ?? null : classifyHitchTier(hitch.bane, facetBoon),
        type: {
            proficiencyId: roots[0][0], facet: rootFacet.FacetName, name: rootFacet.Hitch,
            description: rootFacet.Hitch_Text, rules: rootFacet.Hitch_Rules
        },
        triggers: triggerRecords.map((record, index) => ({ proficiencyId: triggers[index][0], record })),
        matchedTriggerIds: matched,
        triggered: matched.length > 0,
        gnarls: gnarlRules,
        effects
    };
}
