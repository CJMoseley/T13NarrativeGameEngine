import { GalacticTimelineGenerator } from '/src/t13ne/procgen/galaxy/GalacticTimelineGenerator.js';
import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';
import Logger from '/src/t13ne/core/Logger.js';

/**
 * Manages the galactic timeline and historical events.
 * This class is a singleton that loads and provides access to the galaxy's history.
 */
class GalacticHistoryManager {
    constructor() {
        this._timeline = null;
        this._corporations = [];
        this._activeSpecies = [];
        this._isLoaded = false;
        this.seed = 'default-seed'; // This should be set from the main game state
    }

    async load(pluginManager, loreMaster) {
        const funcName = 'GalacticHistoryManager.load';
        Logger.start(funcName);
        if (this._isLoaded) return;
        // Ensure LoreData is loaded first, as the generator depends on it.
        await LoreData.load();

        // The LoreMaster must be instantiated after LoreData is loaded.
        // We do this check here to ensure the dependency is met before GalacticTimelineGenerator uses it.
        if (!LoreData.isLoaded()) {
            throw new Error("Cannot generate galactic history because LoreData failed to load.");
        }
        try {
            // Procedurally generate the history instead of fetching a static file
            const generator = new GalacticTimelineGenerator(this.seed, pluginManager, loreMaster);
            const history = await generator.generate();
            this._timeline = history.timeline;
            this._corporations = history.corporations;
            this._activeSpecies = history.activeSpecies;
            this._isLoaded = true;
            Logger.message("Procedural galactic history generated and loaded.");
        } catch (error) {
            Logger.message(`ERROR: Failed to load galactic history: ${error}`);
            throw error;
        }
        Logger.end(funcName);
    }

    getTimeline() {
        return this._timeline;
    }

    getCorporations() {
        return this._corporations;
    }

    getActiveSpecies() {
        return this._activeSpecies;
    }

    /**
     * Finds the dominant species at a given galactic coordinate based on historical emergence.
     * @param {number} x 
     * @param {number} y 
     * @param {number} radius - Search radius (unscaled, approx ~200-500)
     * @returns {string|null} The species key or null.
     */
    getDominantSpeciesAt(x, y, radius = 400) {
        if (!this._timeline) return null;

        // Find all emergence events within the radius
        const appearances = [];
        this._timeline.forEach(age => {
            age.events.forEach(event => {
                if (event.type === 'SPECIES_EMERGENCE' && event.position) {
                    const dx = x - event.position.x;
                    const dy = y - event.position.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= radius) {
                        appearances.push({ species: event.species, dist });
                    }
                }
            });
        });

        if (appearances.length === 0) return null;

        // Sort by distance (closest species is dominant)
        appearances.sort((a, b) => a.dist - b.dist);
        return appearances[0].species.id || appearances[0].species.commonName;
    }

    setSeed(seed) {
        this.seed = seed;
    }
}

export const GalacticHistory = new GalacticHistoryManager();