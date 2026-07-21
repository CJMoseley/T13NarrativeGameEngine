import * as THREE from 'three';
import Logger from '/src/t13ne/core/Logger.js';
import { PlanetSurfaceEnvironment } from '/src/t13ne/procgen/planet/PlanetSurfaceEnvironment.js';
import { Scene } from '/src/t13ne/core/Scene.js';
import { Skybox } from '/src/t13ne/scenes/scenecomponents/skybox.js';

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

    async _prepare(onProgress) {
        this.init(this.sceneData);
        if (onProgress) onProgress({ status: 'Surface Ready', percent: 1.0 });
    }

    init(planetData) { // Keep init for backward compatibility if called directly
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
        this.environment = new PlanetSurfaceEnvironment(this.planetData);
    }

    /**
     * Adds a prop to the scene from an external model.
     * @param {string} modelUrl
     */
    async addProp(modelUrl) {
        if (!this.environment) return;

        const prng = this.viewManager.gameEngine.getModule('PRNG');
        const random = () => prng ? prng.nextDouble() : Math.random();

        try {
            const ModelLoader = (await import('/src/t13ne/core/ModelLoader.js')).default;
            const loader = new ModelLoader();
            const model = await loader.loadModel(modelUrl);

            // Random position on surface
            const x = (random() - 0.5) * 400;
            const z = (random() - 0.5) * 400;

            // Raycast to find the exact ground point and normal
            const raycaster = new THREE.Raycaster(
                new THREE.Vector3(x, 1000, z),
                new THREE.Vector3(0, -1, 0)
            );

            // Ensure matrix world is updated for raycasting
            this.scene.updateMatrixWorld(true);
            const intersects = raycaster.intersectObjects(this.scene.children, true);
            const groundHit = intersects.find(hit => hit.object.name === 'terrain' || hit.object.userData.isTerrain);

            if (groundHit) {
                model.position.copy(groundHit.point);
                // Align to normal
                model.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), groundHit.face.normal);
                model.rotateY(random() * Math.PI * 2);
            } else {
                // Fallback to environment height
                const y = this.environment.getTerrainHeight(x, z);
                model.position.set(x, y, z);
                model.rotation.y = random() * Math.PI * 2;
            }

            this.scene.add(model);
            Logger.message(`PlanetSurfaceScene: Added prop ${modelUrl} via raycast at ${model.position.x}, ${model.position.y}, ${model.position.z}`);
        } catch (e) {
            console.error(`PlanetSurfaceScene: Failed to add prop ${modelUrl}`, e);
        }
    }

    update(time, delta) {
        super.update(time, delta);
        if (this.skybox) this.skybox.update(time * 0.001);
    }

    onLoad(sceneData) {
        // init is now called in _prepare, but we might need to update data if it's passed here
        if (sceneData) this.init(sceneData);
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
