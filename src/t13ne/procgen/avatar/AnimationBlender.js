import * as THREE from 'three';
import { CCDIKSolver } from 'three/examples/jsm/animation/CCDIKSolver.js';
import { GaitSynthesizer } from './GaitSynthesizer.js';

const BONE_MAX_RAD = Object.freeze({
    head: 0.75,
    neck: 0.45,
    spine: 0.5,
    hips: 0.4,
    arm_l: 1.4,
    arm_r: 1.4
});

function clampEulerToBounds(quat, boneName) {
    const limit = BONE_MAX_RAD[boneName] ?? 0.85;
    const euler = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
    const clampAxis = (v) => (Number.isFinite(v) ? Math.max(-limit, Math.min(limit, v)) : 0);
    euler.set(clampAxis(euler.x), clampAxis(euler.y), clampAxis(euler.z), 'XYZ');
    return new THREE.Quaternion().setFromEuler(euler);
}

/**
 * @module Avatar/AnimationBlender
 * @description Blends clips, IK, procedural gaits, and clamped live puppet rotations.
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
        this.ikGoals = [];
        this.liveData = null;

        this.state = {
            velocity: new THREE.Vector3(),
            time: 0
        };
    }

    setupIK(ikConfigs) {
        const iks = ikConfigs.map(config => ({
            target: this._getBoneIndex(config.target),
            effector: this._getBoneIndex(config.effector),
            links: config.links.map(id => ({ index: this._getBoneIndex(id) }))
        }));
        this.ikSolver = new CCDIKSolver(this.mesh, iks);
    }

    update(delta = 0.016) {
        if (this.layers.clips.active) {
            this.mixer.update(delta);
        }
        if (this.layers.gait.active) {
            this._updateGait(delta);
        }
        if (this.layers.live.active && this.liveData) {
            this._applyLiveData();
        }
        if (this.layers.ik.active && this.ikSolver) {
            this.ikSolver.update();
        }
    }

    _updateGait(delta) {
        this.state.time += delta;
        this.gaitSynthesizer.applyGait(this.bodyPlanType, this.state.velocity, this.state.time);
    }

    setLiveData(data) {
        this.liveData = data;
        this.layers.live.active = true;
        this.layers.live.weight = 1.0;
        this.layers.clips.weight = 0.2;
    }

    clearLiveData() {
        this.liveData = null;
        this.layers.live.active = false;
        this.layers.live.weight = 0.0;
        this.layers.clips.weight = 1.0;
    }

    _applyLiveData() {
        if (!this.liveData?.rotations || !this.mesh?.skeleton) return;
        for (const [boneName, rawRotation] of Object.entries(this.liveData.rotations)) {
            const bone = this.mesh.skeleton.getBoneByName(boneName);
            if (!bone || !rawRotation) continue;
            const target = rawRotation.isQuaternion
                ? rawRotation.clone()
                : new THREE.Quaternion().setFromEuler(new THREE.Euler(rawRotation.x || 0, rawRotation.y || 0, rawRotation.z || 0));
            const clamped = clampEulerToBounds(target, boneName);
            bone.quaternion.slerp(clamped, 0.5);
        }
    }

    _getBoneIndex(name) {
        return this.mesh.skeleton.bones.findIndex(b => b.name === name);
    }
}
