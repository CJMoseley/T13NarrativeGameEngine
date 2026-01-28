import * as THREE from 'three';
import Logger from '@plugins/t13ne/core/Logger.js';
import { Scene } from '@plugins/t13ne/core/Scene.js';

/**
 * TestPlaneScene
 *
 * A simple, flat, infinite plane for testing ship movement and physics.
 */
export class TestPlaneScene extends Scene {
    constructor(viewManager) {
        super(viewManager);

        this.init();
    }

    init() {
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);

        // Infinite plane
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000),
            new THREE.MeshStandardMaterial({ color: 0xcccccc }) // Lighter grey
        );
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);

        // Render the player's ship
        this.renderShip();

        // Position camera to look at the ship
        this.activeCamera.position.set(0, 5, 10);
        this.setupControls('orbit', {
            target: new THREE.Vector3(0, 0, 0)
        });

        Logger.message("TestPlaneScene initialized.");
    }

    onLoad() {
        super.onLoad();
        Logger.message("TestPlaneScene loaded.");
    }

    onUnload() {
        super.onUnload();
        Logger.message("TestPlaneScene unloaded.");
    }

    addMeshForComponent(componentData) {
        const component = componentData.component;
        const position = componentData.position;
        //const rotation = componentData.rotation; // todo: apply rotation
        let geometry, material, mesh;
        material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });

        // Use component name to determine placeholder shape
        if (component.name.includes('chassis')) {
            geometry = new THREE.BoxGeometry(2, 1, 2);
        } else if (component.name.includes('engine')) {
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
        } else if (component.name.includes('generator')) {
            geometry = new THREE.SphereGeometry(0.75, 32, 32);
        } else {
            geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        return mesh;
    }

    renderShip() {
        const shipContainer = new THREE.Group();
        this.viewManager.playerShip.components.forEach(componentData => {
            const mesh = this.addMeshForComponent(componentData);
            shipContainer.add(mesh);
        });
        this.scene.add(shipContainer);
    }

}
