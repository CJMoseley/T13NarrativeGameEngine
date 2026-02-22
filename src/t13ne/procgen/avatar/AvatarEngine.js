import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COMPONENT_TYPES, MIXINS, TRAITS } from './BodyPlanSchema.js';

/**
 * @module Avatar/AvatarEngine
 * @description Generates SkinnedMesh and Skeleton from a BodyPlan.
 */
export class AvatarEngine {
    constructor() {
        this.boneMap = new Map();
    }

    /**
     * Generates a complete avatar.
     * @param {object} bodyPlan
     * @returns {THREE.SkinnedMesh}
     */
    generate(bodyPlan) {
        this.boneMap.clear();

        // 1. Build Skeleton
        const { bones, rootBone } = this._buildSkeleton(bodyPlan);
        const skeleton = new THREE.Skeleton(bones);

        // 2. Generate Geometry
        const geometry = this._generateGeometry(bodyPlan, bones);

        // 3. Setup Morph Targets on Geometry
        this._setupMorphTargets(geometry, bodyPlan);

        // 4. Create SkinnedMesh
        const material = new THREE.MeshToonMaterial({
            color: 0xaaaaaa
        });

        const mesh = new THREE.SkinnedMesh(geometry, material);
        mesh.add(rootBone);
        mesh.bind(skeleton);

        return mesh;
    }

    /**
     * @private
     */
    _setupMorphTargets(geometry, bodyPlan) {
        if (!geometry?.attributes?.position?.array) return;

        // Create standard ARKit/VRM morph targets as empty attributes for now
        // In a real generator, we'd deform the geometry here
        const positions = geometry.attributes.position.array;
        const morphNames = ['eyeBlinkLeft', 'eyeBlinkRight', 'jawOpen', 'mouthPucker', 'mouthFunnel'];

        geometry.morphAttributes.position = [];

        morphNames.forEach((name, i) => {
            const targetData = new Float32Array(positions.length);
            // Example: jawOpen deforms the head segment downwards
            if (name === 'jawOpen') {
                // ... subtle deformation logic could go here
            }
            geometry.morphAttributes.position.push(new THREE.Float32BufferAttribute(targetData, 3));
        });
    }

    /**
     * @private
     */
    _buildSkeleton(bodyPlan) {
        const bones = [];
        const componentMap = new Map();
        bodyPlan.components.forEach(c => componentMap.set(c.id, c));

        const createBone = (comp) => {
            const bone = new THREE.Bone();
            bone.name = comp.id;
            if (comp.pos) bone.position.fromArray(comp.pos);
            if (comp.rot) {
                if (comp.rot.length === 3) bone.rotation.fromArray(comp.rot);
                else if (comp.rot.length === 4) bone.quaternion.fromArray(comp.rot);
            }

            this.boneMap.set(comp.id, bone);
            bones.push(bone);

            if (comp.type === COMPONENT_TYPES.LIMB_CHAIN || comp.type === COMPONENT_TYPES.TAIL || comp.type === COMPONENT_TYPES.WING) {
                let lastJoint = bone;
                const jointCount = comp.joints || 3;
                const length = comp.length || 0.4;
                const direction = new THREE.Vector3(0, -length, 0); // Default down (legs)

                if (comp.mixin === MIXINS.ARM) {
                    direction.set(comp.side === 'left' ? -length : length, 0, 0);
                } else if (comp.mixin === MIXINS.TENTACLE || comp.type === COMPONENT_TYPES.TAIL) {
                    direction.set(0, 0, -length);
                } else if (comp.type === COMPONENT_TYPES.WING) {
                    direction.set(comp.side === 'left' ? -length : length, length * 0.5, 0);
                }

                for (let i = 1; i < jointCount; i++) {
                    const joint = new THREE.Bone();
                    joint.name = `${comp.id}_joint_${i}`;
                    joint.position.copy(direction);
                    lastJoint.add(joint);
                    bones.push(joint);
                    this.boneMap.set(joint.name, joint);
                    lastJoint = joint;
                }
            }

            const children = bodyPlan.components.filter(c => c.parent === comp.id);
            children.forEach(child => {
                const childBone = createBone(child);
                bone.add(childBone);
            });

            return bone;
        };

        const rootComp = bodyPlan.components.find(c => c.root);
        const rootBone = createBone(rootComp);

        return { bones, rootBone };
    }

    /**
     * @private
     */
    _generateGeometry(bodyPlan, bones) {
        const geometries = [];

        bodyPlan.components.forEach(comp => {
            const bone = this.boneMap.get(comp.id);
            if (!bone) return;

            const boneIndex = bones.indexOf(bone);

            // Create segment for the main bone
            let size = [0.1, 0.1, 0.1];
            if (comp.type === COMPONENT_TYPES.HEAD) size = [0.25, 0.25, 0.25];
            else if (comp.type === COMPONENT_TYPES.TORSO) size = [0.4, 0.5, 0.3];

            const mainGeo = new THREE.BoxGeometry(...size);
            // Move geometry so pivot is at top/center
            mainGeo.translate(0, -size[1] * 0.5, 0);
            geometries.push(this._applySkinning(mainGeo, boneIndex));

            // Add Joint Cap
            const capGeo = new THREE.SphereGeometry(Math.max(...size) * 0.3, 8, 8);
            geometries.push(this._applySkinning(capGeo, boneIndex));

            // If it has a chain, create segments for each joint
            if (comp.type === COMPONENT_TYPES.LIMB_CHAIN || comp.type === COMPONENT_TYPES.TAIL || comp.type === COMPONENT_TYPES.WING) {
                let currentBone = bone;
                while (currentBone.children.length > 0) {
                    const childBone = currentBone.children.find(c => c.name.startsWith(comp.id));
                    if (!childBone) break;

                    const childIndex = bones.indexOf(childBone);
                    const length = childBone.position.length();

                    const segGeo = new THREE.CylinderGeometry(0.05, 0.05, length, 6);
                    segGeo.rotateZ(Math.PI * 0.5); // Align with X if needed
                    // Better: align with direction to child
                    const dir = childBone.position.clone().normalize();
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
                    segGeo.applyQuaternion(quaternion);
                    segGeo.translate(childBone.position.x * 0.5, childBone.position.y * 0.5, childBone.position.z * 0.5);

                    geometries.push(this._applySkinning(segGeo, bones.indexOf(currentBone)));

                    // Cap at joint
                    const jointCap = new THREE.SphereGeometry(0.07, 8, 8);
                    jointCap.translate(childBone.position.x, childBone.position.y, childBone.position.z);
                    geometries.push(this._applySkinning(jointCap, childIndex));

                    currentBone = childBone;
                }
            }
        });

        const merged = BufferGeometryUtils.mergeGeometries(geometries);
        return merged;
    }

    /**
     * @private
     */
    _applySkinning(geo, boneIndex) {
        const count = geo.attributes.position.count;
        const indices = new Uint16Array(count * 4).fill(0);
        const weights = new Float32Array(count * 4).fill(0);
        for (let i = 0; i < count; i++) {
            indices[i * 4] = boneIndex;
            weights[i * 4] = 1.0;
        }
        geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
        geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
        return geo;
    }
}
