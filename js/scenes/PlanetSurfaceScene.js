import * as THREE from 'three';
import Logger from '../core/Logger.js';
import { PlanetSurfaceEnvironment } from '../rendering/PlanetSurfaceEnvironment.js';
import { Scene } from '../core/Scene.js';

/**
 * PlanetSurfaceScene
 *
 * This scene renders the procedurally generated surface of a planet.
 */
export class PlanetSurfaceScene extends Scene {
    constructor(viewManager) {
        super(viewManager);
        this.planetData = null;

        this.environment = null;
    }

    init(planetData) {
        this.planetData = planetData;
        Logger.log('PlanetSurfaceScene: init', { planetData: this.planetData });

        this.scene.background = new THREE.Color(0x1a2b34);

        // Basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Position camera
        this.activeCamera.position.set(0, 20, 50);
        this.setupControls('orbit', {
            target: new THREE.Vector3(0, 0, 0)
        });

        // Create the environment
        this.environment = new PlanetSurfaceEnvironment(this.scene, this.planetData);
        this.environment.generate();
    }

    onLoad(sceneData) {
        this.init(sceneData);
        super.onLoad();
        Logger.message("PlanetSurfaceScene loaded.");
    }

    onUnload() {
        super.onUnload();
        // Dispose of environment resources if necessary
        if (this.environment && typeof this.environment.dispose === 'function') {
            this.environment.dispose();
        }
    }
}
