import { createRuleComponentDraft, getRuleComponentSourceStatus } from './RuleComponent.js';

export class RuleCatalog {
    constructor({ facets, codex, components = null }) {
        if (!facets || typeof facets.getRuleCatalog !== 'function' || typeof facets.getFacetsArr !== 'function' ||
            !codex || typeof codex.getData !== 'function') {
            throw new TypeError('Rule catalog requires Facets and Codex providers.');
        }
        this.facets = facets;
        this.codex = codex;
        this.components = components;
    }

    async list({ registry } = {}) {
        const [aspects, facetPages, pages, components] = await Promise.all([
            this.facets.getRuleCatalog(registry),
            this.facets.getFacetsArr(),
            this.codex.getData('other', 'rules.json'),
            this.components ? this.components.listRuleComponents() : []
        ]);
        if (!Array.isArray(aspects) || !Array.isArray(facetPages) || !Array.isArray(pages) || !Array.isArray(components)) {
            throw new Error('Rule catalog could not load Facet aspects or rule pages.');
        }
        const rules = pages.map(record => {
            if (typeof record?.id !== 'string' || typeof record.data?.RulePage !== 'string' ||
                typeof record.data?.Description !== 'string') {
                throw new Error('Rule catalog encountered an invalid rule page.');
            }
            return {
                kind: 'rule-page',
                id: record.id,
                name: record.data.RulePage,
                rules: record.data.Description,
                source: { category: 'other', file: 'rules.json', id: record.id },
                status: 'not-assessed'
            };
        });
        const drafts = components.map(component => ({
            ...component, kind: 'rule-component',
            sourceStatus: getRuleComponentSourceStatus(component.source, pages, aspects)
        }));
        return [
            ...rules,
            ...facetPages.map(facet => ({
                kind: 'facet-page', name: facet.FacetName, description: facet.Description,
                source: { facet: facet.FacetName, facetIndex: facet.FacetIndex }, status: 'not-assessed'
            })),
            ...aspects.map(aspect => ({
                ...aspect, kind: 'facet-section',
                status: aspect.status === 'handler-registered' ? aspect.status : 'not-assessed'
            })),
            ...drafts
        ];
    }

    async createComponent(input) {
        if (!this.components || typeof this.components.addRuleComponent !== 'function') {
            throw new Error('Rule component storage is not configured.');
        }
        const [pages, sections] = await Promise.all([
            this.codex.getData('other', 'rules.json'),
            this.facets.getRuleCatalog()
        ]);
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        const id = `rule-component-${Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')}`;
        const draft = createRuleComponentDraft(input, pages, id, sections);
        return this.components.addRuleComponent(draft);
    }

    async updateComponent(id, changes, expectedRevision) {
        if (!this.components || typeof this.components.getRuleComponent !== 'function' ||
            typeof this.components.updateRuleComponent !== 'function') {
            throw new Error('Rule component storage does not support editing.');
        }
        if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1 ||
            !changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw new TypeError('Rule component editing requires changes and an expected revision.');
        }
        const [previous, pages, sections] = await Promise.all([
            this.components.getRuleComponent(id),
            this.codex.getData('other', 'rules.json'),
            this.facets.getRuleCatalog()
        ]);
        if (!previous || previous.revision !== expectedRevision) {
            throw new Error('Rule component is missing or has changed; reload before editing.');
        }
        const draft = createRuleComponentDraft({ ...previous, ...changes }, pages, id, sections);
        draft.revision = expectedRevision + 1;
        return this.components.updateRuleComponent(draft, expectedRevision);
    }
}
