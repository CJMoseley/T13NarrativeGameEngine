// d:\GoogleDrive\Games\wormholeracersJS\WormholeRacersJS\js\procgen\lore\LoreMaster.js

import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';
import { NameGenerator } from '/src/t13ne/procgen/lore/factories/NameGenerator.js';
import { MLNameGenerator } from '/src/t13ne/procgen/lore/factories/MLNameGenerator.js';
import { SpeciesGenerator } from '/src/t13ne/procgen/lore/factories/SpeciesGenerator.js';
import { TechGenerator } from '/src/t13ne/procgen/lore/factories/TechGenerator.js';
import { ScienceGenerator } from '/src/t13ne/procgen/lore/factories/ScienceGenerator.js';
import { CharacterGenerator } from '/src/t13ne/procgen/lore/factories/CharacterGenerator.js';
import { ComponentLoreGenerator } from '/src/t13ne/procgen/lore/factories/ComponentLoreGenerator.js';
import { CorporationGenerator } from '/src/t13ne/procgen/corporations/CorporationGenerator.js';
import { SystemGenerator } from '/src/t13ne/procgen/system/SystemGenerator.js';
import { SystemLoreGenerator } from '/src/t13ne/procgen/system/SystemLoreGenerator.js';
import { StellarSystemGenerator } from '/src/t13ne/procgen/system/StellarSystemGenerator.js';
import { GalacticHistory } from '/src/t13ne/procgen/galaxy/GalacticHistory.js';
import Logger from '/src/t13ne/core/Logger.js';

/**
 * LoreMaster
 * 
 * The central authority for all procedural lore generation.
 * Orchestrates the initialization and sequencing of various sub-generators.
 * Replaces and consolidates functionality from LoreGenerator and SystemLoreGenerator.
 */
export class LoreMaster {
    constructor(pluginManager) {
        const funcName = 'LoreMaster.constructor';
        Logger.start(funcName);

        this.pluginManager = pluginManager;
        this.loreData = LoreData;

        // Generators
        this.nameGenerator = null;
        this.mlNameGenerator = null;
        this.speciesGenerator = null;
        this.techGenerator = null;
        this.scienceGenerator = null;
        this.characterGenerator = null;
        this.componentLoreGenerator = null;
        this.corporationGenerator = null;
        this.systemGenerator = null;
        this.systemLoreGenerator = null;
        this.stellarSystemGenerator = null;

        this.isInitialized = false;
        this._initPromise = null;

        Logger.end(funcName);
    }

