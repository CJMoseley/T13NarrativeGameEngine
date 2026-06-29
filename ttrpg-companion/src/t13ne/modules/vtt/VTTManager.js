import Logger from "/src/t13ne/core/Logger.js";

class VTTManager {
    constructor() {
        this.activeOrdeal = null;
        this.sceneManager = null;
        this.mode = 'arcade'; // 'arcade' or 'turn-based'
        this.initialized = false;
    }

    initialize(sceneManager) {
        if (this.initialized) return;
        this.sceneManager = sceneManager;
        this.initialized = true;
        Logger.message("VTTManager: Initialized.");
    }

    startOrdeal(ordeal) {
        if (!this.sceneManager) {
            Logger.error("VTTManager: SceneManager not initialized.");
            return;
        }

        this.activeOrdeal = ordeal;
        this.mode = ordeal.rules?.vttMode || 'arcade';

        const sceneData = {
            ordeal: this.activeOrdeal,
            mode: this.mode
        };

        // Tell the SceneManager to prepare and transition to the VTTScene
        this.sceneManager.prepareScene('VTTScene', sceneData).then(scene => {
            if (scene) {
                this.sceneManager.viewManager.showScene(scene);
            }
        });
    }

    endOrdeal() {
        this.activeOrdeal = null;
        // The VTTScene should handle its own cleanup and transition away
        // Or we can tell the viewManager to show a different scene
    }

    setMode(mode) {
        if (mode !== 'arcade' && mode !== 'turn-based') {
            Logger.warn(`VTTManager: Invalid mode "${mode}".`);
            return;
        }
        this.mode = mode;
        if (this.activeOrdeal) {
            this.startOrdeal(this.activeOrdeal);
        }
    }
}

export default new VTTManager();
