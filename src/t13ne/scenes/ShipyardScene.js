import * as THREE from 'three';
import Logger from '/src/t13ne/core/Logger.js';
import { Scene } from '/src/t13ne/core/Scene.js';

export class ShipyardScene extends Scene {
    constructor(viewManager) {
        super(viewManager);
        this.physics = this.gameEngine.physicsEngine;
        this.active = false;
    }

    async onLoad() {
        Logger.message("ShipyardScene: Loading...");
        this.active = true;
        
        // Setup basic environment
        this.activeCamera.position.set(8, 8, 12);
        this.activeCamera.lookAt(0, 0, 0);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        this.physics.setContext({
            scene: this.scene,
            camera: this.activeCamera,
            renderer: this.viewManager.renderer
        });

        this.setupControls('trackball', {
            rotateSpeed: 2.0,
            zoomSpeed: 1.2,
            panSpeed: 0.8
        });

        this.animate();
    }

    // animate() is handled by base Scene class

    onUnload() {
        super.onUnload();
        this.active = false;
        // Detach player ship mesh so it persists after scene unload
        const ship = this.gameEngine.playerShip;
        if (ship && ship.mesh && ship.mesh.parent === this.scene) {
            this.scene.remove(ship.mesh);
        }
    }
}