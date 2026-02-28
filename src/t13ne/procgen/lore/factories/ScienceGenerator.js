import { LoreData } from '../LoreData.js';
import Logger from '../../../core/Logger.js';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';

//This Generator should create scientific (latinised) names for Therios, Dracos, Trans-humans, aliens and even plants. 
// It should do this froma large array of latin names and recombine them.

// it should also be able to name branches of science and technology in some futuristic bolting togather of terms kind of way "Tachyon waveguides", "Ultra-dense Alloy"
// "Photonic Accelerator", "Agentic Shielding", "Phased Polymers", "Nano-alloy", "Quantum Resonator" or whatever. This will have to be integrated with the Proficiency system and Hyperphysics engine as well as the Narrative Engine.
export class ScienceGenerator {
    constructor(pluginManager) {
        const funcName = 'ScienceGenerator.constructor';
        Logger.start(funcName);
        if (!LoreData.isLoaded()) {
            throw new Error("NameGenerator cannot be instantiated before LoreData is loaded.");
        }
        this.pluginManager = pluginManager;
        Logger.end(funcName);
    }

    /**
     * Generates a technobabble term based on a tech level and optional seed.
     * Uses T13NE Proficiencies if available to create grounded terms.
     */
    async generateTechnobabble(techLevel, seed) {
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const Threads = T13NE?.getModule('Threads');
        
        if (Threads) {
            // Use T13NE Threads to find relevant proficiencies
            // We map techLevel (1-10+) to T13 Eras or Scopes if possible, or just pick random high-tech sounding ones
            const era = techLevel > 5 ? 'Future' : 'Modern';
            const profs = await Threads.findProficiencies({ era: era });
            
            if (profs && profs.length > 0) {
                // Pick two proficiencies deterministically if seed provided
                const rng = seed ? ProcGen.createPRNG(seed) : ProcGen.createPRNG(`tech-${techLevel}`);
                const p1 = profs[Math.floor(rng.nextDouble() * profs.length)];
                const p2 = profs[Math.floor(rng.nextDouble() * profs.length)];
                
                // Combine parts of their names or facets
                // E.g. "Quantum" + "Mechanics" -> "Quantum Mechanics"
                // Or "Gossamer" + "Craft" -> "Aetheric Engineering" (using Facet adjectives)
                
                return `${p1.name.split(' ')[0]} ${p2.name.split(' ').pop()}`;
            }
        }

        // Fallback to simple list
        const prefixes = ["Quantum", "Hyper", "Nano", "Bio", "Cyber", "Astro", "Void", "Flux", "Chrono", "Meta"];
        const suffixes = ["Dynamics", "Physics", "Mechanics", "Synthesis", "Engineering", "Optics", "Harmonics", "Resonance"];

        const rng = ProcGen.createPRNG(seed || `tech-babble-${techLevel}`);
        
        return `${prefixes[Math.floor(rng.nextDouble() * prefixes.length)]} ${suffixes[Math.floor(rng.nextDouble() * suffixes.length)]}`;
    }

    generateProceduralLatinName(n1, n2) {
        const funcName = 'ScienceGenerator.generateProceduralLatinName';
        Logger.start(funcName);
        n1 = Math.abs(n1) % 1;
        n2 = Math.abs(n2) % 1;
        const prefixes = LoreData.naming.LATIN_PREFIXES;
        const suffixes = LoreData.naming.LATIN_SUFFIXES;
        const prefix = prefixes[Math.floor(n1 * prefixes.length)];
        const suffix = suffixes[Math.floor(n2 * suffixes.length)];
        const result = `${prefix} ${suffix}`;
        Logger.end(funcName, result);
        return result;
    }

    generateAlienName(n1, n2, n3) {
        const funcName = 'ScienceGenerator.generateAlienName';
        Logger.start(funcName);
        n1 = Math.abs(n1) % 1;
        n2 = Math.abs(n2) % 1;
        n3 = Math.abs(n3) % 1;
        const prefixes = LoreData.naming.ALIEN_PREFIX;
        const suffixes = LoreData.naming.ALIEN_SUFFIX;
        const joiners = LoreData.naming.ALIEN_JOINERS;

        const prefix = prefixes[Math.floor(n1 * prefixes.length)];
        const suffix = suffixes[Math.floor(n2 * suffixes.length)];
        const joiner = joiners[Math.floor(n3 * joiners.length)];

        const result = `${prefix}${joiner}${suffix}`;
        Logger.end(funcName, result);
        return result;
    }

