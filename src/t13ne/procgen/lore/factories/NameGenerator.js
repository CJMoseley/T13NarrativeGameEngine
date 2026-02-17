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

        let rand = prng.nextDouble();
        if (typeof rand !== 'number' || isNaN(rand) || rand < 0 || rand >= 1) {
            rand = Math.random();
        }

        let templateIndex = Math.floor(rand * grammar.templates.length);
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
            
            let wRand = prng.nextDouble();
            if (typeof wRand !== 'number' || isNaN(wRand) || wRand < 0 || wRand >= 1) {
                wRand = Math.random();
            }
            
            let wordIndex = Math.floor(wRand * list.length);
            if (wordIndex >= list.length) wordIndex = list.length - 1;
            return list[wordIndex];
        });

        // Handle procedural number suffixes (e.g., "-{RANDOM_100}")
        name = name.replace(/\{RANDOM_(\d+)\}/g, (match, max) => {
            let nRand = prng.nextDouble();
            if (typeof nRand !== 'number' || isNaN(nRand) || nRand < 0 || nRand >= 1) {
                nRand = Math.random();
            }
            return Math.floor(nRand * parseInt(max, 10));
        });

        const finalName = this._capitalize(name);
        if (this._isBanned(finalName)) {
             return this.generate(grammarKey, seed + "_retry");
        }
        return finalName;
    }

    /**
     * Generates a name using syllabic construction for infinite variety.
     * @param {string|number} seed - Seed for deterministic generation.
     * @param {string} flavor - 'alien', 'ancient', 'harsh', 'soft', 'tech'.
     * @returns {string} The generated name.
     */
    generateSyllabicName(seed, flavor = 'alien') {
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13NE_PRNG = T13NE?.getModule('PRNG');

        const sylls = {
            alien: {
                start: ['Kr', 'X', 'Z', 'Q', 'V', 'Th', 'Ph', 'Ch', 'J', 'K', 'Zh', 'G', 'Xy', 'Qu'],
                mid: ['a', 'e', 'i', 'o', 'u', 'y', 'aa', 'ae', 'uo', 'oa', 'ee', 'ai', 'ou'],
                end: ['x', 'z', 'k', 'r', 'n', 'th', 's', 'v', 'g', 'sh', 'ng', 'qs']
            },
            ancient: {
                start: ['An', 'Bel', 'Cyr', 'Dor', 'El', 'Fa', 'Gil', 'Hel', 'In', 'Jur', 'Kal', 'Lor', 'Mer', 'Nyl'],
                mid: ['a', 'e', 'i', 'o', 'u', 'ia', 'io', 'iu', 'ae', 'eo'],
                end: ['us', 'um', 'is', 'a', 'os', 'or', 'on', 'as', 'es', 'ax']
            },
            harsh: {
                start: ['Kr', 'Gr', 'Tr', 'Br', 'Dr', 'K', 'G', 'T', 'D', 'P', 'V', 'R', 'Str', 'Vl'],
                mid: ['a', 'o', 'u', 'ar', 'or', 'ur', 'ir', 'ok', 'uk'],
                end: ['k', 'g', 't', 'd', 'p', 'rk', 'rg', 'rd', 'kt', 'gn', 'ch']
            },
            soft: {
                start: ['L', 'S', 'F', 'H', 'V', 'W', 'M', 'N', 'Th', 'Sh', 'El', 'Al', 'Si'],
                mid: ['a', 'e', 'i', 'o', 'u', 'ea', 'ia', 'ai', 'ei', 'ie', 'ae'],
                end: ['l', 's', 'n', 'm', 'th', 'h', 'r', 'ss', 'll', 'sh']
            }
        };

        const set = sylls[flavor] || sylls.alien;
        
        let name = '';
        let attempts = 0;
        
        while (attempts < 10) {
            let currentSeed = seed;
            if (attempts > 0) currentSeed = `${seed}_${attempts}`;
            
            let prng;
            if (T13NE_PRNG) {
                prng = T13NE_PRNG.create(currentSeed);
            } else {
                prng = { nextDouble: () => Math.random() };
            }

            let rand = prng.nextDouble();
            if (typeof rand !== 'number' || isNaN(rand) || rand < 0 || rand >= 1) {
                rand = Math.random();
            }
            
            let length = 2 + Math.floor(rand * 4); // 2-5 syllables
            if (length > 13) length = 13;
            name = '';
            
            for (let i = 0; i < length; i++) {
                const getRand = () => {
                    let r = prng.nextDouble();
                    return (typeof r !== 'number' || isNaN(r) || r < 0 || r >= 1) ? Math.random() : r;
                };
                const s = set.start[Math.floor(getRand() * set.start.length)];
                const m = set.mid[Math.floor(getRand() * set.mid.length)];
                name += s + m;
                
                if (getRand() > (i === length - 1 ? 0.2 : 0.8)) {
                    const e = set.end[Math.floor(getRand() * set.end.length)];
                    name += e;
                }
            }
            
            if (!this._isBanned(name)) return this._capitalize(name.toLowerCase());
            attempts++;
        }
        
        return this._capitalize(name.toLowerCase());
    }

    _capitalize(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    _isBanned(name) {
        const lower = name.toLowerCase();
        const banned = ['femme', 'homme', 'sex', 'xxx'];
        return banned.includes(lower);
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

    generateEarthLocation(seed) {
        // Try to use specific grammar if available, otherwise fallback to Latin/Generic
        if (LoreData.naming['EARTH_LOCATIONS']) {
            return this.generate('EARTH_LOCATIONS', seed);
        }
        // Fallback list
        const locations = ["Nova Scotia", "Albion", "Columbia", "Victoria", "Arcadia", "Britannia", "Gallia", "Hibernia", "Caledonia", "Cambria", "Alexandria", "Carolina", "Georgia", "Virginia", "Maryland", "Pennsylvania", "York", "Jersey", "Hampshire", "London", "Paris", "Berlin", "Rome", "Athens", "Sparta", "Troy", "Carthage", "Memphis", "Thebes", "Babylon"];
        const prng = this.pluginManager?.getApi('T13', 'T13NE')?.getModule('PRNG')?.create(seed) || { nextDouble: () => Math.random() };
        const base = locations[Math.floor(prng.nextDouble() * locations.length)];
        
        // Add suffix occasionally
        if (prng.nextDouble() > 0.7) {
            const suffixes = ["IV", "Prime", "Secundus", "Major", "Minor", "Colony"];
            return `${base} ${suffixes[Math.floor(prng.nextDouble() * suffixes.length)]}`;
        }
        return base;
    }

    generateFounderName(seed) {
        // Use generic human names or specific founder list
        const prng = this.pluginManager?.getApi('T13', 'T13NE')?.getModule('PRNG')?.create(seed) || { nextDouble: () => Math.random() };
        const names = ["Drake", "Hudson", "Carter", "Franklin", "Vega", "Thorne", "Bishop", "Mercer", "Vance", "Halloway", "Brand", "Ross", "Finch", "Cross", "Stark"];
        const name = names[Math.floor(prng.nextDouble() * names.length)];
        
        const suffixType = prng.nextDouble();
        if (suffixType < 0.4) return `${name}'s World`;
        if (suffixType < 0.7) return `${name}'s Landing`;
        if (suffixType < 0.9) return `${name}'s Hope`;
        return `${name}'s Folly`; // Irony
    }

    generateDescriptiveName(seed) {
        if (LoreData.naming['DESCRIPTIVE_PLANET_NAMES']) {
            return this.generate('DESCRIPTIVE_PLANET_NAMES', seed);
        }
        const names = ["Red Rock", "Emerald", "Sapphire", "Onyx", "Dust", "Rust", "Ice", "Frost", "Magma", "Cinder", "Verdant", "Azure", "Midnight", "Twilight", "Dawn", "Horizon", "Reach", "Haven", "Sanctuary", "Paradise", "Eden", "Hell", "Inferno", "Abyss", "Void"];
        const prng = this.pluginManager?.getApi('T13', 'T13NE')?.getModule('PRNG')?.create(seed) || { nextDouble: () => Math.random() };
        return names[Math.floor(prng.nextDouble() * names.length)];
    }

    generateAlienName(seed) {
        Logger.message(`NameGenerator: generateAlienName called with seed ${seed}`);
        let prng;
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13NE_PRNG = T13NE?.getModule('PRNG');
        prng = T13NE_PRNG ? T13NE_PRNG.create(seed) : { nextDouble: () => Math.random() };

        // Check if the specific grammar exists
        // 50% chance to use grammar if available, otherwise use syllabic for variety
        if (LoreData.naming && LoreData.naming['ALIEN_NAMES'] && prng.nextDouble() > 0.5) {
            Logger.message(`NameGenerator: Using ALIEN_NAMES grammar`);
            return this.generate('ALIEN_NAMES', seed);
        }

        // Fallback to infinite syllabic generation
        Logger.message(`NameGenerator: Using syllabic generation`);
        return this.generateSyllabicName(seed, 'alien');
    }

    generateSpeciesName(speciesKey, seed) {
        // This can be expanded with more complex, species-specific grammar keys
        switch (speciesKey) {
            case 'Progenitor':
            default:
                return this.generateAlienName(seed);
        }
    }

    async generateSystemName(n1, n2, n3, nearbySpecies = []) {
        // The noise values are used as a seed. We combine them for a more unique seed.
        const seed = `${n1}-${n2}-${n3}`;
        const prng = this.pluginManager?.getApi('T13', 'T13NE')?.getModule('PRNG')?.create(seed) || { nextDouble: () => Math.random() };

        // 50% chance to use syllabic generation for unique system names
        if (prng.nextDouble() < 0.5) {
            let flavor = 'alien';
            if (nearbySpecies && nearbySpecies.length > 0) {
                const sp = nearbySpecies[0].toLowerCase();
                if (sp.includes('draco') || sp.includes('orc')) flavor = 'harsh';
                else if (sp.includes('elf') || sp.includes('asari')) flavor = 'soft';
                else if (sp.includes('ancient')) flavor = 'ancient';
            } else {
                const flavors = ['alien', 'ancient', 'harsh', 'soft'];
                flavor = flavors[Math.floor(prng.nextDouble() * flavors.length)];
            }
            return this.generateSyllabicName(seed, flavor);
        }

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
        
        // Ensure alien species get alien homeworld names
        const isHuman = speciesKey === 'SPECIES_HUMANS' || speciesKey === 'Humans';
        if (!isHuman) {
            return this.generateAlienName(seed + "-homeworld");
        }

        if (techLevelKey === 'T0') return `${speciesName.split('(')[0].trim().split(' ')[0]} Home`;

        // Descriptive naming based on star properties
        if (star && star.isYoung && prng.nextDouble() > 0.8) {
            const grammarKey = 'FIERY_PLANET_NAMES';
            const name = this.generate(grammarKey, seed + "-fiery");
            return name;
        }

        // Default to a generic planet name grammar
        const genericName = this.generate('PLANET_NAMES', seed + "-generic");

        return genericName;
    }
}
