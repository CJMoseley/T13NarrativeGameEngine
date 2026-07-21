import * as THREE from 'three';
import { Scene } from '/src/t13ne/core/Scene.js';
import T13NE_ActionSpaces from '../modules/systems/ordeals/t13ne-action-spaces.js';

export class VTTScene extends Scene {
    constructor(viewManager, sceneData) {
        super(viewManager, sceneData);

        this.actionSpace = null;
        this.entities = new Map();
    }

    async _prepare(onProgress) {
        this.scene.background = new THREE.Color(0x1a2a3a);
        this.activeCamera.position.set(0, 15, 25);
        this.activeCamera.lookAt(0, 0, 0);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x606060);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7.5);
        this.scene.add(dirLight);

        // Controls
        this.setupControls('orbit');

        // Get Ordeal from sceneData
        const ordeal = this.sceneData.ordeal;
        if (!ordeal) {
            console.error("VTTScene: No ordeal data provided.");
            return;
        }

        const actionSpaceType = this.sceneData.mode === 'turn-based' ? 'Battle-board' : 'Theatre of the Mind';

        this.actionSpace = T13NE_ActionSpaces.createActionSpace({
            type: actionSpaceType,
            name: ordeal.type,
            dimensions: { x: 50, y: 50, z: 0 },
            scale: 1,
        });

        this.createActionSpaceVisuals();

        ordeal.participants.forEach((participant, index) => {
            this.addEntity(participant, { x: index * 2 - (ordeal.participants.length - 1), y: 0, z: 0 });
        });
    }

    createActionSpaceVisuals() {
        if (this.actionSpace.type === 'Battle-board') {
            const gridSize = this.actionSpace.dimensions.x;
            const gridDivisions = this.actionSpace.dimensions.x;

            const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
            gridHelper.rotation.x = Math.PI / 2; // Rotate to be flat on the XZ plane
            this.scene.add(gridHelper);

            const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
            const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50, side: THREE.DoubleSide });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.position.y = -0.01;
            this.scene.add(plane);
        }
    }

    addEntity(entity, position) {
        this.actionSpace.addEntity(entity, position);

        const geometry = new THREE.SphereGeometry(0.4, 32, 16);
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const sphere = new THREE.Mesh(geometry, material);

        sphere.position.set(position.x, position.y + 0.4, position.z);
        
        this.entities.set(entity.id, sphere);
        this.scene.add(sphere);
    }

    update(time, delta) {
        super.update(time, delta);
        // VTT update logic will go here
    }
}
