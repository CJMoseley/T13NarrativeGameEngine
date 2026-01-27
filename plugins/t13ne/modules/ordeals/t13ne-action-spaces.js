import CodexLoader from '@plugins/t13ne/modules/CodexLoader.js';
import Logger from '@plugins/t13ne/core/Logger.js';
import { ActionSpace } from './ActionSpaces/ActionSpace.js';

/**
 * Module for handling T13NE Action Spaces.
 * Manages Terrain, Motion, Firing Types, and Engagement.
 */
class T13NE_ActionSpaces {
    constructor() {
        this.actionSpaceTypes = [];
        this.terrainTypes = [];
        this.firingTypes = [];
        this.motionTypes = [];
        this.engagementTypes = [];
        this.reachActions = [];
        this.initialized = false;
    }

    /**
     * Initializes the Action Spaces module by loading data from the codex.
     */
    async initialize() {
        if (this.initialized) return;
        try {
            this.actionSpaceTypes = await CodexLoader.getData('actionSpaces') || [];
            this.terrainTypes = await CodexLoader.getData('ordealTerrain') || [];
            this.firingTypes = await CodexLoader.getData('ordealFiringType') || [];
            this.motionTypes = await CodexLoader.getData('ordealMotionType') || [];
            this.engagementTypes = await CodexLoader.getData('ordealEngagementType') || [];
            this.reachActions = await CodexLoader.getData('reachActions') || [];
            
            this.initialized = true;
            Logger.message('T13NE_ActionSpaces: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_ActionSpaces: Initialization failed: ${error}`);
        }
    }

    /**
     * Creates a new Action Space instance.
     * @param {object} config - Configuration for the Action Space.
     * @returns {ActionSpace}
     */
    createActionSpace(config) {
        return new ActionSpace(config);
    }

    /**
     * Retrieves data for a specific terrain type.
     * @param {string} name - Name of the terrain (e.g., 'Open', 'Closed').
     * @returns {object|null}
     */
    getTerrainData(name) {
        if (!this.terrainTypes) return null;
        return this.terrainTypes.find(t => t.Type.toLowerCase() === name.toLowerCase()) || null;
    }

    /**
     * Retrieves data for a specific motion type.
     * @param {string} name 
     * @returns {object|null}
     */
    getMotionData(name) {
        if (!this.motionTypes) return null;
        return this.motionTypes.find(m => m.Type.toLowerCase() === name.toLowerCase()) || null;
    }

    /**
     * Retrieves data for a specific firing type.
     * @param {string} name 
     * @returns {object|null}
     */
    getFiringData(name) {
        if (!this.firingTypes) return null;
        return this.firingTypes.find(f => f.Type.toLowerCase() === name.toLowerCase()) || null;
    }
}

// Export the class for extension (e.g. Psychosocial Spaces)
export { ActionSpace };

export default new T13NE_ActionSpaces();