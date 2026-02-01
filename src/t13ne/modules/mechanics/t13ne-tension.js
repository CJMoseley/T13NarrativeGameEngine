import Logger from '../../core/Logger.js';
import { EventBus } from '../../core/EventBus.js';

class T13NE_Tension {
    constructor() {
        this.initialized = false;
        this.tensionLevel = 0;
    }

    async initialize(t13ne) {
        this.t13ne = t13ne;
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

    _updateTension(level) {
        this.tensionLevel = Math.max(0, Math.min(11, level));
        Logger.message(`T13NE_Tension: Tension updated to ${this.tensionLevel}`);
        EventBus.emit('tension:update', { level: this.tensionLevel });
    }
}

export default new T13NE_Tension();