    /**
     * Initializes all lore subsystems.
     * Ensures LoreData is loaded before instantiating dependent generators.
     */
    async initialize() {
        const funcName = 'LoreMaster.initialize';
        if (this.isInitialized) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            Logger.start(funcName);

            try {
                // 1. Ensure Data is Loaded
                await this.loreData.load();

                // 2. Initialize Generators
                // NameGenerator is the standard grammar-based generator
                this.nameGenerator = new NameGenerator(this.pluginManager);

                // MLNameGenerator is the advanced TensorFlow-based generator
                this.mlNameGenerator = new MLNameGenerator();
                // We initialize it asynchronously but don't block main init on it
                this.mlNameGenerator.initialize().catch(e => {
                    Logger.warn("LoreMaster: Advanced MLNameGenerator failed to initialize. Falling back to standard.", e);
                });

                this.speciesGenerator = new SpeciesGenerator(this.pluginManager, this);

                this.techGenerator = new TechGenerator(this.pluginManager);
                await this.techGenerator.initialize();

                this.scienceGenerator = new ScienceGenerator(this.pluginManager);
                this.characterGenerator = new CharacterGenerator(this.pluginManager);
                this.componentLoreGenerator = new ComponentLoreGenerator();
                this.corporationGenerator = new CorporationGenerator();

                // SystemGenerator requires a lore generator interface. We pass 'this'.
                this.systemGenerator = new SystemGenerator(this.pluginManager, {
                    speciesGenerator: this.speciesGenerator,
                    techGenerator: this.techGenerator,
                    scienceGenerator: this.scienceGenerator,
                    corporationGenerator: this.corporationGenerator,
                    nameGenerator: this,
                    characterGenerator: this.characterGenerator
                });

                // Initialize SystemLoreGenerator with pluginManager
                this.systemLoreGenerator = new SystemLoreGenerator(this.pluginManager, this.loreData);

                // Initialize StellarSystemGenerator (Planets) here to centralize access
                this.stellarSystemGenerator = new StellarSystemGenerator(this.pluginManager, this.nameGenerator);

                this.isInitialized = true;
                Logger.message("LoreMaster: All systems initialized.");
            } catch (error) {
                Logger.error("LoreMaster: Initialization failed.", error);
                throw error;
            } finally {
                Logger.end(funcName);
            }
        })();

        return this._initPromise;
    }

    // --- Core Generation Methods ---

    async generateSystemLore(star, noiseValues, galaxyParams, nearbySpecies) {
        if (!this.isInitialized) await this.initialize();
        return await this.systemGenerator.generateSystemLore(star, noiseValues, galaxyParams, nearbySpecies);
    }

    // --- Delegation to Sub-Generators ---

    determineSpecies(star, noiseValues, galaxyParams) {
        return this.speciesGenerator.determineSpecies(star, noiseValues, galaxyParams);
    }

    async generateProceduralSpecies(noiseValues) {
        return await this.speciesGenerator.generateProceduralSpecies(noiseValues);
    }

    deriveTraitsFromHarmonics(speciesNames, loreObject) {
        return this.speciesGenerator.deriveTraitsFromHarmonics(speciesNames, loreObject);
    }

    generateScientificName(speciesKey, loreObject, noiseValues) {
        return this.speciesGenerator.generateScientificName(speciesKey, loreObject, noiseValues);
    }

    determineCorporatePresence(star, n4) {
        return this.corporationGenerator.determineCorporatePresence(star, n4);
    }

    generateComponentIdentity(corpName, usage, techLevel, shape, traits, prng) {
        return this.componentLoreGenerator.generateIdentity(corpName, usage, techLevel, shape, traits, prng);
    }

    // --- Name Generation (With Advanced Options) ---

    async generateSystemName(n1, n2, n3, nearbySpecies = []) {
        if (this.mlNameGenerator && this.mlNameGenerator.modelLoaded) {
            const result = this.mlNameGenerator.generateSystemName(n1, n2, n3);
            return [result, result, ""];
        }

        let result = await this.nameGenerator.generateSystemName(n1, n2, n3, nearbySpecies);
        if (!Array.isArray(result)) {
            result = [result, result, ""];
        }
        return result;
    }

    async generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n3, star, nearbySpecies = []) {
        if (this.mlNameGenerator && this.mlNameGenerator.modelLoaded) {
            const result = await this.mlNameGenerator.generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n3, star);
            return [result, result, ""];
        }

        let result = await this.nameGenerator.generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n3, star, nearbySpecies);
        if (!Array.isArray(result)) {
            result = [result, result, ""];
        }
        return result;
    }

    generateSyllabicName(seed, flavor) {
        return this.nameGenerator.generateSyllabicName(seed, flavor);
    }

    generateSpeciesName(speciesKey, seed) {
        return this.nameGenerator.generateSpeciesName(speciesKey, seed);
    }

    generateProceduralLatinName(seed) {
        return this.nameGenerator.generateProceduralLatinName(seed);
    }

    // --- History & Context ---

    getSystemHistoryText(star, galaxyParams, radius = 150) {
        const events = GalacticHistory.getTimeline();
        if (!events || events.length === 0) return "No galactic history has been recorded.";
        const systemPos = { x: star.x, y: star.y };
        const nearbyEvents = events.filter(event => {
            const eventPos = { x: event.x, y: event.y };
            const distance = Math.sqrt(Math.pow(systemPos.x - eventPos.x, 2) + Math.pow(systemPos.y - eventPos.y, 2));
            return distance <= radius;
        }).sort((a, b) => a.age - b.age);
        if (nearbyEvents.length === 0) return "No notable historical events have occurred in this immediate vicinity.";
        return nearbyEvents.map(event => `[${event.time.toFixed(0)} Mya] ${event.description}`).join('\n');
    }

    getSystemHistory(star, galaxyParams, radius = 150) {
        const timeline = GalacticHistory.getTimeline();
        if (!timeline || timeline.length === 0) return [];
        const systemPos = { x: star.x, y: star.y };
        const allEvents = timeline.flatMap(age => age.events.map(event => ({ ...event, age: age.age })));
        const nearbyEvents = allEvents.filter(event => {
            if (!event.position) return false;
            const distance = Math.sqrt(Math.pow(systemPos.x - event.position.x, 2) + Math.pow(systemPos.y - event.position.y, 2));
            return distance <= radius;
        }).sort((a, b) => a.time - b.time);
        return nearbyEvents;
    }
}