    generateSpeciesName(speciesKey, noiseValues) {
        const funcName = 'ScienceGenerator.generateSpeciesName';
        Logger.start(funcName);
        const { n1, n2, n3 } = noiseValues;

        // TODO: Add more complex, species-specific naming conventions here.
        switch (speciesKey) {
            case 'Progenitor':
            default:
                const result = this.generateAlienName(n1, n2, n3);
                Logger.end(funcName, result);
                return result;
        }
    }

    generateSystemName(n1, n2, n3) {
        const funcName = 'ScienceGenerator.generateSystemName';
        Logger.start(funcName);
        n1 = Math.abs(n1) % 1;
        n2 = Math.abs(n2) % 1;
        n3 = Math.abs(n3) % 1;
        const prefixes = LoreData.naming.SYSTEM_NAME_PREFIXES;
        const suffixes = LoreData.naming.SYSTEM_NAME_SUFFIXES;
        const prefix = prefixes[Math.floor(n1 * prefixes.length)];
        const suffix = suffixes[Math.floor(n2 * suffixes.length)];
        let result = prefix + suffix;
        if (n3 > 0.9) result = `${prefix}${suffix}-${Math.floor(n3 * 100)}`;
        Logger.end(funcName, result);
        return result;
    }

    generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n, star) {
        const funcName = 'ScienceGenerator.generateHomeworldName';
        Logger.start(funcName);
        if (speciesKey === 'FirstRelic') {
            Logger.end(funcName, 'The Silent Relic');
            return 'The Silent Relic';
        }
        if (techLevelKey === 'T0') {
            const result = `${speciesName.split('(')[0].trim().split(' ')[0]} Home`;
            Logger.end(funcName, result);
            return result;
        }

        // Descriptive naming based on planetary temperature (simulated by noise 'n' as distance factor)
        n = Math.abs(n) % 1;
        // Hot/Fiery (Close to star)
        if (n > 0.8) {
            const fieryAdjectives = LoreData.naming.FIERY_PREFIX || ["Fire", "Flame", "Forge", "Inferno", "Cinder"];
            const fieryNouns = LoreData.naming.FIERY_SUFFIX || ["Heart", "Brand", "Fall", "Reach", "Point"];
            const result = `${fieryAdjectives[Math.floor(n * 100) % fieryAdjectives.length]}'s ${fieryNouns[Math.floor(n * 1000) % fieryNouns.length]}`;
            Logger.end(funcName, result);
            return result;
        }

        // Cold/Icy (Far from star)
        if (n < 0.2) {
            const coldAdjectives = LoreData.naming.KATHORRI_CRYOGENIC_PREFIX || ["Ice", "Frost", "Rime", "Winter", "Crystal"];
            const coldNouns = LoreData.naming.KATHORRI_FLUIDIC_SUFFIX || ["Reach", "Point", "Hold", "Deep", "Veil"];
            const result = `${coldAdjectives[Math.floor(n * 100) % coldAdjectives.length]}'s ${coldNouns[Math.floor(n * 1000) % coldNouns.length]}`;
            Logger.end(funcName, result);
            return result;
        }

        const systemRoot = systemName.substring(0, 3);
        const speciesRoot = speciesName.split('(')[0].trim().split(' ')[0];
        const planetPrefixes = LoreData.naming.PLANET_NAME_PREFIXES;
        const planetSuffixes = LoreData.naming.PLANET_NAME_SUFFIXES;
        const templates = LoreData.naming.PLANET_NAME_TEMPLATES;

        const template = templates[Math.floor(n * templates.length)];
        const prefix = planetPrefixes[Math.floor(n * 100) % planetPrefixes.length];
        const suffix = planetSuffixes[Math.floor(n * 1000) % planetSuffixes.length];

        let result = template
            .replace('{PREFIX}', prefix)
            .replace('{SUFFIX}', suffix)
            .replace('{SPECIES}', speciesRoot);
            
        // Fix grammar for possessives (e.g. Drones's -> Drones')
        result = result.replace(/s's/g, "s'");
        
        Logger.end(funcName, result);
        return result;
    }
}
