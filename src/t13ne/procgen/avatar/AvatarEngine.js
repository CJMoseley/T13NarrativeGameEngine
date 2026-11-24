import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COMPONENT_TYPES, MIXINS, TRAITS, BODY_PLANS } from './BodyPlanSchema.js';
import ModelLoader from '../../core/ModelLoader.js';
import { hashSeed, mulberry32 } from './avatarRandom.js';
import { AvatarAtlas, CLOTH_PATTERNS, mapUVsToRegion, paintAtlas, createAtlasTexture, ATLAS_SIZE } from './AvatarAtlas.js';
import { bodyFromFacets } from './AvatarFacetBody.js';

// Face morphs are region-based deltas on head vertices, shared by every body plan.
const FACE_MORPHS = ['eyeBlinkLeft', 'eyeBlinkRight', 'browDownLeft', 'browDownRight', 'browInnerUp', 'jawOpen', 'mouthPucker', 'mouthFunnel', 'mouthSmileLeft', 'mouthSmileRight'];
const LIMB_TYPES = [COMPONENT_TYPES.LIMB_CHAIN, COMPONENT_TYPES.TAIL, COMPONENT_TYPES.WING];
const BEND_ANGLE = 0.6;   // radians at full morph weight
const BEND_RAMP = 0.08;   // distance over which a part's own geometry starts to bend

const clamp01 = (t) => Math.min(Math.max(t, 0), 1);

export const PROSTHETIC_TYPES = { ANTENNAE: 'antennae', HORNS: 'horns' };
export const SKIN_TONES = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c3a1e, 0xffdbac];
export const HAIR_COLORS = [0x1a1210, 0x3b2a1a, 0x6b4a2b, 0xb8862b, 0xd9c28a, 0x8a2b1a, 0x9a9a9a, 0xe8e8e8];
export const CLOTH_COLOURS = [0x3d5a80, 0x7a2e2e, 0x4a4e3a, 0x6b4f2a, 0x2f4f4f, 0x5b3a6e, 0x8a7d5a, 0x2b2b33, 0xa45a2a, 0x355e3b];
const DARK_TONE = 0x2a211c;   // eyes, mouth, brows, hooves and horns
const DEFAULT_SKIN = SKIN_TONES[1];
const DEFAULT_CLOTHING = {
    top: { colour: 0x3d5a80, pattern: 'plain' },
    bottom: { colour: 0x2b2b33, pattern: 'stripe' }
};
const DEFAULT_VARIANT = { height: 1, build: 1, musculature: 0, litheness: 0, skinTone: DEFAULT_SKIN, hairColor: HAIR_COLORS[1], prosthetics: [], clothing: DEFAULT_CLOTHING };

// Primitive fallbacks for components without a box spec. Boxes hang below their pivot.
const LEGACY_SPECS = {
    [COMPONENT_TYPES.TORSO]: { size: [0.4, 0.5, 0.3], center: [0, -0.25, 0] },
    [COMPONENT_TYPES.HEAD]: { size: [0.25, 0.25, 0.25], center: [0, -0.125, 0] }
};
const DEFAULT_SPEC = { size: [0.1, 0.1, 0.1], center: [0, -0.05, 0] };

/**
 * Builds a deterministic humanoid variant from a seed string.
 * Appearance (skin, hair, clothing) always comes from the seed. Body (height, build, musculature, litheness)
 * comes from the character's Facets when they are supplied, otherwise from the seed.
 * Seeded draws are appended in order, so older seeds keep the same values.
 * @param {string} seed
 * @param {object} [options]
 * @param {string[]} [options.prosthetics] - Values from PROSTHETIC_TYPES.
 * @param {Object<number, number>} [options.facetBoons] - Boon keyed by FacetIndex, see facetBoonsFromStats.
 * @returns {{height: number, build: number, musculature: number, litheness: number, skinTone: number, hairColor: number, prosthetics: string[], clothing: object}}
 */
