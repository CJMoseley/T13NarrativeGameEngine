import Logger from '../../core/Logger.js';
import { EventBus } from '../../core/EventBus.js';

class T13NE_Tension {
    constructor() {
        this.initialized = false;
        this.tensionLevel = 0;
    }

    async initialize(t13ne) {
        this.t13ne = t13ne;
        try {
            this.tensionLevels = await CodexLoader.getData('drama', 'tensionLevels.json') || [];
        } catch (e) {
            Logger.warn("T13NE_Tension: Failed to load tensionLevels data.", e);
        }
        this.initialized = true;
        Logger.message("T13NE_Tension: Initialized.");
    }

    setPlotSuspense(level) {
        this._updateTension(level);
    }

    setSceneSuspense(level) {
        this._updateTension(level);
    }

    setActSuspense(level) {
        this._updateTension(level);
    }

    getTensionLevel() {
        return this.tensionLevel;
    }

    /**
     * Retrieves the description data for a specific tension level.
     * @param {number} level
     * @returns {object|null}
     */
    getSuspenseData(level) {
        if (!this.tensionLevels || this.tensionLevels.length === 0) return null;
        // The data is 1-indexed in the JSON (Tension_Level: 1..6)
        // But our level might be 0..11. Map it to the 6 levels.
        const normalizedLevel = Math.max(1, Math.min(6, Math.ceil(level / 2) || 1));
        return this.tensionLevels.find(l => l.Tension_Level === normalizedLevel) || this.tensionLevels[0];
    }

    _updateTension(level) {
        this.tensionLevel = Math.max(0, Math.min(11, level));
        Logger.message(`T13NE_Tension: Tension updated to ${this.tensionLevel}`);
        EventBus.emit('tension:update', { level: this.tensionLevel });
    }
}

export default new T13NE_Tension();
