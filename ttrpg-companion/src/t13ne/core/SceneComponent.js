import * as THREE from 'three';
import Logger from './Logger.js';

/**
 * Base class for all scene components.
 * Components are the building blocks used by the Referee to construct scenes.
 */
export class SceneComponent {
    constructor(data = {}) {
        this.data = data;
        this.id = data.id || Math.random().toString(36).substring(7);
        this.type = data.type || 'generic';
        this.ready = false;
        this.mesh = null;
    }

    /**
     * Asynchronous preparation (loading assets, etc.)
     * @param {THREE.Scene} threeScene
     * @param {object} context
     */
    async prepare(threeScene, context = {}) {
        this.ready = true;
    }

    /**
     * Called when the scene is loaded.
     * @param {THREE.Scene} threeScene
     * @param {object} context
     */
    onLoad(threeScene, context = {}) {
        if (this.mesh) {
            threeScene.add(this.mesh);
        }
    }

    /**
     * Per-frame update.
     * @param {number} time
     * @param {number} delta
     */
    update(time, delta) {}

    /**
     * Cleanup resources.
     */
    dispose() {
        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
    }
}
