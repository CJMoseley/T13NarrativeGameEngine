import CodexLoader from "/src/t13ne/modules/codex/CodexLoader.js";
import Logger from "/src/t13ne/core/Logger.js";
import T13NECardsAPI from "/src/t13ne/modules/mechanics/t13ne-cards-api.js";
import { T13Plot } from "/src/t13ne/modules/narrative/t13ne-plots.js";

/**
 * Module for handling T13NE Narrative Weaving.
 * Manages Acts, Scenes, and the weaving of Warps and Wefts.
 */
class T13NE_NarrativeWeaving {
    constructor() {
        this.actTypes = [];
        this.t13ne = null;
        this.sceneBeatTypes = [];
        this.sceneComponents = [];
        this.narrativeStructures = [];
        this.initialized = false;
    }

    /**
     * Initializes the Narrative Weaving module by loading data from the codex.
     */
    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        try {
            this.actTypes = await CodexLoader.getData('actTypes') || [];
            this.sceneBeatTypes = await CodexLoader.getData('sceneBeatTypes') || [];
            this.sceneComponents = await CodexLoader.getData('sceneComponents') || [];
            this.narrativeStructures = await CodexLoader.getData('NarrativeStructures') || [];
            this.initialized = true;
            Logger.message('T13NE_NarrativeWeaving: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_NarrativeWeaving: Initialization failed: ${error}`);
        }
    }

    /**
     * Generates a standard 3-Act structure (Frame, Loom, Zenith) for a plot.
     * @param {object} plot - The plot object.
     * @returns {object} The narrative structure.
     */
    generateStandardStructure(plot) {
        return {
            Frame: this.generateFrame(plot),
            Loom: this.generateLoom(plot),
            Zenith: this.generateZenith(plot)
        };
    }

    /**
     * Generates the Frame Act (Act I).
     * @param {object} plot 
     * @returns {object}
     */
    generateFrame(plot) {
        const frame = {
            Type: 'Frame',
            Description: 'The Frame establishes the premise and Conflict.',
            Scenes: [],
            Spread: null
        };
        
        if (T13NECardsAPI.isInitialized) {
            frame.Spread = T13NECardsAPI.getCardSpread('frame');
        }
        
        // Add Hook scenes
        frame.Scenes.push({ 
            Type: 'Hook', 
            Description: 'Inciting Incident: The Plot Hooks the Characters.',
            Spread: T13NECardsAPI.isInitialized ? T13NECardsAPI.getCardSpread('hook') : null
        });
        
        // Add Revelation scene
        frame.Scenes.push({ 
            Type: 'Revelation', 
            Description: 'Initial Revelation: Information about the Conflict is revealed.',
            Spread: T13NECardsAPI.isInitialized ? T13NECardsAPI.getCardSpread('revelation') : null
        });
        
        return frame;
    }

    /**
     * Generates the Loom Act (Act II).
     * @param {object} plot 
     * @returns {object}
     */
    generateLoom(plot) {
        const loom = {
            Type: 'Loom',
            Description: 'The Loom works the Conflict through Warps and Wefts.',
            Scenes: [],
            Spread: null
        };

        if (T13NECardsAPI.isInitialized) {
            loom.Spread = T13NECardsAPI.getCardSpread('Loom');
        }

        // A simple Loom might have 3 Warp/Weft pairs
        // In a real implementation, this might be dynamic based on plot size/rank
        const numPairs = 3; 
        for (let i = 0; i < numPairs; i++) {
            loom.Scenes.push(this.createWarpScene(plot, i + 1));
            loom.Scenes.push(this.createWeftScene(plot, i + 1));
        }

        return loom;
    }

    /**
     * Generates the Zenith Act (Act III).
     * @param {object} plot 
     * @returns {object}
     */
    generateZenith(plot) {
        const zenith = {
            Type: 'Zenith',
            Description: 'The Zenith is the culmination of the Plot.',
            Scenes: [],
            Spread: null
        };

        if (T13NECardsAPI.isInitialized) {
            zenith.Spread = T13NECardsAPI.getCardSpread('zenith');
        }

        zenith.Scenes.push({ 
            Type: 'Finale', 
            Description: 'The Final Ordeal or Confrontation.',
            Spread: T13NECardsAPI.isInitialized ? T13NECardsAPI.getCardSpread('ordeal') : null
        });
        
        zenith.Scenes.push({ 
            Type: 'Completion', 
            Description: 'Resolution of the Conflict.',
            Spread: T13NECardsAPI.isInitialized ? T13NECardsAPI.getCardSpread('gain') : null
        });

        return zenith;
    }

