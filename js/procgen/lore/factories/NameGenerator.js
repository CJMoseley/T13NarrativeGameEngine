import { LoreData } from '../LoreData.js';
import Logger from '../../../core/Logger.js';

export class NameGenerator {
    constructor(pluginManager) {
        if (!LoreData.isLoaded()) {
            throw new Error("NameGenerator cannot be instantiated before LoreData is loaded.");
        }
        // PRNG will be created on-demand for each seeded request
        this.pluginManager = pluginManager;
    }

    /**
     * The core name generation engine. It takes a grammar key and a seed,
     * then uses the corresponding grammar from LoreData to construct a name.
     * @param {string} grammarKey - The key for the grammar to use (e.g., 'SYSTEM_NAMES').
     * @param {number|string} seed - A seed for the PRNG to ensure deterministic generation.
     * @returns {string} The generated name.
     */
    generate(grammarKey, seed) {
        let prng;
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13NE_PRNG = T13NE?.getModule('PRNG');
        if (T13NE_PRNG) {
            prng = T13NE_PRNG.create(seed);
        } else {
            prng = { nextDouble: () => Math.random() }; // Fallback
        }
        const grammar = LoreData.naming[grammarKey];

        if (!grammar || !grammar.templates || !grammar.words) {
            Logger.message(`ERROR: Grammar not found or malformed for key: ${grammarKey}`);
            return `Undefined-Name-${Math.floor(prng.nextDouble() * 1000)}`;
        }

        if (grammar.templates.length === 0) {
            Logger.warn(`NameGenerator: No templates found for key: ${grammarKey}`);
            return `Undefined-Template-${Math.floor(prng.nextDouble() * 1000)}`;
        }

        let templateIndex = Math.floor(prng.nextDouble() * grammar.templates.length);
        if (templateIndex >= grammar.templates.length) templateIndex = grammar.templates.length - 1;
        const template = grammar.templates[templateIndex];

        if (!template) {
            Logger.warn(`NameGenerator: Template undefined for key: ${grammarKey} at index ${templateIndex}`);
            return `Broken-Template-${Math.floor(prng.nextDouble() * 1000)}`;
        }

        // Replace placeholders like {PREFIX} with words from the lists
        let name = template.replace(/\{(\w+)\}/g, (match, key) => {
            const wordList = grammar.words[key];
            if (!wordList) return match; // Return the placeholder if the key is invalid

            const list = LoreData.naming[wordList] || [];
            if (list.length === 0) {
                Logger.message(`WARN: Word list not found or empty for key: ${wordList}`);
                return `[${wordList}]`;
            }
            let wordIndex = Math.floor(prng.nextDouble() * list.length);
            if (wordIndex >= list.length) wordIndex = list.length - 1;
            return list[wordIndex];
        });

        // Handle procedural number suffixes (e.g., "-{RANDOM_100}")
        name = name.replace(/\{RANDOM_(\d+)\}/g, (match, max) => {
            return Math.floor(prng.nextDouble() * parseInt(max, 10));
        });

        return this._capitalize(name);
    }

    _capitalize(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    // --- Specific Name Generation Methods ---

    generateProceduralLatinName(seed) {
        // Check if the grammar exists
        if (LoreData.naming['PROCEDURAL_LATIN_NAMES']) {
            return this.generate('PROCEDURAL_LATIN_NAMES', seed);
        }

        // Fallback: Construct from prefixes/suffixes if available
        const prefixes = LoreData.naming.LATIN_PREFIXES;
        const suffixes = LoreData.naming.LATIN_SUFFIXES;

        if (prefixes && suffixes) {
            let prng;
            const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
            const T13NE_PRNG = T13NE?.getModule('PRNG');
            prng = T13NE_PRNG ? T13NE_PRNG.create(seed) : { nextDouble: () => Math.random() };

            let prefixIndex = Math.floor(prng.nextDouble() * prefixes.length);
            if (prefixIndex >= prefixes.length) prefixIndex = prefixes.length - 1;
            const prefix = prefixes[prefixIndex];

            let suffixIndex = Math.floor(prng.nextDouble() * suffixes.length);
            if (suffixIndex >= suffixes.length) suffixIndex = suffixes.length - 1;
            const suffix = suffixes[suffixIndex];
            return this._capitalize(`${prefix} ${suffix}`);
        }

        return this.generate('PROCEDURAL_LATIN_NAMES', seed);
    }

    generateAlienName(seed) {
        // Check if the specific grammar exists
        if (LoreData.naming && LoreData.naming['ALIEN_NAMES']) {
            return this.generate('ALIEN_NAMES', seed);
        }

        // Fallback: Construct from prefixes/suffixes/joiners if available
        const prefixes = LoreData.naming.ALIEN_PREFIX || ['Xen'];
        const suffixes = LoreData.naming.ALIEN_SUFFIX || ['o'];
        const joiners = LoreData.naming.ALIEN_JOINERS || ['-'];

        let prng;
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13NE_PRNG = T13NE?.getModule('PRNG');
        prng = T13NE_PRNG ? T13NE_PRNG.create(seed) : { nextDouble: () => Math.random() };

        const prefix = prefixes[Math.floor(prng.nextDouble() * prefixes.length)];
        const suffix = suffixes[Math.floor(prng.nextDouble() * suffixes.length)];
        const joiner = joiners[Math.floor(prng.nextDouble() * joiners.length)];

        return this._capitalize(`${prefix}${joiner}${suffix}`);
    }

    generateSpeciesName(speciesKey, seed) {
        // This can be expanded with more complex, species-specific grammar keys
        switch (speciesKey) {
            case 'Progenitor':
            default:
                return this.generateAlienName(seed);
        }
    }

    async generateSystemName(n1, n2, n3) {
        // The noise values are used as a seed. We combine them for a more unique seed.
        const seed = `${n1}-${n2}-${n3}`;
        return this.generate('SYSTEM_NAMES', seed);
    }

    async generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n3, star) {
        const seed = `${systemName}-${speciesName}-${n3}`;
        let prng;
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13NE_PRNG = T13NE?.getModule('PRNG');
        if (T13NE_PRNG) {
            prng = T13NE_PRNG.create(seed);
        } else {
            prng = { nextDouble: () => Math.random() };
        }

        if (speciesKey === 'FirstRelic') return 'The Silent Relic';
        if (techLevelKey === 'T0') return `${speciesName.split('(')[0].trim().split(' ')[0]} Home`;

        // Descriptive naming based on star properties
        if (star && star.isYoung && prng.nextDouble() > 0.8) {
            const grammarKey = 'FIERY_PLANET_NAMES';
            const name = this.generate(grammarKey, seed + "-fiery");
            return name;
        }

        // Default to a generic planet name grammar
        const genericName = this.generate('PLANET_NAMES', seed + "-generic");

        // Occasionally prepend the species name for variety
        if (prng.nextDouble() > 0.6) {
            const speciesRoot = speciesName.split('(')[0].trim().split(' ')[0];
            return `${speciesRoot} ${genericName}`;
        }

        return genericName;
    }
}
