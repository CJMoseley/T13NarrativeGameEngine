import * as THREE from 'three';
import { Scene } from '../core/Scene.js';
import T13NE_ActionSpaces from '../modules/systems/ordeals/t13ne-action-spaces.js';
import { VTTBoardController } from '../modules/vtt/VTTBoardController.js';
import { buildVttToken, disposeVttToken } from '../modules/vtt/VTTTokenBuilder.js';

export class VTTScene extends Scene {
    constructor(viewManager, sceneData = {}) {
        super(viewManager, sceneData);

        this.actionSpace = null;
        this.entities = new Map();
        this.boardController = null;
    }

    async _prepare() {
        this.scene.background = new THREE.Color(0x0f172a);

        // Dynamic lighting (MeshLambertMaterial compatible)
        const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x334155, 1.3);
        this.scene.add(hemiLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
        dirLight.position.set(6, 12, 8);
        this.scene.add(dirLight);

        this.boardController = new VTTBoardController({
            scene: this.scene,
            aspect: (typeof window !== 'undefined' && window.innerHeight) ? window.innerWidth / window.innerHeight : 1.6
        });

        this.addCamera('3d-orbit', this.boardController.perspectiveCamera);
        this.addCamera('2d-topdown', this.boardController.orthoCamera);
        this.setActiveCamera('3d-orbit');
        this.setupControls('orbit');

        const ordeal = this.sceneData.ordeal;
        if (!ordeal) {
            console.warn('VTTScene: No ordeal data provided; initialized empty board.');
            return;
        }

        const actionSpaceType = this.sceneData.mode === 'turn-based' ? 'Battle-board' : 'Theatre of the Mind';
        this.actionSpace = T13NE_ActionSpaces.createActionSpace({
            type: actionSpaceType,
            name: ordeal.type,
            dimensions: { x: 24, y: 24, z: 0 },
            scale: 1
        });

        this.boardController.configureBoard({
            width: 24,
            height: 24,
            gridType: actionSpaceType === 'Battle-board' ? 'square' : 'none',
            gridSize: 1,
            snapEnabled: true
        });

        const participants = Array.isArray(ordeal.participants) ? ordeal.participants : [];
        for (let index = 0; index < participants.length; index++) {
            const participant = participants[index];
            await this.addEntity(participant, { x: index * 2 - (participants.length - 1), y: 0, z: 0 });
        }
    }

    setViewMode(mode) {
        if (!this.boardController) return;
        const cam = this.boardController.setViewMode(mode);
        if (mode === '2d-topdown') {
            this.setActiveCamera('2d-topdown');
        } else {
            this.setActiveCamera('3d-orbit');
        }
        return cam;
    }

    async addEntity(entity, position) {
        if (this.actionSpace) {
            this.actionSpace.addEntity(entity, position);
        }
        const tokenGroup = await buildVttToken({
            id: entity.id ?? entity.name ?? `entity-${this.entities.size + 1}`,
            name: entity.name ?? entity.id ?? 'Token',
            tokenType: entity.descendantType ? 'prop' : 'character',
            allegiance: entity.allegiance ?? 'ally',
            incarna: entity.incarna ?? 'Nature',
            position
        }, { character: entity });

        this.entities.set(entity.id, tokenGroup);
        this.scene.add(tokenGroup);
        this.boardController?.registerTokenObject(entity.id, tokenGroup);
        return tokenGroup;
    }

    dispose() {
        for (const tokenGroup of this.entities.values()) {
            this.scene.remove(tokenGroup);
            disposeVttToken(tokenGroup);
        }
        this.entities.clear();
        this.boardController?.dispose();
    }

    update(time, delta) {
        super.update(time, delta);
    }
}
