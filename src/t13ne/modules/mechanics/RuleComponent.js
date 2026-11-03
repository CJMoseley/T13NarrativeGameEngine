import { isSafeProficiencyId } from '../codex/ProficiencyIdentity.js';

export function getRuleComponentSourceStatus(source, pages, sections) {
    let text;
    if (!source.kind || source.kind === 'rule-page') {
        const page = pages.find(item => item.id === source.pageId);
        if (!page) return 'missing';
        text = page.data?.Description;
    } else if (source.kind === 'facet-section') {
        const section = sections.find(item => item.facet === source.facet && item.system === source.section);
        if (!section) return 'missing';
        text = section.rules;
        if (source.field !== undefined) {
            if (!text || typeof text !== 'object' || !Object.hasOwn(text, source.field)) return 'missing';
            text = text[source.field];
        }
    } else {
        return 'missing';
    }
    return typeof text === 'string' && text.includes(source.excerpt) ? 'matched' : 'changed';
}

export function createRuleComponentDraft(input, pages, id, sections = []) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new TypeError('Rule component must be an object.');
    }
    if (!isSafeProficiencyId(id)) throw new Error('Rule component requires a safe identifier.');
    if (typeof input.name !== 'string' || !input.name.trim() ||
        typeof input.description !== 'string' || !input.description.trim()) {
        throw new Error('Rule component requires a name and description.');
    }
    if (!['required', 'optional', 'unclassified'].includes(input.requirement)) {
        throw new Error('Rule component requires an explicit requirement classification.');
    }
    const source = input.source;
    if (!source || typeof source.excerpt !== 'string' || !source.excerpt.trim() ||
        ((!source.kind || source.kind === 'rule-page') && typeof source.pageId !== 'string') ||
        (source.kind === 'facet-section' && (typeof source.facet !== 'string' ||
            typeof source.section !== 'string' || (source.field !== undefined && typeof source.field !== 'string'))) ||
        (source.kind && !['rule-page', 'facet-section'].includes(source.kind))) {
        throw new Error('Rule component requires a source page or Facet section and an exact excerpt.');
    }
    if (!Array.isArray(pages)) throw new TypeError('Rule component requires source pages.');
    if (!Array.isArray(sections)) throw new TypeError('Rule component requires source sections.');
    if (getRuleComponentSourceStatus(source, pages, sections) !== 'matched') {
        throw new Error('Rule component source excerpt was not found in the selected page or section.');
    }
    const dependencies = input.dependencies ?? [];
    if (!Array.isArray(dependencies) || dependencies.some(value => !isSafeProficiencyId(value))) {
        throw new Error('Rule component dependencies must be safe identifiers.');
    }
    const contexts = input.contexts ?? [];
    if (!Array.isArray(contexts) || contexts.some(value =>
        typeof value !== 'string' || !value.trim() || value.length > 128)) {
        throw new Error('Rule component contexts must be non-empty strings.');
    }
    return {
        id,
        name: input.name.trim(),
        description: input.description.trim(),
        requirement: input.requirement,
        source: source.kind === 'facet-section'
            ? { kind: source.kind, facet: source.facet, section: source.section, excerpt: source.excerpt,
                ...(source.field === undefined ? {} : { field: source.field }) }
            : { ...(source.kind ? { kind: source.kind } : {}), pageId: source.pageId, excerpt: source.excerpt },
        dependencies: [...new Set(dependencies)],
        contexts: [...new Set(contexts.map(value => value.trim()))],
        revision: 1,
        status: 'draft',
        verification: 'unverified'
    };
}