export function makeHumanoidVariant(seed, { prosthetics = [], facetBoons = null } = {}) {
    const rand = mulberry32(hashSeed(String(seed)));
    const range = (lo, hi) => lo + (hi - lo) * rand();
    const pick = (list) => list[Math.floor(rand() * list.length)];
    const seededHeight = range(0.9, 1.1);
    const seededBuild = range(0.85, 1.2);
    const skinTone = pick(SKIN_TONES);
    const hairColor = pick(HAIR_COLORS);
    const clothing = {
        top: { colour: pick(CLOTH_COLOURS), pattern: pick(CLOTH_PATTERNS) },
        bottom: { colour: pick(CLOTH_COLOURS), pattern: pick(CLOTH_PATTERNS) }
    };
    const seededMusculature = range(-1, 1);
    const seededLitheness = range(-1, 1);

    const fromFacets = facetBoons ? bodyFromFacets(facetBoons) : null;
    return {
        height: fromFacets ? fromFacets.height : seededHeight,
        build: fromFacets ? fromFacets.build : seededBuild,
        musculature: fromFacets ? fromFacets.musculature : seededMusculature,
        litheness: fromFacets ? fromFacets.litheness : seededLitheness,
        skinTone,
        hairColor,
        prosthetics,
        clothing
    };
}

/**
 * @module Avatar/AvatarEngine
 * @description Generates SkinnedMesh and Skeleton from a BodyPlan, or loads pre-rigged models.
 */
export class AvatarEngine {
    constructor() {
        this.boneMap = new Map();
        this.chains = new Map();
        this.headTop = 0;
        this.modelLoader = new ModelLoader();
        this.variant = { ...DEFAULT_VARIANT };
    }

    /**
     * Generates a complete avatar, either by loading a model or by procedural generation.
     * @param {object} bodyPlan - The body plan defining the avatar's structure.
     * @param {object} [options]
     * @param {'fbx'|'procedural'} [options.style='procedural'] - 'fbx' loads the humanoid FBX rig instead.
     * @param {object} [options.variant] - Per-character variation, see makeHumanoidVariant.
     * @returns {Promise<THREE.SkinnedMesh|THREE.Group>} A promise that resolves with the avatar object.
     */
    async generate(bodyPlan, options = {}) {
        if (options.style === 'fbx' && bodyPlan && bodyPlan.name === 'Humanoid') {
            return this.loadHumanoidAvatar();
        }
        return this.generateProceduralAvatar(bodyPlan, options.variant);
    }

    /**
     * Loads the specific rigged FBX model for humanoid characters.
     * @returns {Promise<THREE.Group>} A promise that resolves with the loaded and configured model.
     */
    async loadHumanoidAvatar() {
        const fbxPath = '/data/models/minecraft-rig/source/RunningboyRig.fbx';
        try {
            const avatar = await this.modelLoader.loadModel(fbxPath);
            
            // Lit per-vertex (Gouraud-style) material, so the PS1-era look keeps dynamic lighting.
            const litMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });

            avatar.traverse((child) => {
                if (child.isMesh || child.isSkinnedMesh) {
                    child.material = litMaterial;
                    // Ensure shadows are cast and received if needed
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            return avatar;
        } catch (error) {
            console.error('Failed to load humanoid avatar, falling back to procedural generation.', error);
            // Fallback to a simple procedural humanoid if the FBX fails to load
            return this.generateProceduralAvatar(BODY_PLANS.HUMANOID);
        }
    }

    /**
     * Generates a procedural avatar from a body plan.
     * @param {object} bodyPlan
     * @param {object} [variant] - Build, height, skin tone and prosthetics. Defaults to a plain body.
     * @returns {THREE.SkinnedMesh}
     */
    generateProceduralAvatar(bodyPlan, variant = {}) {
        this.boneMap.clear();
        this.chains.clear();
        this.headTop = 0;
        this.variant = { ...DEFAULT_VARIANT, ...variant };

        // 1. Build Skeleton
        const { bones, rootBone } = this._buildSkeleton(bodyPlan);
        const skeleton = new THREE.Skeleton(bones);
        // Geometry is baked into bind-pose world space, so bone world matrices must be current.
        rootBone.updateMatrixWorld(true);

        // 2. Generate Geometry
        const geometry = this._generateGeometry(bodyPlan, bones);

        // 3. Setup Morph Targets on Geometry
        const morphNames = this._setupMorphTargets(geometry, bodyPlan, bones);

        // 4. Create SkinnedMesh
        // Colours are per-vertex (skin, dark, hair), so the material base is white.
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true });

