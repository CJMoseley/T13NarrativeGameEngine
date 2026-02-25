import Logger from './Logger.js';

/**
 * CacheManager
 * Handles persistent storage for generated procedural content.
 */
class CacheManager {
    constructor() {
        this.cacheKey = 'T13NE_GENERATION_CACHE';
        this.data = this._loadFromStorage();
    }

    /**
     * Returns the default empty cache state.
     * @private
     */
    _getDefaultState() {
        return {
            systems: {},
            planets: {},
            ships: {},
            characters: {},
            epic: []
        };
    }

    /**
     * Loads the cache from localStorage.
     * @private
     */
    _loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.cacheKey);
            return stored ? JSON.parse(stored) : this._getDefaultState();
        } catch (e) {
            Logger.warn("CacheManager: Failed to load from localStorage. Starting with empty cache.");
            return this._getDefaultState();
        }
    }

    /**
     * Saves the current cache to localStorage.
     * @private
     */
    _saveToStorage() {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(this.data));
        } catch (e) {
            Logger.error("CacheManager: Failed to save to localStorage.", e);
        }
    }

    /**
     * Stores a generated entity in the cache.
     * @param {string} category - systems, planets, ships, characters.
     * @param {string} id - Unique identifier for the entity (e.g., seed or coords).
     * @param {object} content - The generated data.
     */
    store(category, id, content) {
        if (!this.data[category]) {
            this.data[category] = {};
        }
        this.data[category][id] = content;
        this._saveToStorage();
    }

    /**
     * Retrieves an entity from the cache.
     * @param {string} category
     * @param {string} id
     * @returns {object|null}
     */
    get(category, id) {
        return (this.data[category] && this.data[category][id]) ? this.data[category][id] : null;
    }

    /**
     * Adds a slice to the Galactic Epic.
     * @param {object} slice
     */
    addEpicSlice(slice) {
        this.data.epic.push({
            timestamp: Date.now(),
            ...slice
        });
        this._saveToStorage();
    }

    /**
     * Returns the full Galactic Epic.
     * @returns {Array}
     */
    getEpic() {
        return this.data.epic;
    }

    /**
     * Clears the cache.
     */
    clear() {
        this.data = this._getDefaultState();
        this._saveToStorage();
    }
}

export default new CacheManager();
