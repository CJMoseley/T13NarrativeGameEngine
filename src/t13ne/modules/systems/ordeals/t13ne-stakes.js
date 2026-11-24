import CodexLoader from "/src/t13ne/modules/codex/CodexLoader.js";
import Logger from "/src/t13ne/core/Logger.js";
import { findStake, wildPoolSize } from "./t13ne-ordeal-rules.js";

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
        return findStake(this.stakesData, name);
    }

    /**
     * Gets the Round Wild Pool size for a given stake level (docs/rules/Stakes.md).
     * @param {string} name - The name of the stake.
     * @returns {number} The number of cards in the Round Wild Pool, or 0 if the stake is unknown.
     */
    getWildPoolSize(name) {
        return wildPoolSize(this.getStake(name));
    }
}

export default new T13NE_Stakes();






