import * as THREE from 'three';

/**
 * @module Avatar/GaitSynthesizer
 * @description Handles procedural gaits for various body topologies.
 */
export class GaitSynthesizer {
    /**
     * @param {THREE.SkinnedMesh} mesh
     */
    constructor(mesh) {
        this.mesh = mesh;
    }

    /**
     * Updates bone rotations based on gait type and velocity.
     * @param {string} type - 'biped', 'quadruped', 'hexapod', 'centipede', 'radial'
     * @param {THREE.Vector3} velocity
     * @param {number} time
     */
    applyGait(type, velocity, time) {
        const speed = velocity.length();
        if (speed < 0.01) return;

        switch (type) {
            case 'centipede':
                this._centipedeGait(speed, time);
                break;
            case 'hexapod':
            case 'spider':
                this._tripodGait(speed, time);
                break;
            case 'radial':
                this._radialGait(speed, time);
                break;
            case 'biped':
            case 'humanoid':
                this._bipedGait(speed, time);
                break;
            default:
                this._defaultGait(speed, time);
        }
    }

    _centipedeGait(speed, time) {
        // Metachronal wave (ripple effect)
        this.mesh.skeleton.bones.forEach(bone => {
            if (bone.name.startsWith('leg_')) {
                const match = bone.name.match(/leg_(\d+)(l|r)/);
                if (match) {
                    const index = parseInt(match[1]);
                    const side = match[2];
                    const offset = index * 0.5 + (side === 'l' ? 0 : Math.PI);
                    bone.rotation.x = Math.sin(time * 5 * speed + offset) * 0.4;
                    bone.rotation.z = Math.cos(time * 5 * speed + offset) * 0.2 * (side === 'l' ? 1 : -1);
                }
            }
        });
    }

    _tripodGait(speed, time) {
        // Arachnid/Hexapod tripod gait: 3 legs move together, then the other 3
        this.mesh.skeleton.bones.forEach(bone => {
            if (bone.name.startsWith('leg_')) {
                const match = bone.name.match(/leg_(\d+)(l|r)/);
                if (match) {
                    const index = parseInt(match[1]);
                    const side = match[2];
                    // Alternating groups
                    const group = (index + (side === 'l' ? 0 : 1)) % 2;
                    const offset = group * Math.PI;
                    bone.rotation.x = Math.sin(time * 8 * speed + offset) * 0.5;
                }
            }
        });
    }

    _radialGait(speed, time) {
        // Pulsing movement
        this.mesh.skeleton.bones.forEach(bone => {
            if (bone.name.startsWith('arm_')) {
                const match = bone.name.match(/arm_(\d+)/);
                if (match) {
                    const index = parseInt(match[1]);
                    const offset = index * (Math.PI * 2 / 5);
                    bone.rotation.y = Math.sin(time * 3 * speed + offset) * 0.2;
                    bone.rotation.x = (Math.sin(time * 3 * speed) + 1) * 0.3;
                }
            }
        });
    }

    _bipedGait(speed, time) {
        this.mesh.skeleton.bones.forEach(bone => {
            if (bone.name.startsWith('leg_')) {
                const offset = bone.name.includes('l') ? 0 : Math.PI;
                bone.rotation.x = Math.sin(time * 6 * speed + offset) * 0.6;
            }
            if (bone.name.startsWith('arm_')) {
                const offset = bone.name.includes('l') ? Math.PI : 0; // Arms swing opposite to legs
                bone.rotation.x = Math.sin(time * 6 * speed + offset) * 0.4;
            }
        });
    }

    _defaultGait(speed, time) {
        this.mesh.skeleton.bones.forEach(bone => {
            if (bone.name.includes('leg') || bone.name.includes('arm')) {
                const offset = bone.name.includes('l') ? 0 : Math.PI;
                bone.rotation.x = Math.sin(time * 4 * speed + offset) * 0.3;
            }
        });
    }
}
