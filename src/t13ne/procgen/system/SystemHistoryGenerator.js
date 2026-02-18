import Logger from '/src/t13ne/core/Logger.js';
import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';

/**
 * Generates a localized history for a specific star system,
 * influenced by the broader galactic timeline.
 */
export class SystemHistoryGenerator {
    constructor(system, galacticHistory, seed, pluginManager) {
        this.system = system;
        this.galacticHistory = galacticHistory;
        const T13NE = pluginManager?.getApi('T13', 'T13NE');
        const T13NE_PRNG = T13NE?.getModule('PRNG');
        if (T13NE_PRNG) {
            this.prng = T13NE_PRNG.create(seed);
        } else {
            this.prng = { nextDouble: () => Math.random() };
        }
        this.loreData = LoreData; // Assuming LoreData is loaded and available
    }

    /**
     * Generates the full history and population data for the system.
     * @returns {object} An object containing the system's history and population makeup.
     */
    generate() {
        const funcName = 'SystemHistoryGenerator.generate';
        Logger.start(funcName);

        const systemHistory = {
            events: [],
            population: {},
        };

        // This is a placeholder for the more complex logic to come.
        // For now, it will just assign the primary species.
        systemHistory.population[this.system.primarySpecies] = {
            percentage: 100,
            description: "The dominant, native species of the system."
        };

        Logger.message(`Generated basic history for system ${this.system.name}.`);

        Logger.end(funcName);
        return systemHistory;
    }
}
