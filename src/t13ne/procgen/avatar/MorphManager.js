/**
 * @module Avatar/MorphManager
 * @description Manages additive facial expressions + speech viseme blend sets on humanoids
 * and articulated mouthpart/mandible rotation on non-humanoid body plans.
 */

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : 0));
}

export class MorphManager {
    /**
     * @param {THREE.SkinnedMesh} mesh
     * @param {string} mode - 'MORPH_TARGET' or 'UV_OFFSET'
     */
    constructor(mesh, mode = 'MORPH_TARGET') {
        this.mesh = mesh;
        this.mode = mode;

        this.blendShapes = {
            eyeBlinkLeft: 0,
            eyeBlinkRight: 0,
            browDownLeft: 0,
            browDownRight: 0,
            browInnerUp: 0,
            jawOpen: 0,
            mouthPucker: 0,
            mouthFunnel: 0,
            mouthSmileLeft: 0,
            mouthSmileRight: 0,
            viseme_aa: 0,
            viseme_ee: 0,
            viseme_oh: 0,
            viseme_oo: 0,
            blink: 0,
            smile: 0,
            frown: 0
        };

        this.uvConfig = {
            eyes: { start: [0, 0.8], size: [0.1, 0.1], frames: 4 },
            mouth: { start: [0, 0.9], size: [0.1, 0.1], frames: 8 }
        };
    }

    /**
     * Updates expressions and visemes additively so smile/frown/blink combine cleanly with speech.
     */
    update(values = {}) {
        Object.assign(this.blendShapes, values);

        if (this.mode === 'MORPH_TARGET') {
            this._updateMorphTargets();
        } else {
            this._updateUVOffsets();
        }
        this._updateMandibles();
    }

    _resolvedMorphWeights() {
        const b = this.blendShapes;
        const blinkLeft = clamp(Math.max(b.eyeBlinkLeft || 0, b.blink || 0), 0, 1);
        const blinkRight = clamp(Math.max(b.eyeBlinkRight || 0, b.blink || 0), 0, 1);
        const smileDelta = clamp((b.smile || 0) - (b.frown || 0) * 0.6, -1, 1);
        const browDown = clamp(Math.max(b.browDownLeft || 0, b.frown || 0), 0, 1);

        return {
            eyeBlinkLeft: blinkLeft,
            eyeBlinkRight: blinkRight,
            browDownLeft: browDown,
            browDownRight: clamp(Math.max(b.browDownRight || 0, b.frown || 0), 0, 1),
            browInnerUp: clamp(b.browInnerUp || 0, 0, 1),
            jawOpen: clamp(b.jawOpen || 0, 0, 1),
            mouthPucker: clamp(b.mouthPucker || 0, 0, 1),
            mouthFunnel: clamp(b.mouthFunnel || 0, 0, 1),
            mouthSmileLeft: clamp((b.mouthSmileLeft || 0) + smileDelta, -1, 1),
            mouthSmileRight: clamp((b.mouthSmileRight || 0) + smileDelta, -1, 1),
            viseme_aa: clamp(b.viseme_aa || 0, 0, 1),
            viseme_ee: clamp(b.viseme_ee || 0, 0, 1),
            viseme_oh: clamp(b.viseme_oh || 0, 0, 1),
            viseme_oo: clamp(b.viseme_oo || 0, 0, 1)
        };
    }

    _updateMorphTargets() {
        if (!this.mesh?.morphTargetDictionary || !this.mesh?.morphTargetInfluences) return;
        const weights = this._resolvedMorphWeights();
        for (const [name, value] of Object.entries(weights)) {
            const index = this.mesh.morphTargetDictionary[name];
            if (index !== undefined) {
                this.mesh.morphTargetInfluences[index] = value;
            }
        }
    }

    /**
     * Drives articulated mandibles / mouthparts on insectoid/arachnid body plans from speech energy.
     */
    _updateMandibles() {
        const bones = this.mesh?.skeleton?.bones;
        if (!bones) return;
        const speechOpen = clamp(
            Math.max(
                this.blendShapes.jawOpen || 0,
                this.blendShapes.viseme_aa || 0,
                this.blendShapes.viseme_oh || 0
            ),
            0,
            1
        );
        const mandibleL = bones.find(b => b.name === 'mandible_l');
        const mandibleR = bones.find(b => b.name === 'mandible_r');
        if (mandibleL) {
            mandibleL.rotation.y = -0.45 * speechOpen;
            mandibleL.rotation.x = 0.18 * speechOpen;
        }
        if (mandibleR) {
            mandibleR.rotation.y = 0.45 * speechOpen;
            mandibleR.rotation.x = 0.18 * speechOpen;
        }
    }

    _updateUVOffsets() {
        const mouthFrame = Math.floor(clamp(this.blendShapes.jawOpen, 0, 1) * (this.uvConfig.mouth.frames - 1));
        const eyeFrame = Math.max(this.blendShapes.eyeBlinkLeft, this.blendShapes.eyeBlinkRight, this.blendShapes.blink) > 0.5 ? 1 : 0;

        if (this.mesh?.material?.uniforms) {
            this.mesh.material.uniforms.uMouthFrame = { value: mouthFrame };
            this.mesh.material.uniforms.uEyeFrame = { value: eyeFrame };
        }
    }
}
