import * as THREE from 'three';

/**
 * @module Avatar/MorphManager
 * @description Manages facial expressions via Morph Targets or UV Offset shifting.
 */
export class MorphManager {
    /**
     * @param {THREE.SkinnedMesh} mesh
     * @param {string} mode - 'MORPH_TARGET' or 'UV_OFFSET'
     */
    constructor(mesh, mode = 'MORPH_TARGET') {
        this.mesh = mesh;
        this.mode = mode;

        // standard VRM/ARKit blend shapes
        this.blendShapes = {
            eyeBlinkLeft: 0,
            eyeBlinkRight: 0,
            jawOpen: 0,
            mouthPucker: 0,
            mouthFunnel: 0
        };

        this.uvConfig = {
            eyes: { start: [0, 0.8], size: [0.1, 0.1], frames: 4 },
            mouth: { start: [0, 0.9], size: [0.1, 0.1], frames: 8 }
        };
    }

    /**
     * Updates expressions based on blend shape values.
     * @param {object} values
     */
    update(values) {
        Object.assign(this.blendShapes, values);

        if (this.mode === 'MORPH_TARGET') {
            this._updateMorphTargets();
        } else {
            this._updateUVOffsets();
        }
    }

    /**
     * @private
     */
    _updateMorphTargets() {
        if (!this.mesh.morphTargetDictionary) return;

        for (const [name, value] of Object.entries(this.blendShapes)) {
            const index = this.mesh.morphTargetDictionary[name];
            if (index !== undefined) {
                this.mesh.morphTargetInfluences[index] = value;
            }
        }
    }

    /**
     * @private
     */
    _updateUVOffsets() {
        // This requires a custom shader or a dynamic texture update
        // For simplicity, we can manipulate the UV attribute if it's not too heavy,
        // but better to use a shader uniform.

        const mouthFrame = Math.floor(this.blendShapes.jawOpen * (this.uvConfig.mouth.frames - 1));
        const eyeFrame = Math.max(this.blendShapes.eyeBlinkLeft, this.blendShapes.eyeBlinkRight) > 0.5 ? 1 : 0;

        // Dispatch event or update uniforms for the material
        if (this.mesh.material.uniforms) {
            this.mesh.material.uniforms.uMouthFrame = { value: mouthFrame };
            this.mesh.material.uniforms.uEyeFrame = { value: eyeFrame };
        }
    }
}