        const mesh = new THREE.SkinnedMesh(geometry, material);
        mesh.add(rootBone);
        mesh.updateMatrixWorld(true);
        mesh.bind(skeleton);

        mesh.morphTargetDictionary = Object.fromEntries(morphNames.map((name, i) => [name, i]));
        mesh.morphTargetInfluences = new Array(morphNames.length).fill(0);

        return mesh;
    }

    /**
     * @private
     */
    _setupMorphTargets(geometry, bodyPlan, bones) {
        const headComp = bodyPlan.components.find(c => c.type === COMPONENT_TYPES.HEAD);
        const headBone = headComp ? this.boneMap.get(headComp.id) : null;
        const headIndex = headBone ? bones.indexOf(headBone) : -1;
        const headOrigin = headBone ? new THREE.Vector3().setFromMatrixPosition(headBone.matrixWorld) : new THREE.Vector3();

        const faceDeltas = this._faceDeltas(geometry, headIndex, headOrigin, this.headTop);
        const pivots = this._bendPivots(bodyPlan, bones);
        const bendDeltas = pivots.map(pivot => this._bendDeltas(geometry, bones, pivot));

        const morphNames = [...FACE_MORPHS, ...pivots.map(p => `bend_${p.name}`)];
        geometry.morphAttributes.position = [...faceDeltas, ...bendDeltas].map(d => new THREE.Float32BufferAttribute(d, 3));
        geometry.morphTargetsRelative = true;
        return morphNames;
    }

    /**
     * Face morphs are region-based deltas on head vertices. They are placeholders on primitive geometry, not sculpted faces.
     * @private
     */
    _faceDeltas(geometry, headIndex, headOrigin, headTop) {
        const position = geometry.attributes.position;
        const skinIndex = geometry.attributes.skinIndex;
        const deltas = FACE_MORPHS.map(() => new Float32Array(position.count * 3));
        const slot = Object.fromEntries(FACE_MORPHS.map((name, i) => [name, deltas[i]]));

        // Face vertices are head-skinned and below the top of the head box. Prosthetics sit above it.
        const face = [];
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let v = 0; v < position.count; v++) {
            if (skinIndex.getX(v) !== headIndex) continue;
            const y = position.getY(v) - headOrigin.y;
            if (y > headTop + 1e-6) continue;
            const x = position.getX(v) - headOrigin.x;
            face.push(v);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
        if (face.length === 0) return deltas;
        const midY = (minY + maxY) / 2;
        const halfH = (maxY - minY) / 2 || 1;
        const halfW = Math.max(Math.abs(minX), Math.abs(maxX)) || 1;

        for (const v of face) {
            const x = position.getX(v) - headOrigin.x;
            const y = position.getY(v) - headOrigin.y;
            const z = position.getZ(v) - headOrigin.z;
            const lower = clamp01((midY - y) / halfH);
            const upper = clamp01((y - midY) / halfH);
            const front = z > 0 ? 1 : 0;
            const side = x < 0 ? 'Left' : 'Right';
            const sideAmt = clamp01(Math.abs(x) / halfW);
            const centre = 1 - sideAmt;
            const o = v * 3;

            if (front && upper > 0) {
                slot[`eyeBlink${side}`][o + 1] -= 0.05 * upper;
                slot[`browDown${side}`][o + 1] -= 0.03 * upper;
                slot.browInnerUp[o + 1] += 0.03 * upper * centre;
            }
            slot.jawOpen[o + 1] -= 0.08 * lower;
            slot.mouthPucker[o] -= 0.2 * x * lower * front;
            slot.mouthPucker[o + 2] += 0.02 * lower * front;
            slot.mouthFunnel[o] -= 0.5 * x * lower * front;
            slot.mouthFunnel[o + 2] += 0.05 * lower * front;
            slot[`mouthSmile${side}`][o + 1] += 0.03 * sideAmt * lower * front;
            slot[`mouthSmile${side}`][o] += Math.sign(x) * 0.02 * sideAmt * lower * front;
        }
        return deltas;
    }

    /**
     * Joints and limb roots that get a bend morph. Minecraft-style limb animation is a rotation of the distal chain.
     * @private
     */
    _bendPivots(bodyPlan, bones) {
        const limbRoots = new Set(bodyPlan.components.filter(c => LIMB_TYPES.includes(c.type)).map(c => c.id));
        return bones.filter(b => b.children.length > 0 && (b.name.includes('_joint_') || limbRoots.has(b.name)));
    }

    /**
     * Per-vertex deltas that rotate everything distal to a pivot. Weights come from skinning, so the bend follows the rig.
     * @private
     */
    _bendDeltas(geometry, bones, pivot) {
        const position = geometry.attributes.position;
        const skinIndex = geometry.attributes.skinIndex;
        const skinWeight = geometry.attributes.skinWeight;
        const pivotIndex = bones.indexOf(pivot);

        const distal = new Set();
        bones.forEach((bone, i) => {
            for (let a = bone.parent; a; a = a.parent) {
                if (a === pivot) { distal.add(i); break; }
            }
        });

        const origin = new THREE.Vector3().setFromMatrixPosition(pivot.matrixWorld);
        const first = pivot.children.find(c => distal.has(bones.indexOf(c)));
        const dir = first
            ? new THREE.Vector3().setFromMatrixPosition(first.matrixWorld).sub(origin).normalize()
            : new THREE.Vector3(0, -1, 0);
        // Swing in the limb's plane: axis perpendicular to the limb and to a reference direction.
        const ref = Math.abs(dir.y) > 0.5 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
        const axis = new THREE.Vector3().crossVectors(dir, ref).normalize();
        const rot = new THREE.Quaternion().setFromAxisAngle(axis, BEND_ANGLE);

        const deltas = new Float32Array(position.count * 3);
        const rel = new THREE.Vector3();
        const moved = new THREE.Vector3();
        for (let v = 0; v < position.count; v++) {
            let distalWeight = 0;
            let ownWeight = 0;
            for (let k = 0; k < 4; k++) {
                const w = skinWeight.getComponent(v, k);
                if (w <= 0) continue;
                const bi = skinIndex.getComponent(v, k);
                if (distal.has(bi)) distalWeight += w;
                else if (bi === pivotIndex) ownWeight += w;
            }
            if (distalWeight + ownWeight === 0) continue;

            rel.fromBufferAttribute(position, v).sub(origin);
            const along = rel.dot(dir);
            const weight = distalWeight + ownWeight * clamp01(along / BEND_RAMP);
            if (weight === 0) continue;

            moved.copy(rel).applyQuaternion(rot).sub(rel).multiplyScalar(weight);
            deltas.set([moved.x, moved.y, moved.z], v * 3);
        }
        return deltas;
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
            if (comp.pos) bone.position.fromArray(comp.pos).multiply(this._scale());
            if (comp.rot) {
                if (comp.rot.length === 3) bone.rotation.fromArray(comp.rot);
                else if (comp.rot.length === 4) bone.quaternion.fromArray(comp.rot);
            }

            this.boneMap.set(comp.id, bone);
            bones.push(bone);

            if (comp.type === COMPONENT_TYPES.LIMB_CHAIN || comp.type === COMPONENT_TYPES.TAIL || comp.type === COMPONENT_TYPES.WING) {
                const chain = [bone];
                this.chains.set(comp.id, chain);
                const addJoint = (parent, name, offset) => {
                    const joint = new THREE.Bone();
                    joint.name = name;
                    joint.position.copy(offset);
                    parent.add(joint);
                    bones.push(joint);
                    this.boneMap.set(name, joint);
                    chain.push(joint);
                    return joint;
                };

                if (comp.segments) {
                    // Explicit offsets, one joint per segment.
                const { length: limbLength } = this._limbScale(comp);
                let lastJoint = bone;
                comp.segments.forEach((offset, i) => {
                    lastJoint = addJoint(lastJoint, `${comp.id}_joint_${i + 1}`, new THREE.Vector3(...offset).multiply(this._scale()).multiplyScalar(limbLength));
                });
                } else {
                    let lastJoint = bone;
                    const jointCount = comp.joints || 3;
                    const length = (comp.length || 0.4) * this.variant.height;
                    const direction = new THREE.Vector3(0, -length, 0); // Default down (legs)

                    if (comp.mixin === MIXINS.ARM) {
                        direction.set(comp.side === 'left' ? -length : length, 0, 0);
                    } else if (comp.mixin === MIXINS.TENTACLE || comp.type === COMPONENT_TYPES.TAIL) {
                        direction.set(0, 0, -length);
                    } else if (comp.type === COMPONENT_TYPES.WING) {
                        direction.set(comp.side === 'left' ? -length : length, length * 0.5, 0);
                    }

                    for (let i = 1; i < jointCount; i++) {
                        lastJoint = addJoint(lastJoint, `${comp.id}_joint_${i}`, direction);
                    }
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
     * Builds the merged mesh. Chains become jointed segments, explicit boxes use their spec, and heads add features.
     * @private
     */
    _generateGeometry(bodyPlan, bones) {
        const geometries = [];
        const sc = this._scale();

        bodyPlan.components.forEach(comp => {
            const bone = this.boneMap.get(comp.id);
            if (!bone) return;

            const boneIndex = bones.indexOf(bone);
            const tone = comp.tone || 'skin';

            if (this.chains.has(comp.id)) {
                geometries.push(...this._chainGeometry(comp, bones));
                return;
            }

            const spec = comp.box || LEGACY_SPECS[comp.type] || DEFAULT_SPEC;
            geometries.push(this._part(this._boxSpec(spec.size, spec.center), bone, boneIndex, tone, this._jointBlend(bone, bones)));

            // Legacy primitives get a joint cap at the pivot. Explicit boxes are placed by the schema.
            if (!comp.box && comp.type !== COMPONENT_TYPES.HEAD) {
                const scaled = spec.size.map((v, i) => v * sc.getComponent(i));
                const capSize = Math.max(...scaled) * 0.6;
                geometries.push(this._part(new THREE.BoxGeometry(capSize, capSize, capSize), bone, boneIndex, tone));
            }

            if (comp.type === COMPONENT_TYPES.HEAD) {
                this.headTop = (spec.center[1] + spec.size[1] / 2) * sc.y;

                if (comp.features) {
                    geometries.push(...this._featureGeometry(comp.features, spec, bone, boneIndex));
                } else if (bodyPlan.name !== 'Humanoid') {
                    // Legacy snout and ears for non-humanoid heads without a feature list
                    const snoutGeo = new THREE.BoxGeometry(0.15, 0.1, 0.2);
                    snoutGeo.translate(0, -0.05, 0.2);
                    geometries.push(this._part(snoutGeo, bone, boneIndex, 'skin'));
                    for (const x of [-0.1, 0.1]) {
                        const earGeo = new THREE.BoxGeometry(0.05, 0.15, 0.05);
                        earGeo.translate(x, 0.15, 0);
                        geometries.push(this._part(earGeo, bone, boneIndex, 'skin'));
                    }
                }

                for (const type of this.variant.prosthetics) {
                    geometries.push(...this._prostheticGeometry(type, bone, boneIndex, this.headTop));
                }
            }
        });

        return BufferGeometryUtils.mergeGeometries(geometries);
    }

    /**
     * Jointed limb: one box per segment, a joint cap at every bone, and an optional extremity on the last bone.
     * @private
     */
    _chainGeometry(comp, bones) {
        const chain = this.chains.get(comp.id);
        const thickness = (comp.thickness || 0.08) * this.variant.build * this._limbScale(comp).thickness;
        const up = new THREE.Vector3(0, 1, 0);
        const tone = comp.tone || 'skin';
        const parts = [];

        // Each segment runs from its bone to the next, in the bone's local frame.
        for (let i = 0; i < chain.length - 1; i++) {
            const offset = chain[i + 1].position.clone();
            const length = offset.length();
            if (length === 0) continue;
            const seg = new THREE.BoxGeometry(thickness, length, thickness);
            seg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, offset.clone().normalize()));
            seg.translate(offset.x / 2, offset.y / 2, offset.z / 2);
            parts.push(this._part(seg, chain[i], bones.indexOf(chain[i]), tone));
        }

        // Joint caps hide the gap when a joint bends.
        const cap = thickness * 1.4;
        for (const joint of chain) {
            parts.push(this._part(new THREE.BoxGeometry(cap, cap, cap), joint, bones.indexOf(joint), tone));
        }

        if (comp.extremity) {
            const last = chain[chain.length - 1];
            const ext = comp.extremity;
            parts.push(this._part(this._boxSpec(ext.size, ext.center), last, bones.indexOf(last), ext.tone || 'skin'));
        }
        return parts;
    }

    /**
     * Moves a part from its bone's local frame into bind-pose world space.
     * @private
     */
    _place(geo, bone) {
        geo.applyMatrix4(bone.matrixWorld);
        return geo;
    }

    /**
     * Places geometry from a bone's local frame into bind-pose world space, skins it, and colours it.
     * @private
     */
    _part(geo, bone, boneIndex, tone = 'skin', blend = null) {
        this._colorize(geo, tone);
        return this._applySkinning(this._place(geo, bone), boneIndex, blend);
    }

    /**
     * Writes a per-vertex colour so one material can show skin, dark and hair parts.
     * @private
     */
    _colorize(geo, tone) {
        const color = new THREE.Color(this._toneColor(tone));
        const count = geo.attributes.position.count;
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            colors.set([color.r, color.g, color.b], i * 3);
        }
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geo;
    }

    /** @private */
    _toneColor(tone) {
        if (tone === 'dark') return DARK_TONE;
        if (tone === 'hair') return this.variant.hairColor;
        return this.variant.skinTone;
    }

    /**
     * A box given in unscaled body-plan units. Size and centre are scaled by the variant.
     * @private
     */
    _boxSpec(size, center) {
        const s = this._scale();
        const geo = new THREE.BoxGeometry(size[0] * s.x, size[1] * s.y, size[2] * s.z);
        geo.translate(center[0] * s.x, center[1] * s.y, center[2] * s.z);
        return geo;
    }

    /**
     * Face features as small boxes on the front of the head. Front is +z, top is the head box top.
     * @private
     */
    _featureGeometry(features, spec, bone, boneIndex) {
        const [w, h, d] = spec.size;
        const [cx, cy, cz] = spec.center;
        const front = cz + d / 2;
        const top = cy + h / 2;
        const eyeY = cy + 0.10 * h;
        const parts = [];
        const add = (size, center, tone = 'skin') => parts.push(this._part(this._boxSpec(size, center), bone, boneIndex, tone));
        const sides = [-1, 1];

        if (features.includes('eyes')) {
            for (const sx of sides) add([0.035, 0.035, 0.02], [cx + sx * w * 0.25, eyeY, front], 'dark');
        }
        if (features.includes('brows')) {
            for (const sx of sides) add([0.05, 0.012, 0.02], [cx + sx * w * 0.25, eyeY + 0.08 * h, front], 'dark');
        }
        if (features.includes('nose')) add([0.04, 0.06, 0.03], [cx, cy - 0.05 * h, front]);
        if (features.includes('mouth')) add([0.08, 0.015, 0.02], [cx, cy - 0.23 * h, front], 'dark');
        if (features.includes('earsSide')) {
            for (const sx of sides) add([0.03, 0.07, 0.04], [cx + sx * (w / 2 + 0.01), cy - 0.02 * h, cz]);
        }
        if (features.includes('earsUpright')) {
            for (const sx of sides) add([0.04, 0.07, 0.04], [cx + sx * w * 0.3, top + 0.03, cz]);
        }
        if (features.includes('snout')) add([w * 0.5, h * 0.4, 0.08], [cx, cy - 0.2 * h, front + 0.04]);
        if (features.includes('hair')) add([w * 1.04, h * 0.3, d * 1.02], [cx, top - 0.15 * h + 0.01, cz - 0.03], 'hair');
        return parts;
    }

    /**
     * Antennae (skin) and horns (dark) sit on top of the head, above topY.
     * @private
     */
    _prostheticGeometry(type, bone, boneIndex, topY) {
        const parts = [];
        const add = (geo, tone) => parts.push(this._part(geo, bone, boneIndex, tone));
        for (const side of [-1, 1]) {
            if (type === PROSTHETIC_TYPES.ANTENNAE) {
                const g = new THREE.BoxGeometry(0.02, 0.22, 0.02);
                g.rotateZ(-side * 0.3);
                g.translate(side * 0.06, topY + 0.11, 0);
                add(g, 'skin');
            } else if (type === PROSTHETIC_TYPES.HORNS) {
                const g = new THREE.BoxGeometry(0.05, 0.14, 0.05);
                g.rotateZ(-side * 0.5);
                g.translate(side * 0.1, topY + 0.08, 0);
                add(g, 'dark');
            }
        }
        return parts;
    }

    /**
     * Build and height scale for the variant. Applied to bone offsets and body part sizes.
     * @private
     */
    _scale() {
        return new THREE.Vector3(this.variant.build, this.variant.height, this.variant.build);
    }

    /**
     * Limb length and thickness factors from litheness and musculature. Only limb chains are affected.
     * Lithe limbs are longer and slimmer. Momentum (negative litheness) is heavier. Musculature adds bulk.
     * @private
     */
    _limbScale(comp) {
        if (comp.type !== COMPONENT_TYPES.LIMB_CHAIN) return { length: 1, thickness: 1 };
        const musculature = this.variant.musculature || 0;
        const litheness = this.variant.litheness || 0;
        return {
            length: 1 + 0.06 * litheness,
            thickness: (1 + 0.15 * musculature) * (1 - 0.1 * litheness)
        };
    }

    /**
     * Returns the joint blend for a bone's part: near its pivot, vertices share weight with the parent bone.
     * @private
     */
    _jointBlend(bone, bones) {
        const parent = bone.parent;
        if (!parent || !bones.includes(parent)) return null;
        return {
            joint: new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld),
            parentIndex: bones.indexOf(parent),
            radius: 0.08
        };
    }

    /**
     * @private
     */
    _applySkinning(geo, boneIndex, blend = null) {
        const count = geo.attributes.position.count;
        const indices = new Uint16Array(count * 4).fill(0);
        const weights = new Float32Array(count * 4).fill(0);
        const v = new THREE.Vector3();
        for (let i = 0; i < count; i++) {
            indices[i * 4] = boneIndex;
            weights[i * 4] = 1.0;
            if (!blend) continue;
            v.fromBufferAttribute(geo.attributes.position, i);
            const d = v.distanceTo(blend.joint);
            if (d < blend.radius) {
                const t = 0.5 * (1 - d / blend.radius);
                weights[i * 4] = 1 - t;
                indices[i * 4 + 1] = blend.parentIndex;
                weights[i * 4 + 1] = t;
            }
        }
        geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
        geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
        return geo;
    }
}
