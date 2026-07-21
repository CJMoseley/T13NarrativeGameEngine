import CodexLoader from "/src/t13ne/modules/codex/CodexLoader.js";
import Logger from "/src/t13ne/core/Logger.js";

/**
 * Module for handling T13NE Stakes.
 * Manages Stakes Levels and their effects on Ordeals.
 */
class T13NE_Stakes {
    constructor() {
        this.stakesData = [];
        this.initialized = false;
    }

    /**
     * Initializes the Stakes module by loading data from the codex.
     */
    async initialize() {
        if (this.initialized) return;
        try {
            this.stakesData = await CodexLoader.getData('stakes') || [];
            this.initialized = true;
            Logger.message('T13NE_Stakes: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_Stakes: Initialization failed: ${error}`);
        }
    }

    /**
     * Retrieves data for a specific stake level.
     * @param {string} name - The name of the stake (e.g., 'Low', 'High').
     * @returns {object|null} The stake data object.
     */
    getStake(name) {
        if (!this.stakesData || this.stakesData.length === 0) return null;
        // Case-insensitive search
        return this.stakesData.find(s => (s.Level && s.Level.toLowerCase() === name.toLowerCase()) || (s.Name && s.Name.toLowerCase() === name.toLowerCase())) || null;
    }

    /**
     * Gets the Wild Pool size for a given stake level.
     * @param {string} name - The name of the stake.
     * @returns {number} The size of the Wild Pool.
     */
    getWildPoolSize(name) {
        const stake = this.getStake(name);
        return stake ? (parseInt(stake.Wild_Pool) || 0) : 0;
    }

    /**
     * Gets the cost multiplier for a given stake level.
     * @param {string} name 
     * @returns {number}
     */
    getCostMultiplier(name) {
        const stake = this.getStake(name);
        return stake ? (parseFloat(stake.Cost_Multiplier) || 1) : 1;
    }
}

export default new T13NE_Stakes();






