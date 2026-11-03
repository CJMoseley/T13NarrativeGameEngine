function ruleKey(facet, system) {
    if (typeof facet !== 'string' || !facet.trim() || typeof system !== 'string' || !system.trim()) {
        throw new TypeError('Facet rule registration requires a Facet name and rule system.');
    }
    return `${facet.trim().toLowerCase()}\u0000${system.trim().toLowerCase()}`;
}

export function describeFacetAspect(facet, system) {
    if (!facet || typeof facet.FacetName !== 'string') {
        throw new TypeError('Facet rule resolution requires a Facet definition.');
    }
    ruleKey(facet.FacetName, system);
    const property = Object.keys(facet).find(name =>
        name.toLowerCase() === system.trim().toLowerCase());
    if (!property) throw new Error(`Facet '${facet.FacetName}' has no '${system}' rule.`);
    const value = facet[property];
    const textProperty = {
        Narrative_Moment: 'Narrative_Text',
        Resolved_Hitch: 'Resolved_Text'
    }[property] || `${property}_Text`;
    const rules = facet[textProperty] ?? value;
    if (rules === null || rules === undefined) {
        throw new Error(`Facet '${facet.FacetName}' has no description for '${property}'.`);
    }
    return {
        facet: facet.FacetName,
        system: property,
        name: typeof value === 'string' ? value : value?.Name ?? null,
        rules
    };
}

export class FacetRuleRegistry {
    #handlers = new Map();

    list(facet) {
        if (!facet || typeof facet.FacetName !== 'string') {
            throw new TypeError('Facet rule catalog requires a Facet definition.');
        }
        const structured = new Set(['Persona', 'Hitch_Rules', 'Emotion_Positive', 'Emotion_Negative', 'FacetAdjectives']);
        return Object.keys(facet)
            .filter(name => structured.has(name) || name === 'Narrative_Moment' || name === 'Resolved_Hitch' ||
                Object.hasOwn(facet, `${name}_Text`))
            .map(system => {
                const entry = this.#handlers.get(ruleKey(facet.FacetName, system));
                return {
                    ...describeFacetAspect(facet, system),
                    source: { facet: facet.FacetName, facetIndex: facet.FacetIndex, aspect: system },
                    status: entry ? 'handler-registered' : 'not-assessed',
                    inputs: entry?.inputs ? [...entry.inputs] : null,
                    dependencies: entry?.dependencies ? [...entry.dependencies] : null
                };
            });
    }

    register({ facet, system, handler, inputs = null, dependencies = null }) {
        const key = ruleKey(facet, system);
        if (typeof handler !== 'function') throw new TypeError('Facet rule handler must be a function.');
        for (const [label, values] of [['inputs', inputs], ['dependencies', dependencies]]) {
            if (values !== null && (!Array.isArray(values) ||
                values.some(value => typeof value !== 'string' || !value.trim()))) {
                throw new TypeError(`Facet rule ${label} must be an array of non-empty strings.`);
            }
        }
        if (this.#handlers.has(key)) throw new Error(`Facet rule '${facet}/${system}' is already registered.`);
        this.#handlers.set(key, {
            handler,
            inputs: inputs && [...inputs],
            dependencies: dependencies && [...dependencies]
        });
    }

    async resolve({ facet, system, context = {} }) {
        const definition = describeFacetAspect(facet, system);
        const key = ruleKey(facet.FacetName, definition.system);
        const entry = this.#handlers.get(key);
        if (!entry) {
            return { ...context, kind: 'adjudication', facet: facet.FacetName, rules: definition.rules };
        }
        const effect = await entry.handler({ facet, context, definition });
        if (!effect || typeof effect !== 'object' || Array.isArray(effect) ||
            typeof effect.kind !== 'string' || !effect.kind.trim()) {
            throw new Error(`Facet rule '${facet.FacetName}/${definition.system}' returned an invalid effect.`);
        }
        return effect;
    }
}

export function createCoreFacetRuleRegistry() {
    const registry = new FacetRuleRegistry();
    registry.register({
        facet: 'Craft',
        system: 'Gnarl',
        inputs: ['proficiencyId', 'bane', 'marks'],
        dependencies: ['Score Difficulty', 'Pip Difficulty'],
        handler: ({ context }) => ({
            kind: 'difficulty', proficiencyId: context.proficiencyId, score: context.bane, pips: context.marks
        })
    });
    registry.register({
        facet: 'Orthodox',
        system: 'Gnarl',
        inputs: ['proficiencyId', 'marks'],
        dependencies: ['Stress'],
        handler: ({ context }) => ({
            kind: 'stress', proficiencyId: context.proficiencyId, amount: context.marks
        })
    });
    registry.register({
        facet: 'Burden',
        system: 'Gnarl',
        inputs: ['proficiencyId', 'bane'],
        dependencies: ['Tao Sway'],
        handler: ({ context }) => ({
            kind: 'sway-expense', proficiencyId: context.proficiencyId, amount: context.bane, sway: 'Tao'
        })
    });
    registry.register({
        facet: 'Liberty',
        system: 'Gnarl',
        inputs: ['proficiencyId', 'bane'],
        dependencies: ['Bane Die', 'Dice Pool'],
        handler: ({ context }) => ({
            kind: 'negative-bane-die', proficiencyId: context.proficiencyId, bane: context.bane
        })
    });
    registry.register({
        facet: 'Miasma',
        system: 'Gnarl',
        inputs: ['proficiencyId', 'bane'],
        dependencies: ['Toxin Attack', 'Wounds'],
        handler: ({ context }) => ({
            kind: 'toxin-attack', proficiencyId: context.proficiencyId, basePips: context.bane / 2, unsoakable: true
        })
    });
    return registry;
}

export const coreFacetRuleRegistry = createCoreFacetRuleRegistry();
