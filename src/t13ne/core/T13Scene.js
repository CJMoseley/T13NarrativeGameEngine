import * as THREE from 'three';
import { Scene } from './Scene.js';
import Logger from './Logger.js';

/**
 * T13Scene
 * Extends the base Scene to support unified 3D and 2D rendering targets.
 * This is the primary scene class for the T13NE Engine.
 */
export class T13Scene extends Scene {
    constructor(viewManager, sceneData = {}) {
        super(viewManager, sceneData);

        this.renderMode = sceneData.renderMode || '3d'; // '3d', '2d', or 'dual'
        this.location = sceneData.location || null; // T13 Location Entity

        // 2D Layer (SVG)
        this.twoDContainer = null;
        this.svg = null;

        if (this.renderMode === '2d' || this.renderMode === 'dual') {
            this.init2DLayer();
        }
    }

    /**
     * Initializes the 2D SVG layer for the scene.
     */
    init2DLayer() {
        this.twoDContainer = document.createElement('div');
        this.twoDContainer.id = `t13-scene-2d-${Date.now()}`;
        Object.assign(this.twoDContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '5'
        });
        document.body.appendChild(this.twoDContainer);

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "100%");
        this.svg.style.pointerEvents = 'none';
        this.twoDContainer.appendChild(this.svg);

        Logger.message("T13Scene: 2D Layer initialized.");
    }

    /**
     * Called by ViewManager when scene is loaded.
     */
    onLoad() {
        super.onLoad();
        if (this.twoDContainer) {
            this.twoDContainer.style.display = 'block';
        }
    }

    /**
     * Called by ViewManager when scene is unloaded.
     */
    onUnload() {
        super.onUnload();
        if (this.twoDContainer) {
            this.twoDContainer.style.display = 'none';
        }
    }

    /**
     * Main update loop.
     */
    update(time, delta) {
        super.update(time, delta);
        if (this.renderMode === '2d' || this.renderMode === 'dual') {
            this.update2D(time, delta);
        }
    }

    /**
     * Update loop for 2D elements.
     */
    update2D(time, delta) {
        // Subclasses override this to update SVG elements
    }

    /**
     * Dispose of resources.
     */
    dispose() {
        super.dispose();
        if (this.twoDContainer && this.twoDContainer.parentNode) {
            this.twoDContainer.parentNode.removeChild(this.twoDContainer);
        }
    }

    /**
     * Helper to project 3D coordinates to 2D screen space.
     * @param {THREE.Vector3} position - 3D world position.
     * @returns {object} {x, y} in pixels.
     */
    projectTo2D(position) {
        if (!this.activeCamera) return { x: 0, y: 0 };

        const vector = position.clone();
        vector.project(this.activeCamera);

        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: (-(vector.y * 0.5) + 0.5) * window.innerHeight
        };
    }
}
