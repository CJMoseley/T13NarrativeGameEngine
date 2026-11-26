import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COMPONENT_TYPES, MIXINS, TRAITS, BODY_PLANS } from './BodyPlanSchema.js';
import ModelLoader from '../../core/ModelLoader.js';
import { hashSeed, mulberry32 } from './avatarRandom.js';
import { AvatarAtlas, ATLAS_VERSION, LEGACY_ATLAS_SIZE, CLOTH_PATTERNS, mapUVsToRegion, paintAtlas, createAtlasTexture, ATLAS_SIZE } from './AvatarAtlas.js';
import {
    bodyFromFacets,
    appearanceFromFacets,
    applyVividness,
    tintSkin,
    materialForFormation,
    calculateSpeciesSize,
    resolveFormation
} from './AvatarFacetBody.js';
import {
    createHumanoidTorso, createQuadrupedTorso, createAnimalHead, createOvoid,
    createTaperedCylinder, createLimbSegment, createJointCap, createHand, createFoot,
    createEar, createUprightEar, createSnout, createHairLock, createWingMembrane,
    createAntenna, createHorn, createBeak, createCrystal
} from './AvatarLowPoly.js';

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
 * Generate subtle, symmetric facial proportions independently of body and clothing draws.
 * The ranges are relative to the body plan's existing features.
 */
export function makeFaceVariant(seed) {
    const rand = mulberry32(hashSeed(`face:${String(seed)}`));
    const range = (min, max) => min + (max - min) * rand();
    return {
        eyeSpacing: range(0.85, 1.15),
        eyeSize: range(0.8, 1.2),
        eyeHeight: range(-0.035, 0.035),
        noseWidth: range(0.8, 1.2),
        noseLength: range(0.8, 1.2),
        mouthWidth: range(0.8, 1.2),
        earSize: range(0.85, 1.15)
    };
}

/**
 * Builds a deterministic humanoid variant from a seed string.
 * Skin and hair come from the seed; clothing defaults to a neutral outfit. Body (height, build, musculature, litheness)
 * and appearance (clothingVividness, skinTint, mottle, descriptors) come from the character's Facets when supplied.
 * Seeded draws are appended in order, so older seeds keep the same values.
 * @param {string} seed
 * @param {object} [options]
 * @param {string[]} [options.prosthetics] - Values from PROSTHETIC_TYPES.
 * @param {Object<number, number>} [options.facetBoons] - Boon keyed by FacetIndex, see facetBoonsFromStats.
 * @param {string|null} [options.incarna] - Optional Formation Facet name (e.g. 'Trial', 'Quiet', 'Rook').
 * @param {object|null} [options.species] - Optional species definition (supports sizeMatrix and Formation).
 * @param {object|null} [options.character] - Optional character object (for phenotype and Formation precedence).
 * @param {object|null} [options.phenotype] - Optional phenotype map (sex, caste, race, etc.) for species size rules.
 * @returns {object}
 */