    /**
     * Weaves Character Arcs into the narrative structure.
     * @param {object} structure - The existing structure (Frame, Loom, Zenith).
     * @param {Array} arcs - List of Character Arcs.
     * @returns {object} The modified structure.
     */
    weaveCharacterArcs(structure, arcs) {
        if (!structure || !arcs || arcs.length === 0) return structure;

        // Distribute arc beats into the Loom primarily
        if (structure.Loom && structure.Loom.Scenes) {
            arcs.forEach((arc, index) => {
                // Interleave arc beats
                structure.Loom.Scenes.push({
                    Type: 'Character Beat',
                    Description: `Character Arc Beat: ${arc.name}`,
                    ArcId: arc.id,
                    Spread: T13NECardsAPI.isInitialized ? T13NECardsAPI.getCardSpread('scene') : null
                });
            });
        }
        return structure;
    }

    /**
     * Creates a Warp Scene structure.
     * @param {object} plot 
     * @param {number} index 
     * @returns {object}
     */
    createWarpScene(plot, index) {
        const frayComponent = this.sceneComponents.find(c => c.Type === 'The Fray');
        const snagComponent = this.sceneComponents.find(c => c.Type === 'The Snag');

        // Create sub-plots for Fray and Snag
        const frayPlot = new T13Plot({
            Name: `${plot.Name}: Fray ${index}`,
            Rank: 'Scene',
            parentPlot: plot,
            goal: frayComponent?.Description || 'Engage in conflict.',
            genre: plot.genre,
            era: plot.era
        }, this.t13ne);

        const snagPlot = new T13Plot({
            Name: `${plot.Name}: Snag ${index}`,
            Rank: 'Scene',
            parentPlot: plot,
            goal: snagComponent?.Description || 'Introduce a complication.',
            genre: plot.genre,
            era: plot.era
        }, this.t13ne);

        plot.subPlots.push(frayPlot, snagPlot);

        return {
            Type: 'Warp',
            Index: index,
            Description: `Warp ${index}: Working the Conflict.`,
            Spread: T13NECardsAPI.isInitialized ? T13NECardsAPI.getCardSpread('warp') : null,
            Components: [frayPlot, snagPlot] // Store the actual plot objects
        };
    }

    /**
     * Creates a Weft Scene structure.
     * @param {object} plot 
     * @param {number} index 
     * @returns {object}
     */
    createWeftScene(plot, index) {
        const sweepingComponent = this.sceneComponents.find(c => c.Type === 'Sweeping');

        // Create a sub-plot for Sweeping (recovery/gains)
        const sweepingPlot = new T13Plot({
            Name: `${plot.Name}: Sweeping ${index}`,
            Rank: 'Scene',
            parentPlot: plot,
            goal: sweepingComponent?.Description || 'Recover and prepare.',
            genre: plot.genre,
            era: plot.era
        }, this.t13ne);

        plot.subPlots.push(sweepingPlot);

        return {
            Type: 'Weft',
            Index: index,
            Description: `Weft ${index}: Recovering and Planning.`,
            Spread: T13NECardsAPI.isInitialized ? T13NECardsAPI.getCardSpread('weft') : null,
            Components: [sweepingPlot] // Store the plot object
        };
    }
    
    /**
     * Returns a random narrative structure from loaded data.
     * @returns {object|null}
     */
    getRandomNarrativeStructure() {
        if (!this.narrativeStructures || this.narrativeStructures.length === 0) return null;
        return this.narrativeStructures[Math.floor(Math.random() * this.narrativeStructures.length)];
    }

    /**
     * Returns the list of Scene Beat Types.
     * @returns {Array}
     */
    getSceneBeatTypes() {
        return this.sceneBeatTypes;
    }
}

export default new T13NE_NarrativeWeaving();






