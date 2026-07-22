import * as THREE from 'three';
import { Scene } from '/src/t13ne/core/Scene.js';
import T13NE_ActionSpaces from '../modules/systems/ordeals/t13ne-action-spaces.js';
import P2PNetworkManager from '/src/t13ne/core/P2PNetworkManager.js';
import { EventBus } from '/src/t13ne/core/EventBus.js';

/**
 * VTTScene
 * The unified tactical 3D scene for the T13 Narrative Engine.
 * Handles token synchronization, dice physics, and narrative-driven environmental shifts.
 */
export class VTTScene extends Scene {
    constructor(viewManager, sceneData) {
        super(viewManager, sceneData);

        this.actionSpace = null;
        this.tokens = new Map();
        this.dice = [];
        this.grid = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    async _prepare(onProgress) {
        this.scene.background = new THREE.Color(0x0f0f1a);
        this.activeCamera.position.set(0, 15, 15);
        this.activeCamera.lookAt(0, 0, 0);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7.5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // Get Ordeal from sceneData
        const ordeal = this.sceneData.ordeal;

        // Setup Action Space (Battle-board vs Theatre of the Mind)
        const mode = this.sceneData.mode || (ordeal?.rules?.vttMode) || 'arcade';
        const actionSpaceType = mode === 'turn-based' ? 'Battle-board' : 'Theatre of the Mind';

        this.actionSpace = T13NE_ActionSpaces.createActionSpace({
            type: actionSpaceType,
            name: ordeal?.type || "Generic Encounter",
            dimensions: { x: 20, y: 20, z: 0 },
            scale: 1,
        });

        this.createVisuals();
        this.setupEventListeners();

        if (ordeal && ordeal.participants) {
            ordeal.participants.forEach((participant, index) => {
                const pos = {
                    x: index * 2 - (ordeal.participants.length - 1),
                    y: 0,
                    z: 0
                };
                this.addToken(participant.id, participant.name, pos);
            });
        }
    }

    createVisuals() {
        // Grid
        this.grid = new THREE.GridHelper(20, 20, 0x444466, 0x222233);
        this.scene.add(this.grid);

        // Floor for shadows/interaction
        const planeGeo = new THREE.PlaneGeometry(100, 100);
        const planeMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.5
        });
        const floor = new THREE.Mesh(planeGeo, planeMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        floor.name = 'floor';
        this.scene.add(floor);
    }

    setupEventListeners() {
        EventBus.on('p2p:msg:TOKEN_MOVE', ({ message }) => {
            this.updateTokenPosition(message.tokenId, message.position, false);
        });

        EventBus.on('p2p:msg:DICE_ROLL', ({ message }) => {
            this.spawnDice(message.rolls, message.color);
        });

        EventBus.on('p2p:msg:PLOT_SYNC', ({ message }) => {
            this.updateNarrativeAtmosphere(message.plot);
        });
    }

    /**
     * Updates the environment based on plot tension.
     */
    updateNarrativeAtmosphere(plot) {
        if (!plot) return;
        const tension = plot.tensionLevel || 0;

        // Lerp background to deep red as tension rises
        const targetColor = new THREE.Color(0x2a0a0a);
        this.scene.background.lerp(targetColor, tension / 11);

        // Shift grid color
        if (this.grid) {
            this.grid.material.color.setHSL(0, 0.5, 0.3 + (tension / 20));
        }
    }

    addToken(id, name, pos = { x: 0, y: 0, z: 0 }, color = 0x3b82f6) {
        const group = new THREE.Group();
        group.userData.tokenId = id;
        group.userData.name = name;

        // Base/Token Mesh
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
        const material = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        group.add(mesh);

        group.position.set(pos.x, 0.05, pos.z);
        
        this.tokens.set(id, group);
        this.scene.add(group);
        return group;
    }

    updateTokenPosition(id, pos, broadcast = true) {
        let token = this.tokens.get(id);
        if (!token) return;

        token.position.set(pos.x, 0.05, pos.z);

        if (broadcast) {
            P2PNetworkManager.broadcast({
                type: 'TOKEN_MOVE',
                tokenId: id,
                position: pos
            });
        }
    }

    spawnDice(rolls, color = 0xef4444) {
        rolls.forEach((val, i) => {
            const die = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.4, 0.4),
                new THREE.MeshStandardMaterial({ color })
            );
            die.position.set(Math.random() - 0.5, 5 + i, Math.random() - 0.5);
            die.rotation.set(Math.random(), Math.random(), Math.random());
            die.userData.velocity = new THREE.Vector3(0, -0.1, 0);

            this.scene.add(die);
            this.dice.push(die);
        });
    }

    clearDice() {
        this.dice.forEach(d => this.scene.remove(d));
        this.dice = [];
    }

    update(time, delta) {
        super.update(time, delta);

        // Basic Dice Physics
        this.dice.forEach(die => {
            if (die.position.y > 0.2) {
                die.position.add(die.userData.velocity);
                die.rotation.x += 0.1;
                die.rotation.z += 0.1;
            } else {
                die.position.y = 0.2; // Floor hit
            }
        });
    }
}
