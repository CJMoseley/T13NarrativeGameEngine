import * as THREE from 'three';
import Logger from '@/src/t13ne/core/Logger.js';
import { PlanetSurfaceEnvironment } from '@/src/t13ne/procgen/planet/PlanetSurfaceEnvironment.js';
import { Scene } from '@/src/t13ne/core/Scene.js';
import { Skybox } from '@/src/t13ne/scenes/scenecomponents/skybox.js';

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
        this.skybox = null;
    }

    init(planetData) {
        this.planetData = planetData;
        Logger.log('PlanetSurfaceScene: init', { planetData: this.planetData });

        this.scene.background = new THREE.Color(0x1a2b34);

        // Basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(500, 1000, 750); // Moved further out for skybox calc
        this.scene.add(directionalLight);

        // Position camera
        this.activeCamera.position.set(0, 20, 50);
        this.setupControls('orbit', {
            target: new THREE.Vector3(0, 0, 0)
        });

        // Create Skybox if system data is available
        if (this.planetData && this.planetData.system && this.planetData.system.star) {
            this.skybox = new Skybox(this.viewManager.gameEngine);
            // Use Atmospheric Skybox for surface
            this.skybox.createAtmosphericSkybox(
                this.scene, 
                this.planetData, 
                this.planetData.system.star, 
                directionalLight.position, 
                5000
            );
        }

        // Create the environment
        this.environment = new PlanetSurfaceEnvironment(this.scene, this.planetData);
        this.environment.generate();
    }

    update(time, delta) {
        super.update(time, delta);
        if (this.skybox) this.skybox.update(time * 0.001);
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
