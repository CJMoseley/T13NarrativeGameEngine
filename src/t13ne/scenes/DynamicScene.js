import * as THREE from 'three';
import { Scene } from '/src/t13ne/core/Scene.js';
import Logger from '/src/t13ne/core/Logger.js';

/**
 * DynamicScene
 * A scene that can be built and modified by the Referee using components.
 */
export class DynamicScene extends Scene {
    constructor(viewManager, sceneData) {
        super(viewManager, sceneData);
        this.components = new Map();
        this.narrativeBeats = sceneData.beats || [];
        this.currentBeatIndex = -1;
    }

    async prepare(onProgress) {
        Logger.message(`DynamicScene: Preparing with ${this.sceneData.components?.length || 0} components.`);

        const componentDefs = this.sceneData.components || [];
        const Referee = this.viewManager.engine.getModule('Referee');

        if (!Referee || !Referee.sceneDirector) {
            Logger.warn("DynamicScene: Referee or SceneDirector not found.");
            return;
        }

        for (let i = 0; i < componentDefs.length; i++) {
            const def = componentDefs[i];
            const component = await Referee.sceneDirector.createComponent(def);
            if (component) {
                await component.prepare(this.scene, { scene: this });
                this.components.set(component.id, component);
            }
            if (onProgress) onProgress(i / componentDefs.length);
        }

        if (onProgress) onProgress(1.0);
    }

    onLoad() {
        super.onLoad();
        this.components.forEach(c => c.onLoad(this.scene, { scene: this }));

        if (this.narrativeBeats.length > 0) {
            this.nextBeat();
        }
    }

    update(time, delta) {
        super.update(time, delta);
        this.components.forEach(c => c.update(time, delta));
    }

    nextBeat() {
        this.currentBeatIndex++;
        if (this.currentBeatIndex < this.narrativeBeats.length) {
            const beat = this.narrativeBeats[this.currentBeatIndex];
            this.playBeat(beat);
        } else {
            Logger.message("DynamicScene: All beats complete.");
            // Optional: notify Referee
        }
    }

    async playBeat(beat) {
        Logger.message(`DynamicScene: Playing beat: ${beat.type}`);

        // Handle beat logic (Camera, Dialogue, SFX)
        if (beat.type === 'camera') {
            // ... implement camera move
        } else if (beat.type === 'dialogue') {
            // ... show dialogue UI
        }

        if (beat.duration) {
            setTimeout(() => this.nextBeat(), beat.duration);
        }
    }

    onUnload() {
        super.onUnload();
        this.components.forEach(c => c.dispose());
        this.components.clear();
    }
}
