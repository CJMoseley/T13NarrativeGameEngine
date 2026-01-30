import * as THREE from 'three';
import { CCDIKSolver } from 'three/examples/jsm/utils/CCDIKSolver.js';
import { GaitSynthesizer } from './GaitSynthesizer.js';

/**
 * @module Avatar/AnimationBlender
 * @description Blends clips, IK, and procedural gaits.
 */
export class AnimationBlender {
    constructor(skinnedMesh, bodyPlanType = 'humanoid') {
        this.mesh = skinnedMesh;
        this.bodyPlanType = bodyPlanType;
        this.mixer = new THREE.AnimationMixer(skinnedMesh);
        this.gaitSynthesizer = new GaitSynthesizer(skinnedMesh);

        this.layers = {
            clips: { weight: 1.0, active: true },
            ik: { weight: 1.0, active: true },
            gait: { weight: 1.0, active: true },
            live: { weight: 0.0, active: false }
        };

        this.ikSolver = null;
        this.ikGoals = []; // { bone, target, effector }

        this.state = {
            velocity: new THREE.Vector3(),
            time: 0
        };
    }

    /**
     * Initializes IK solver for the avatar.
     * @param {Array<object>} ikConfigs
     */
    setupIK(ikConfigs) {
        // ikConfigs: [{ target: 'hand_l', effector: 'shoulder_l', links: [...] }]
        // Three.js CCDIKSolver expects a specific format
        const iks = ikConfigs.map(config => ({
            target: this._getBoneIndex(config.target),
            effector: this._getBoneIndex(config.effector),
            links: config.links.map(id => ({ index: this._getBoneIndex(id) }))
        }));

        this.ikSolver = new CCDIKSolver(this.mesh, iks);
    }

    /**
     * Updates all layers and blends them.
     * @param {number} delta
     */
    update(delta) {
        // 1. Layer A: Animation Clips
        if (this.layers.clips.active) {
            this.mixer.update(delta);
        }

        // 2. Layer C: Procedural Gait
        if (this.layers.gait.active) {
            this._updateGait(delta);
        }

        // 3. Layer D: Live Tracking
        if (this.layers.live.active && this.liveData) {
            this._applyLiveData();
        }

        // 4. Layer B: IK
        // IK usually runs last to adjust bones based on targets
        if (this.layers.ik.active && this.ikSolver) {
            this.ikSolver.update();
        }
    }

    /**
     * @private
     */
    _updateGait(delta) {
        this.state.time += delta;
        this.gaitSynthesizer.applyGait(this.bodyPlanType, this.state.velocity, this.state.time);
    }

    /**
     * Sets live data from VTuberBridge
     * @param {object} data
     */
    setLiveData(data) {
        this.liveData = data;
        this.layers.live.active = true;
        this.layers.live.weight = 1.0;
        // Dampen other layers when live
        this.layers.clips.weight = 0.2;
    }

    /**
     * @private
     */
    _applyLiveData() {
        if (!this.liveData) return;

        // Map rotations from liveData to bones
        for (const [boneName, rotation] of Object.entries(this.liveData.rotations)) {
            const bone = this.mesh.skeleton.getBoneByName(boneName);
            if (bone) {
                bone.quaternion.slerp(rotation, 0.5); // Smooth blend
            }
        }
    }

    _getBoneIndex(name) {
        return this.mesh.skeleton.bones.findIndex(b => b.name === name);
    }
}
