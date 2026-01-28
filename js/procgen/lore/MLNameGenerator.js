import { LoreData } from '@/js/procgen/lore/LoreData.js';
import Logger from '@/js/core/Logger.js';
import { EventBus } from '@/js/core/EventBus.js';

/**
 * An advanced, grammar-based procedural name generator.
 * This system uses templates and multiple word lists to create a vast number of plausible,
 * stylistically-controlled names for various entities like corporations, systems, and fields of science.
 * It is designed to be data-driven, pulling its grammars from the loaded LoreData.
 */
export class MLNameGenerator {
    constructor() {
        if (!LoreData.isLoaded()) {
            throw new Error("NameGenerator cannot be instantiated before LoreData is loaded.");
        }
        // These would be loaded from LoreData.json in a real implementation
        // For this example, we define them here to demonstrate the structure.
        this.grammars = {
            corporate: {
                templates: [
                    '{TECH_ADJ} {TECH_NOUN} {CORP_SUFFIX}',
                    '{CONCEPT_NOUN} {CORP_SUFFIX}',
                    '{GREEK_LETTER} {TECH_NOUN} {INDUSTRY}',
                    '{FOUNDER_NAME} {INDUSTRY}',
                    '{ABSTRACT_ADJ} {CONCEPT_NOUN} Solutions',
                ],
                words: {
                    TECH_ADJ: ['Quantum', 'Hyper', 'Bio', 'Nano', 'Geo', 'Astro', 'Cyber'],
                    TECH_NOUN: ['Dynamics', 'Mechanics', 'Systems', 'Logistics', 'Fabrications', 'Analytics'],
                    CORP_SUFFIX: ['Corp', 'Inc', 'Enterprises', 'Group', 'Syndicate', 'Limited'],
                    CONCEPT_NOUN: ['Aegis', 'Apex', 'Meridian', 'Zenith', 'Vanguard', 'Helios'],
                    GREEK_LETTER: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma'],
                    INDUSTRY: ['Mining', 'Refining', 'Propulsion', 'Terraforming', 'Logistics'],
                    FOUNDER_NAME: ['Wayland', 'Yutani', 'Stark', 'Tyrell', 'Rasmussen'],
                    ABSTRACT_ADJ: ['Unified', 'Global', 'Integrated', 'Advanced', 'Core']
                }
            },
            science_field: {
                templates: [
                    '{FIELD_PREFIX}-logy',
                    '{CONCEPT_NOUN} {FIELD_PREFIX}ics',
                    'Applied {TECH_ADJ} {FIELD_SUFFIX}'
                ],
                words: {
                    FIELD_PREFIX: ['Astro', 'Xeno', 'Geo', 'Chrono', 'Exo'],
                    CONCEPT_NOUN: ['Resonance', 'Hyper', 'Subspace', 'Temporal'],
                    TECH_ADJ: ['Quantum', 'Relativistic', 'Gravimetric'],
                    FIELD_SUFFIX: ['Physics', 'Mechanics', 'Dynamics']
                }
            }
        };

        // Merge loaded data from LoreData into grammars
        if (LoreData.naming) {
            Object.assign(this.grammars, LoreData.naming);
        }
        
        if (LoreData.corporations && LoreData.corporations.ARCHETYPES) {
            this.grammars.CORPORATIONS = LoreData.corporations.ARCHETYPES.map(c => c.name);
        }
    }

    /**
     * A placeholder for any async initialization. For this grammar-based system,
     * initialization is synchronous as it relies on pre-loaded LoreData.
     * @returns {Promise<void>}
     */
    async initialize() {
        Logger.message("Advanced Name Generator: Initialized.");
        return Promise.resolve();
    }

    /**
     * Generates a name based on a specified grammar.
     * @param {string} grammarKey - The key for the grammar to use (e.g., 'corporate').
     * @param {number} n1 - A noise value (0-1) for template selection.
     * @param {number} n2 - A noise value (0-1) for word selection.
     * @param {number} n3 - A noise value (0-1) for further word selection.
     * @returns {string} The generated name.
     */
    generateSystemName(n1, n2, n3) {
        const grammar = this.grammars.corporate; // Using 'corporate' as an example for system names
        const template = grammar.templates[Math.floor(n1 * grammar.templates.length)];

        // Replace placeholders like {TECH_NOUN} with words from the lists
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            const wordList = grammar.words[key];
            if (!wordList) return match; // Return the placeholder if the key is invalid
            // Use different noise values to select different words
            const salt = key.length; // Simple way to vary the index based on the placeholder
            const index = Math.floor(((n2 * 1000 + n3 * 100 + salt) % 1) * wordList.length);
            return wordList[index];
        });
    }

    /**
     * Generates a name based on a specified grammar key and seed.
     * @param {string} grammarKey - The key for the grammar to use (e.g., 'TECHNOLOGY').
     * @param {number} seed - A random seed (0-1).
     * @returns {string} The generated name.
     */
    generate(grammarKey, seed) {
        const grammar = this.grammars[grammarKey];
        if (!grammar) {
            console.warn(`MLNameGenerator: Grammar '${grammarKey}' not found.`);
            return "Unknown Tech";
        }

        // Simple pseudo-random values derived from seed
        const n1 = seed;
        const n2 = (seed * 100) % 1;
        const n3 = (seed * 1000) % 1;

        const template = grammar.templates[Math.floor(n1 * grammar.templates.length)];

        // Replace placeholders
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            // Handle numeric randoms like {RANDOM_10}
            if (key.startsWith('RANDOM_')) {
                const max = parseInt(key.split('_')[1], 10) || 10;
                return Math.floor(n2 * max);
            }

            const wordListKey = grammar.words ? grammar.words[key] : key;
            const wordList = this.grammars[wordListKey];
            
            if (!wordList || !Array.isArray(wordList)) return match;
            
            const salt = key.length;
            const index = Math.floor(((n2 * 1000 + n3 * 100 + salt) % 1) * wordList.length);
            return wordList[index];
        });
    }
}