export function makeHumanoidVariant(seed, { prosthetics = [], facetBoons = null, incarna = null, species = null, character = null, phenotype = null } = {}) {
    const rand = mulberry32(hashSeed(String(seed)));
    const range = (lo, hi) => lo + (hi - lo) * rand();
    const pick = (list) => list[Math.floor(rand() * list.length)];
    const seededHeight = range(0.9, 1.1);
    const seededBuild = range(0.85, 1.2);
    const skinTone = pick(SKIN_TONES);
    const hairColor = pick(HAIR_COLORS);
    // Keep consuming the original clothing draws to preserve seeded body proportions.
    pick(CLOTH_COLOURS); pick(CLOTH_PATTERNS);
    pick(CLOTH_COLOURS); pick(CLOTH_PATTERNS);
    const clothing = { top: { ...DEFAULT_CLOTHING.top }, bottom: { ...DEFAULT_CLOTHING.bottom } };
    const seededMusculature = range(-1, 1);
    const seededLitheness = range(-1, 1);

    const fromFacets = facetBoons ? bodyFromFacets(facetBoons) : null;
    const appearance = facetBoons ? appearanceFromFacets(facetBoons) : null;
    const entityForFormation = character ?? (incarna != null ? { incarna } : null);
    const { formation, material } = resolveFormation(entityForFormation, species);
    const sizeInfo = (facetBoons || species || character || phenotype)
        ? calculateSpeciesSize({ boons: facetBoons || {}, phenotype: phenotype || {}, species, character: entityForFormation })
        : null;

    const resolvedHeight = sizeInfo?.ruleApplied
        ? sizeInfo.heightScale
        : (fromFacets ? fromFacets.height : seededHeight);

    return {
        height: resolvedHeight,
        build: fromFacets ? fromFacets.build : seededBuild,
        musculature: fromFacets ? fromFacets.musculature : seededMusculature,
        litheness: fromFacets ? fromFacets.litheness : seededLitheness,
        skinTone,
        hairColor,
        prosthetics,
        clothing,
        face: makeFaceVariant(seed),
        ...(sizeInfo?.heightCm != null ? { heightCm: sizeInfo.heightCm } : {}),
        ...(appearance ? {
            clothingVividness: appearance.clothingVividness,
            skinTint: appearance.skinTint,
            mottle: appearance.mottle,
            descriptors: appearance.descriptors
        } : {}),
        ...(formation !== 'Nature' ? { formation, material } : {})
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
        this.atlas = new AvatarAtlas();
        this.legacyAtlas = new AvatarAtlas(LEGACY_ATLAS_SIZE);
        this.regionCounts = new Map();
        this.legacyRegionKeys = {};

        // 1. Build Skeleton
        const { bones, rootBone } = this._buildSkeleton(bodyPlan);
        const skeleton = new THREE.Skeleton(bones);
        // Geometry is baked into bind-pose world space, so bone world matrices must be current.
        rootBone.updateMatrixWorld(true);

        // 2. Generate Geometry
        const { geometry, features } = this._generateGeometry(bodyPlan, bones);

        // 3. Setup Morph Targets on Geometry
        const morphNames = this._setupMorphTargets(geometry, bodyPlan, bones);

        const supplied = this.variant.atlasPixels;
        if (supplied != null && (!(supplied instanceof Uint8Array) || supplied.length !== ATLAS_SIZE * ATLAS_SIZE * 4)) {
            throw new TypeError(`Avatar atlas pixels must be a ${ATLAS_SIZE}x${ATLAS_SIZE} RGBA Uint8Array.`);
        }
        const facetLook = this.variant.facetBoons ? appearanceFromFacets(this.variant.facetBoons) : null;
        const skinTint = this.variant.skinTint ?? facetLook?.skinTint ?? 0;
        const clothingVividness = this.variant.clothingVividness ?? facetLook?.clothingVividness ?? 1;
        const mottle = this.variant.mottle ?? facetLook?.mottle ?? 0;
        const materialFamily = this.variant.material ?? (
            (this.variant.incarna || this.variant.formation)
                ? materialForFormation(this.variant.incarna ?? this.variant.formation)
                : 'flesh'
        );
        const resolvedClothing = this.variant.clothing
            ? Object.fromEntries(Object.entries(this.variant.clothing).map(([slot, entry]) => [
                slot,
                entry && typeof entry === 'object'
                    ? { ...entry, colour: clothingVividness === 1 ? entry.colour : applyVividness(entry.colour, clothingVividness) }
                    : entry
            ]))
            : this.variant.clothing;
        const pixels = supplied ? new Uint8Array(supplied) : paintAtlas(this.atlas, {
            skin: skinTint === 0 ? this.variant.skinTone : tintSkin(this.variant.skinTone, skinTint),
            hair: this.variant.hairColor,
            dark: DARK_TONE,
            clothing: resolvedClothing,
            mottle,
            material: materialFamily,
            skinTintFn: skinTint === 0 ? null : (hex) => tintSkin(hex, skinTint),
            preserveSkin: Boolean(this.variant.preserveSpeciesSkin),
            preserveHair: Boolean(this.variant.preserveSpeciesHair)
        });
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff, map: createAtlasTexture(pixels) });

        const mesh = new THREE.SkinnedMesh(geometry, material);
        mesh.add(rootBone);
        mesh.updateMatrixWorld(true);
        mesh.bind(skeleton);

        mesh.morphTargetDictionary = Object.fromEntries(morphNames.map((name, i) => [name, i]));
        mesh.morphTargetInfluences = new Array(morphNames.length).fill(0);
        for (const featureGeometry of features) {
            this._setupMorphTargets(featureGeometry, bodyPlan, bones);
            const feature = new THREE.SkinnedMesh(featureGeometry, material);
            feature.name = 'avatar-face-feature';
            mesh.add(feature);
            feature.bind(skeleton, mesh.bindMatrix);
            feature.morphTargetDictionary = mesh.morphTargetDictionary;
            feature.morphTargetInfluences = mesh.morphTargetInfluences;
        }
        mesh.userData.avatarAtlas = {
            version: ATLAS_VERSION,
            bodyPlan: bodyPlan.name,
            material: materialFamily,
            regions: Object.fromEntries(this.atlas.regions),
            legacyRegions: Object.fromEntries(this.legacyAtlas.regions),
            legacyRegionKeys: this.legacyRegionKeys,
            pixels
        };

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
        const faceFeature = geometry.attributes.faceFeature;
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

            const feature = faceFeature.getX(v);
            if (feature === 1 && front) {
                slot[`eyeBlink${side}`][o + 1] -= 0.05 * upper;
            }
            if (feature === 2 && front) {
                slot[`browDown${side}`][o + 1] -= 0.025 * (1 - 0.5 * sideAmt);
                slot.browInnerUp[o + 1] += 0.03 * centre;
            }
            if (feature === 0 || feature === 3 || feature === 4) slot.jawOpen[o + 1] -= 0.08 * lower;
            if ((feature === 3 || feature === 4) && front) {
                slot.mouthPucker[o] -= 0.2 * x;
                slot.mouthPucker[o + 2] += 0.02;
                slot.mouthFunnel[o] -= 0.5 * x;
                slot.mouthFunnel[o + 2] += 0.05;
                if (feature === 3) {
                    const span = maxX - minX || 1;
                    const outer = side === 'Left' ? (maxX - x) / span : (x - minX) / span;
                    slot[`mouthSmile${side}`][o + 1] += 0.01 * outer;
                }
            }
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

            this.currentPart = comp.id;
            const coverage = this.variant.clothingCoverage ?? bodyPlan.clothingCoverage;
            this.clothingSlot = coverage?.[comp.id] ?? null;
            const boneIndex = bones.indexOf(bone);
            const tone = comp.tone || (this.clothingSlot ? 'cloth' : 'skin');
            const isHumanoid = bodyPlan.name === 'Humanoid' || bodyPlan.name === 'Winged';
            if (this.chains.has(comp.id)) {
                geometries.push(...this._chainGeometry(comp, bones, isHumanoid));
                return;
            }

            const spec = comp.box || LEGACY_SPECS[comp.type] || DEFAULT_SPEC;
            const facetedHead = isHumanoid && comp.type === COMPONENT_TYPES.HEAD;
            const shapedTorso = isHumanoid && (comp.id === 'spine' || comp.id === 'hips');
            const isOvoid = ['cephalothorax', 'abdomen', 'head_segment', 'center', 'hub', 'lobe_l', 'lobe_r', 'thorax'].includes(comp.id)
                || (comp.id === 'core' && bodyPlan.name !== 'Crystalline')
                || comp.id.startsWith('segment_') || comp.id.startsWith('body_');
            const isCrystalline = bodyPlan.name === 'Crystalline';
            const geo = shapedTorso ? this._torsoSpec(spec, comp.id)
                : isHumanoid && comp.id === 'neck' ? this._roundedSpec(spec.size, spec.center, 0)
                    : isCrystalline ? createCrystal(spec.size, spec.center, sc)
                        : !isHumanoid && comp.id === 'body' ? createQuadrupedTorso(spec, sc)
                            : !isHumanoid && comp.id === 'stalk' ? createTaperedCylinder(spec.size, spec.center, sc, 0.75, 1.15)
                                : !isHumanoid && comp.id === 'neck' ? createTaperedCylinder(spec.size, spec.center, sc)
                                    : !isHumanoid && comp.type === COMPONENT_TYPES.HEAD && !isOvoid ? createAnimalHead(spec, sc)
                                        : isOvoid ? createOvoid(spec.size, spec.center, sc)
                                            : this._boxSpec(spec.size, spec.center, facetedHead);

            geometries.push(this._part(geo, bone, boneIndex, tone, this._jointBlend(bone, bones)));

            // Legacy primitives get a joint cap at the pivot. Explicit boxes are placed by the schema.
            if (!comp.box && comp.type !== COMPONENT_TYPES.HEAD) {
                const scaled = spec.size.map((v, i) => v * sc.getComponent(i));
                const capSize = Math.max(...scaled) * 0.6;
                geometries.push(this._part(createJointCap(capSize * 0.5), bone, boneIndex, tone));
            }

            if (comp.type === COMPONENT_TYPES.HEAD) {
                this.headTop = (spec.center[1] + spec.size[1] / 2) * sc.y;

                if (comp.features) {
                    geometries.push(...this._featureGeometry(comp.features, spec, bone, boneIndex, facetedHead));
                } else if (bodyPlan.name !== 'Humanoid') {
                    // Legacy snout and ears for non-humanoid heads without a feature list
                    geometries.push(this._part(createSnout(0.14, 0.09, 0.18, [0, -0.04, 0.18], sc), bone, boneIndex, 'skin'));
                    for (const sx of [-1, 1]) {
                        geometries.push(this._part(createUprightEar(0.24, 0.08, 0, sx, 1.5, sc), bone, boneIndex, 'skin'));
                    }
                }

                for (const type of this.variant.prosthetics) {
                    geometries.push(...this._prostheticGeometry(type, bone, boneIndex, this.headTop));
                }
            }
        });

        const features = geometries.filter(geometry => geometry.attributes.faceFeature.getX(0) > 0);
        const body = geometries.filter(geometry => geometry.attributes.faceFeature.getX(0) === 0);
        return { geometry: BufferGeometryUtils.mergeGeometries(body), features };
    }

    /**
     * Jointed limb: one box per segment, a joint cap at every bone, and an optional extremity on the last bone.
     * @private
     */
    _chainGeometry(comp, bones, humanoid = false) {
        const chain = this.chains.get(comp.id);
        const thickness = (comp.thickness || 0.08) * this.variant.build * this._limbScale(comp).thickness;
        const up = new THREE.Vector3(0, 1, 0);
        const tone = comp.tone || (this.clothingSlot ? 'cloth' : 'skin');
        const parts = [];

        // Each segment runs from its bone to the next, in the bone's local frame.
        for (let i = 0; i < chain.length - 1; i++) {
            const offset = chain[i + 1].position.clone();
            const length = offset.length();
            if (length === 0) continue;
            const seg = createLimbSegment(comp, i, chain.length, thickness, length, humanoid);
            seg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, offset.clone().normalize()));
            seg.translate(offset.x / 2, offset.y / 2, offset.z / 2);
            parts.push(this._part(seg, chain[i], bones.indexOf(chain[i]), tone));
        }

        // Joint caps hide the gap when a joint bends.
        for (const [index, joint] of chain.entries()) {
            if (joint === chain[chain.length - 1] && comp.extremity) continue;
            const cap = thickness * (humanoid && comp.mixin === MIXINS.LEG && index === 1 ? 0.84 : comp.extremity ? 1.05 : 1.4);
            const capTone = joint === chain[chain.length - 1] ? (comp.extremity?.tone || 'skin') : tone;
            const capGeo = createJointCap(cap * 0.5);

            parts.push(this._part(capGeo, joint, bones.indexOf(joint), capTone));
        }

        if (comp.extremity) {
            const last = chain[chain.length - 1];
            const ext = comp.extremity;
            const geo = humanoid && comp.mixin === MIXINS.ARM ? createHand(ext, comp.side, this._scale())
                : comp.mixin === MIXINS.LEG ? createFoot(ext, this._scale(), humanoid)
                    : humanoid ? this._roundedSpec(ext.size, ext.center, 0.2)
                        : this._boxSpec(ext.size, ext.center);
            parts.push(this._part(geo, last, bones.indexOf(last), ext.tone || 'skin'));
        }
        if (comp.type === COMPONENT_TYPES.WING && comp.mixin === MIXINS.WING_MEMBRANE) {
            parts.push(this._part(createWingMembrane(chain, this._scale()), chain[0], bones.indexOf(chain[0]), tone));
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
    _part(geo, bone, boneIndex, tone = 'skin', blend = null, faceFeature = 0) {
        const base = `${this.currentPart}:${tone}${tone === 'cloth' ? `:${this.clothingSlot}` : ''}`;
        const count = this.regionCounts.get(base) ?? 0;
        this.regionCounts.set(base, count + 1);
        const key = count === 0 ? base : `${base}#${count}`;
        this.legacyAtlas.region(base);
        this.legacyRegionKeys[key] = base;
        mapUVsToRegion(geo, this.atlas.region(key));
        geo.setAttribute('faceFeature', new THREE.Uint8BufferAttribute(new Uint8Array(geo.attributes.position.count).fill(faceFeature), 1));
        return this._applySkinning(this._place(geo, bone), boneIndex, blend);
    }

    /**
     * A box given in unscaled body-plan units. Size and centre are scaled by the variant.
     * @private
     */
    _boxSpec(size, center, facetedHead = false) {
        const s = this._scale();
        const segments = facetedHead ? 4 : 1;
        const geo = new THREE.BoxGeometry(size[0] * s.x, size[1] * s.y, size[2] * s.z, segments, segments, segments);
        if (facetedHead) {
            const p = geo.attributes.position;
            const halfX = size[0] * s.x / 2, halfY = size[1] * s.y / 2, halfZ = size[2] * s.z / 2;
            for (let i = 0; i < p.count; i++) {
                let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
                const nx = x / halfX, ny = y / halfY, nz = z / halfZ;
                const crown = Math.max(0, (ny - 0.25) / 0.75);
                const jaw = Math.max(0, (-ny - 0.2) / 0.8);
                x *= (1 - 0.32 * crown - 0.22 * jaw) * (1 - 0.16 * nz * nz);
                z *= (1 - 0.28 * crown - 0.16 * jaw) * (1 - 0.16 * nx * nx);
                y -= halfY * 0.22 * crown * (nx * nx + nz * nz) / 2;
                y += halfY * 0.24 * jaw * (nx * nx + nz * nz) / 2;
                p.setXYZ(i, x, y, z);
            }
            geo.computeVertexNormals();
        }
        geo.translate(center[0] * s.x, center[1] * s.y, center[2] * s.z);
        return geo;
    }

    _torsoSpec(spec, part) {
        return createHumanoidTorso(spec, part, this._scale());
    }

    _roundCrossSection(geo, width, depth, endTaper) {
        const p = geo.attributes.position;
        const halfHeight = geo.parameters.height / 2;
        for (let i = 0; i < p.count; i++) {
            const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
            const nx = x / (width / 2), nz = z / (depth / 2);
            const taper = 1 - endTaper * Math.abs(y / halfHeight);
            p.setXYZ(i, x * (1 - 0.29 * nz * nz) * taper, y, z * (1 - 0.29 * nx * nx) * taper);
        }
        geo.computeVertexNormals();
        return geo;
    }

    _roundedSpec(size, center, endTaper) {
        const scale = this._scale();
        const width = size[0] * scale.x, height = size[1] * scale.y, depth = size[2] * scale.z;
        const geo = this._roundCrossSection(new THREE.BoxGeometry(width, height, depth, 2, 2, 2), width, depth, endTaper);
        geo.translate(center[0] * scale.x, center[1] * scale.y, center[2] * scale.z);
        return geo;
    }

    /**
     * Facial features on the front of the head. Front is +z, top is the head box top.
     * @private
     */
    _featureGeometry(features, spec, bone, boneIndex, conformToHead = false) {
        const [w, h, d] = spec.size;
        const [cx, cy, cz] = spec.center;
        const front = cz + d / 2;
        const top = cy + h / 2;
        const face = this.variant.face ?? {};
        const eyeY = cy + (0.10 + (face.eyeHeight ?? 0)) * h;
        const eyeSpacing = face.eyeSpacing ?? 1;
        const eyeSize = face.eyeSize ?? 1;
        const parts = [];
        const add = (size, center, tone = 'skin', feature = 0, faceted = false) => parts.push(this._part(this._boxSpec(size, center, faceted), bone, boneIndex, tone, null, feature));
        const head = conformToHead ? new THREE.Mesh(this._boxSpec(spec.size, spec.center, true)) : null;
        const ray = new THREE.Raycaster();
        const scale = this._scale();
        const addFace = (width, height, x, y, tone, feature, shape, relief = 0) => {
            const vertices = [];
            const uvs = [];
            const points = [[0, 0], ...shape];
            for (const [px, py] of points) {
                const vx = (x + px * width) * scale.x;
                const vy = (y + py * height) * scale.y;
                ray.set(new THREE.Vector3(vx, vy, (front + d + 1) * scale.z), new THREE.Vector3(0, 0, -1));
                const hit = ray.intersectObject(head)[0];
                if (!hit) throw new Error(`Facial feature ${feature} extends beyond the humanoid head.`);
                vertices.push(vx, vy, hit.point.z + (0.001 + (px === 0 && py === 0 ? relief : 0)) * scale.z);
                uvs.push(0.5 + px, 0.5 + py);
            }
            const indices = [];
            for (let i = 1; i <= shape.length; i++) indices.push(0, i, i === shape.length ? 1 : i + 1);
            const geometry = new THREE.BufferGeometry();
            geometry.userData.atlasFace = 4;
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            parts.push(this._part(geometry, bone, boneIndex, tone, null, feature));
        };
        const almond = [[-0.5, 0], [-0.28, -0.5], [0.28, -0.5], [0.5, 0], [0.28, 0.5], [-0.28, 0.5]];
        const strip = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
        const sides = [-1, 1];

        if (features.includes('eyes')) {
            for (const sx of sides) {
                const x = cx + sx * w * 0.25 * eyeSpacing;
                if (head) addFace(0.027 * eyeSize, 0.014 * eyeSize, x, eyeY, 'dark', 1, almond);
                else add([0.027 * eyeSize, 0.020 * eyeSize, 0.02], [x, eyeY, front], 'dark', 1);
            }
        }
        if (features.includes('brows')) {
            for (const sx of sides) {
                const x = cx + sx * w * 0.25 * eyeSpacing;
                if (head) addFace(0.038 * eyeSize, 0.005, x, eyeY + 0.08 * h, 'dark', 2, almond);
                else add([0.038 * eyeSize, 0.008, 0.02], [x, eyeY + 0.08 * h, front], 'dark', 2);
            }
        }
        if (features.includes('nose')) {
            if (head) addFace(0.03 * (face.noseWidth ?? 1), 0.045 * (face.noseLength ?? 1), cx, cy - 0.05 * h, 'skin', 5, almond, 0.013);
            else add([0.03 * (face.noseWidth ?? 1), 0.045 * (face.noseLength ?? 1), 0.03], [cx, cy - 0.05 * h, front], 'skin', 5);
        }
        if (features.includes('mouth')) {
            const width = 0.055 * (face.mouthWidth ?? 1);
            if (head) {
                addFace(width / 3, 0.005, cx, cy - 0.23 * h, 'dark', 4, strip);
                for (const sx of sides) addFace(width / 3, 0.005, cx + sx * width / 3, cy - 0.23 * h, 'dark', 3, strip);
            } else {
                add([width / 3, 0.010, 0.02], [cx, cy - 0.23 * h, front], 'dark', 4);
                for (const sx of sides) add([width / 3, 0.010, 0.02], [cx + sx * width / 3, cy - 0.23 * h, front], 'dark', 3);
            }
        }
        if (features.includes('earsSide')) {
            for (const sx of sides) parts.push(this._part(createEar(w, h, cx, cy, cz, sx, face.earSize ?? 1, scale), bone, boneIndex, 'skin', null, 6));
        }
        if (features.includes('earsUpright')) {
            for (const sx of sides) parts.push(this._part(createUprightEar(w, top, cz, sx, face.earSize ?? 1, scale), bone, boneIndex, 'skin', null, 6));
        }
        if (features.includes('snout')) {
            parts.push(this._part(createSnout(w * 0.46, h * 0.36, 0.10, [cx, cy - 0.18 * h, front + 0.04], scale), bone, boneIndex, 'skin', null, 5));
        }
        if (features.includes('beak')) {
            parts.push(this._part(createBeak(w * 0.38, h * 0.32, 0.12, [cx, cy - 0.08 * h, front + 0.05], scale), bone, boneIndex, 'dark', null, 5));
        }
        if (features.includes('hair')) {
            add([w * 1.04, h * 0.28, d * 1.02], [cx, top - 0.12 * h, cz], 'hair', 7, true);
            parts.push(this._part(createHairLock(w * 0.88, h * 0.44, 0.035, [cx, top - 0.32 * h, cz - d / 2], 0.08, 0, scale), bone, boneIndex, 'hair', null, 7));
            for (const sx of sides) {
                parts.push(this._part(createHairLock(0.03, h * 0.28, d * 0.78, [cx + sx * w * 0.46, top - 0.22 * h, cz - 0.01], 0, -sx * 0.12, scale), bone, boneIndex, 'hair', null, 7));
                parts.push(this._part(createHairLock(w * 0.14, h * 0.16, 0.03, [cx + sx * w * 0.42, top - 0.22 * h, front - 0.01], -0.1, -sx * 0.12, scale), bone, boneIndex, 'hair', null, 7));
            }
        }
        head?.geometry.dispose();
        head?.material.dispose();
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
            if (type === PROSTHETIC_TYPES.ANTENNAE) add(createAntenna(side, topY), 'skin');
            else if (type === PROSTHETIC_TYPES.HORNS) add(createHorn(side, topY), 'dark');
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
