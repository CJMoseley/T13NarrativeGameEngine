import { GalacticHistory } from '/src/t13ne/procgen/galaxy/GalacticHistory.js';
import { NameGenerator as FallbackNameGenerator } from '/src/t13ne/procgen/lore/factories/NameGenerator.js';
import Logger from '/src/t13ne/core/Logger.js';
import { SpeciesGenerator } from '/src/t13ne/procgen/lore/factories/SpeciesGenerator.js';
import { TechGenerator } from '/src/t13ne/procgen/lore/factories/TechGenerator.js';
import { CorporationGenerator } from '/src/t13ne/procgen/corporations/CorporationGenerator.js';
import { SystemGenerator } from '/src/t13ne/procgen/system/SystemGenerator.js';
import { ComponentLoreGenerator } from '/src/t13ne/procgen/lore/factories/ComponentLoreGenerator.js';
import { ScienceGenerator } from '/src/t13ne/procgen/lore/factories/ScienceGenerator.js';

/**
 * Centralized module for all procedural lore generation.
 * It uses the data loaded by LoreData to generate system details.
 */
export class LoreGenerator {
    constructor(loreData, nameGenerator, pluginManager) {
        const funcName = 'LoreGenerator.constructor';
        Logger.start(funcName);
        if (!loreData || !loreData.isLoaded()) {
            throw new Error("LoreGenerator requires a fully loaded LoreData instance.");
        }

        this.pluginManager = pluginManager;

        // Validate provided nameGenerator or use fallback
        if (nameGenerator && typeof nameGenerator.generateSystemName === 'function') {
            this.nameGenerator = nameGenerator;
        } else {
            if (nameGenerator) Logger.warn("LoreGenerator: Provided nameGenerator missing generateSystemName. Using fallback.");
            this.nameGenerator = new FallbackNameGenerator(pluginManager);
        }

        this.speciesGenerator = new SpeciesGenerator(pluginManager, this.nameGenerator);
        this.techGenerator = new TechGenerator(pluginManager);
        this.scienceGenerator = new ScienceGenerator(pluginManager);
        this.corporationGenerator = new CorporationGenerator();
        this.systemGenerator = new SystemGenerator(this, pluginManager);
        this.componentLoreGenerator = new ComponentLoreGenerator();
        Logger.end(funcName);
    }

    async initialize() {
        if (this.techGenerator && typeof this.techGenerator.initialize === 'function') {
            await this.techGenerator.initialize();
        }
        // ScienceGenerator doesn't strictly need async init but good for future proofing
        // if (this.scienceGenerator.initialize) await this.scienceGenerator.initialize();
    }

    async generateSystemLore(star, noiseValues, galaxyParams, nearbySpecies) {
        const funcName = 'LoreGenerator.generateSystemLore';
        Logger.start(funcName);
        const result = await this.systemGenerator.generateSystemLore(star, noiseValues, galaxyParams, nearbySpecies);
        Logger.end(funcName);
        return result;
    }

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

    // Name Generation
    async generateSystemName(n1, n2, n3, nearbySpecies = []) {
        const funcName = 'LoreGenerator.generateSystemName';
        Logger.start(funcName);
        // Use the specific method on NameGenerator which expects noise values, not a context object
        let result = await this.nameGenerator.generateSystemName(n1, n2, n3, nearbySpecies);
        // Normalize to array format if the generator returned a simple string (Fallback generator)
        if (!Array.isArray(result)) {
            result = [result, result, ""];
        }
        Logger.end(funcName, result);
        return result;
    }

    async generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n3, star, nearbySpecies = []) {
        const funcName = 'LoreGenerator.generateHomeworldName';
        Logger.start(funcName);
        // Use the specific method on NameGenerator
        let result = await this.nameGenerator.generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n3, star, nearbySpecies);
        // Normalize to array format if the generator returned a simple string (Fallback generator)
        if (!Array.isArray(result)) {
            result = [result, result, ""];
        }
        Logger.end(funcName, result);
        return result;
    }

    // Species Generation
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

    // Corporation Generation
    determineCorporatePresence(star, n4) {
        return this.corporationGenerator.determineCorporatePresence(star, n4);
    }

    // Component Lore
    generateComponentIdentity(corpName, usage, techLevel, shape, traits, prng) {
        return this.componentLoreGenerator.generateIdentity(corpName, usage, techLevel, shape, traits, prng);
    }
}
