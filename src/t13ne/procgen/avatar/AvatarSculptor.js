/**
 * @module Avatar/AvatarSculptor
 * @description PS1/PS2 low-poly avatar sculpting, procedural texture brushes, UV-region inspection overlay,
 * and detachable weirdfiction science-fantasy accessory slots.
 */

import * as THREE from 'three';
import { ATLAS_SIZE, TILE } from './AvatarAtlas.js';
import { hashSeed, mulberry32 } from './avatarRandom.js';

export const DEFAULT_AVATAR_TRIANGLE_BUDGET = 2500;

export const PROCEDURAL_BRUSH_MODES = Object.freeze([
    'solid',
    'noise',
    'weathering',
    'scales',
    'cloth-weave',
    'emblem'
]);

export const EMBLEM_SHAPES = Object.freeze(['diamond', 'chevron', 'star', 'sigil', 'spiral']);

export const ACCESSORY_PRESETS = Object.freeze({
    hat: { slot: 'head', bone: 'head', label: 'Void-Traveler Brim Hat', defaultColor: 0x3b2f4a },
    helmet: { slot: 'head', bone: 'head', label: 'Ironbound Helm', defaultColor: 0x64748b },
    visor: { slot: 'head', bone: 'head', label: 'Psi-Visor', defaultColor: 0x22d3ee },
    horns: { slot: 'head', bone: 'head', label: 'Abyssal Horns', defaultColor: 0x451a03 },
    crest: { slot: 'head', bone: 'head', label: 'Solar Crest', defaultColor: 0xf59e0b },
    halo: { slot: 'head', bone: 'head', label: 'Chronos Halo', defaultColor: 0xfacc15 },
    armour_chest: { slot: 'torso', bone: 'spine', label: 'Carapace Breastplate', defaultColor: 0x475569 },
    armour_shoulder: { slot: 'shoulders', bone: 'spine', label: 'Pauldron Mantle', defaultColor: 0x6b21a8 }
});

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function hexToRgb(hex) {
    return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function mixRgb(a, b, t) {
    const k = clamp(t, 0, 1);
    return [
        Math.round(a[0] + (b[0] - a[0]) * k),
        Math.round(a[1] + (b[1] - a[1]) * k),
        Math.round(a[2] + (b[2] - a[2]) * k)
    ];
}

/**
 * Counts triangles on a mesh (including optional child accessories when includeAccessories=true).
 */
export function countMeshTriangles(mesh, { includeAccessories = false } = {}) {
    if (!mesh?.geometry) return 0;
    const triOf = (meshGeo) => (meshGeo.index ? meshGeo.index.count : meshGeo.attributes.position.count) / 3;
    let total = triOf(mesh.geometry);
    if (includeAccessories) {
        mesh.traverse(child => {
            if (child !== mesh && child.isMesh && child.geometry) {
                total += triOf(child.geometry);
            }
        });
    }
    return Math.round(total);
}

/**
 * Validates that a mesh stays within PS1/PS2 low-poly triangle guardrails.
 */
export function validateTriangleBudget(mesh, maxTriangles = DEFAULT_AVATAR_TRIANGLE_BUDGET) {
    const triangles = countMeshTriangles(mesh, { includeAccessories: false });
    return {
        ok: triangles <= maxTriangles,
        triangles,
        maxTriangles
    };
}

function resolveSymmetryPartName(partName) {
    if (partName.endsWith('_l')) return `${partName.slice(0, -2)}_r`;
    if (partName.endsWith('_r')) return `${partName.slice(0, -2)}_l`;
    if (partName.includes('_fl')) return partName.replace('_fl', '_fr');
    if (partName.includes('_fr')) return partName.replace('_fr', '_fl');
    if (partName.includes('_rl')) return partName.replace('_rl', '_rr');
    if (partName.includes('_rr')) return partName.replace('_rr', '_rl');
    return null;
}

/**
 * Applies non-destructive vertex-group sculpting onto a SkinnedMesh from stored bind-pose base positions,
 * supporting bilateral symmetry and enforcing triangle-budget invariants.
 */
export function applySculptProfile(mesh, sculptSpec = {}, options = {}) {
    if (!mesh?.geometry?.attributes?.position || !mesh?.skeleton?.bones) {
        throw new TypeError('applySculptProfile requires a SkinnedMesh with position attributes and skeleton.');
    }
    const maxTriangles = options.maxTriangles ?? DEFAULT_AVATAR_TRIANGLE_BUDGET;
    const budget = validateTriangleBudget(mesh, maxTriangles);
    if (!budget.ok) {
        throw new RangeError(`Mesh triangle count (${budget.triangles}) exceeds budget (${maxTriangles}).`);
    }

    const posAttr = mesh.geometry.attributes.position;
    const normAttr = mesh.geometry.attributes.normal;
    if (!mesh.userData.basePositions) {
        mesh.userData.basePositions = new Float32Array(posAttr.array);
    }
    if (!mesh.userData.baseNormals && normAttr) {
        mesh.userData.baseNormals = new Float32Array(normAttr.array);
    }
    const base = mesh.userData.basePositions;
    const baseNorm = mesh.userData.baseNormals;

    // Normalize sculpt parts map with optional symmetry expansion
    const symmetry = Boolean(sculptSpec.symmetry);
    const rawParts = sculptSpec.parts ?? sculptSpec;
    const resolvedParts = {};
    for (const [partName, cfg] of Object.entries(rawParts || {})) {
        if (!cfg || typeof cfg !== 'object' || partName === 'symmetry') continue;
        const norm = {
            scale: [
                clamp(Number(cfg.scale?.[0] ?? 1), 0.5, 1.8),
                clamp(Number(cfg.scale?.[1] ?? 1), 0.5, 1.8),
                clamp(Number(cfg.scale?.[2] ?? 1), 0.5, 1.8)
            ],
            offset: [
                clamp(Number(cfg.offset?.[0] ?? 0), -0.35, 0.35),
                clamp(Number(cfg.offset?.[1] ?? 0), -0.35, 0.35),
                clamp(Number(cfg.offset?.[2] ?? 0), -0.35, 0.35)
            ],
            inflate: clamp(Number(cfg.inflate ?? 0), -0.06, 0.08)
        };
        resolvedParts[partName] = norm;
        if (symmetry) {
            const mirror = resolveSymmetryPartName(partName);
            if (mirror && !rawParts[mirror]) {
                resolvedParts[mirror] = {
                    scale: [...norm.scale],
                    offset: [-norm.offset[0], norm.offset[1], norm.offset[2]],
                    inflate: norm.inflate
                };
            }
        }
    }

    // Map bone indices + world pivots
    const bones = mesh.skeleton.bones;
    const boneByName = new Map(bones.map((b, idx) => [b.name, idx]));
    const boneOrigins = bones.map(b => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld));

    const skinIndex = mesh.geometry.attributes.skinIndex;
    const skinWeight = mesh.geometry.attributes.skinWeight;

    // Reset to base positions first so edits never drift cumulatively
    posAttr.array.set(base);

    const v = new THREE.Vector3();
    const n = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
        let totalWeight = 0;
        let dx = 0, dy = 0, dz = 0;
        v.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
        if (baseNorm) n.set(baseNorm[i * 3], baseNorm[i * 3 + 1], baseNorm[i * 3 + 2]).normalize();
        else n.set(0, 1, 0);

        for (let k = 0; k < 4; k++) {
            const w = skinWeight ? skinWeight.getComponent(i, k) : (k === 0 ? 1 : 0);
            if (w <= 0) continue;
            const bi = skinIndex ? skinIndex.getComponent(i, k) : 0;
            const boneName = bones[bi]?.name;
            if (!boneName) continue;

            // Match either exact bone name or parent limb chain prefix (e.g. arm_l matches arm_l_joint_1)
            const matchedKey = resolvedParts[boneName]
                ? boneName
                : Object.keys(resolvedParts).find(key => boneName.startsWith(`${key}_joint_`));
            if (!matchedKey) continue;

            const partCfg = resolvedParts[matchedKey];
            const pivotIdx = boneByName.get(matchedKey) ?? bi;
            const pivot = boneOrigins[pivotIdx] ?? boneOrigins[bi];

            const rx = (v.x - pivot.x) * partCfg.scale[0] + pivot.x + partCfg.offset[0] + n.x * partCfg.inflate;
            const ry = (v.y - pivot.y) * partCfg.scale[1] + pivot.y + partCfg.offset[1] + n.y * partCfg.inflate;
            const rz = (v.z - pivot.z) * partCfg.scale[2] + pivot.z + partCfg.offset[2] + n.z * partCfg.inflate;

            dx += (rx - v.x) * w;
            dy += (ry - v.y) * w;
            dz += (rz - v.z) * w;
            totalWeight += w;
        }

        if (totalWeight > 0) {
            posAttr.setXYZ(i, v.x + dx, v.y + dy, v.z + dz);
        }
    }

    posAttr.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();

    mesh.userData.sculptProfile = {
        symmetry,
        parts: structuredClone(resolvedParts)
    };
    return mesh.userData.sculptProfile;
}

/**
 * Deterministic procedural texture brush confined to the hit face tile inside the avatar atlas.
 */
export function paintProceduralBrush(mesh, hit, options = {}) {
    const atlas = mesh?.userData?.avatarAtlas;
    const texture = mesh?.material?.map;
    if (!atlas || !texture?.isDataTexture) {
        throw new TypeError('paintProceduralBrush requires a procedural avatar with an atlas texture.');
    }

    let object = hit?.object;
    while (object && object !== mesh) object = object.parent;
    if (!object || !hit?.uv || hit.uv.x < 0 || hit.uv.x > 1 || hit.uv.y < 0 || hit.uv.y > 1) {
        return false;
    }

    const mode = PROCEDURAL_BRUSH_MODES.includes(options.mode) ? options.mode : 'solid';
    const colour = Number.isInteger(options.colour) ? options.colour : 0xffcc66;
    const secondaryColour = Number.isInteger(options.secondaryColour) ? options.secondaryColour : 0x1e293b;
    const radius = Number.isInteger(options.radius) ? clamp(options.radius, 0, ATLAS_SIZE) : 2;
    const seed = String(options.seed ?? 't13-brush');
    const emblem = EMBLEM_SHAPES.includes(options.emblem) ? options.emblem : 'diamond';

    const x = Math.min(ATLAS_SIZE - 1, Math.floor(hit.uv.x * ATLAS_SIZE));
    const y = Math.min(ATLAS_SIZE - 1, Math.floor((1 - hit.uv.y) * ATLAS_SIZE));
    const rect = Object.values(atlas.regions).find(r =>
        x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    if (!rect) return false;

    const faceX = rect.x + Math.floor((x - rect.x) / TILE) * TILE;
    const faceY = rect.y + Math.floor((y - rect.y) / TILE) * TILE;
    const maxPx = Math.min(faceX + TILE - 1, rect.x + rect.w - 1);
    const maxPy = Math.min(faceY + TILE - 1, rect.y + rect.h - 1);

    const primaryRgb = hexToRgb(colour);
    const secondaryRgb = hexToRgb(secondaryColour);
    const randSeed = hashSeed(`${seed}:${mode}:${emblem}`);

    let painted = false;
    for (let py = Math.max(faceY, y - radius); py <= Math.min(maxPy, y + radius); py++) {
        for (let px = Math.max(faceX, x - radius); px <= Math.min(maxPx, x + radius); px++) {
            const distSq = (px - x) ** 2 + (py - y) ** 2;
            if (distSq > radius ** 2) continue;

            const lx = px - faceX;
            const ly = py - faceY;
            const rng = mulberry32(hashSeed(`${randSeed}:${px}:${py}`));
            let rgb = primaryRgb;

            if (mode === 'noise') {
                const factor = rng();
                rgb = mixRgb(primaryRgb, secondaryRgb, factor * 0.65);
            } else if (mode === 'weathering') {
                const edgeDist = Math.min(lx, ly, (TILE - 1) - lx, (TILE - 1) - ly);
                const scratch = rng();
                if (edgeDist <= 1 || scratch > 0.72) {
                    rgb = mixRgb(primaryRgb, secondaryRgb, 0.55 + 0.35 * scratch);
                }
            } else if (mode === 'scales') {
                const row = Math.floor(ly / 3);
                const sx = (lx + (row % 2) * 2) % 4;
                const sy = ly % 3;
                const isRim = sx === 0 || sy === 0;
                rgb = isRim ? mixRgb(primaryRgb, secondaryRgb, 0.7) : primaryRgb;
            } else if (mode === 'cloth-weave') {
                const warp = ((lx + ly) % 2 === 0);
                const weft = (lx % 4 === 0 || ly % 4 === 0);
                rgb = mixRgb(primaryRgb, secondaryRgb, weft ? 0.45 : (warp ? 0.15 : 0));
            } else if (mode === 'emblem') {
                const dx = Math.abs(px - x);
                const dy = Math.abs(py - y);
                const r = Math.max(1, radius);
                let onMark = false;
                if (emblem === 'diamond') onMark = (dx + dy) <= r;
                else if (emblem === 'chevron') onMark = Math.abs((py - y) - Math.abs(px - x) + Math.floor(r * 0.4)) <= 1;
                else if (emblem === 'star') onMark = dx === 0 || dy === 0 || Math.abs(dx - dy) === 0;
                else if (emblem === 'sigil') onMark = (dx === r || dy === r || dx === dy);
                else if (emblem === 'spiral') {
                    const ang = Math.atan2(py - y, px - x);
                    const rad = Math.hypot(dx, dy);
                    onMark = Math.sin(rad * 1.8 - ang * 2) > 0.25;
                }
                rgb = onMark ? primaryRgb : secondaryRgb;
            }

            const rgba = [rgb[0], rgb[1], rgb[2], 255];
            atlas.pixels.set(rgba, (py * ATLAS_SIZE + px) * 4);
            texture.image.data.set(rgba, ((ATLAS_SIZE - 1 - py) * ATLAS_SIZE + px) * 4);
            painted = true;
        }
    }

    if (painted) texture.needsUpdate = true;
    return painted;
}

/**
 * Generates a 512x512 RGBA overlay visualizing atlas regions and 16px face-tile grids.
 */
export function generateUVOverlayBuffer(atlas) {
    const buf = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4);
    if (!atlas?.regions) return buf;
    const regions = atlas.regions instanceof Map ? Array.from(atlas.regions.values()) : Object.values(atlas.regions);

    for (const rect of regions) {
        const hue = (hashSeed(rect.key) & 0xff) / 255;
        const rCol = Math.round(90 + 140 * Math.abs(Math.sin(hue * Math.PI * 2)));
        const gCol = Math.round(90 + 140 * Math.abs(Math.sin((hue + 0.33) * Math.PI * 2)));
        const bCol = Math.round(90 + 140 * Math.abs(Math.sin((hue + 0.66) * Math.PI * 2)));

        for (let py = rect.y; py < Math.min(ATLAS_SIZE, rect.y + rect.h); py++) {
            for (let px = rect.x; px < Math.min(ATLAS_SIZE, rect.x + rect.w); px++) {
                const lx = px - rect.x;
                const ly = py - rect.y;
                const isRegionBorder = lx === 0 || ly === 0 || lx === rect.w - 1 || ly === rect.h - 1;
                const isTileBorder = (lx % TILE === 0) || (ly % TILE === 0);
                const o = (py * ATLAS_SIZE + px) * 4;
                if (isRegionBorder) {
                    buf[o] = 255; buf[o + 1] = 255; buf[o + 2] = 255; buf[o + 3] = 220;
                } else if (isTileBorder) {
                    buf[o] = rCol; buf[o + 1] = gCol; buf[o + 2] = bCol; buf[o + 3] = 175;
                } else {
                    buf[o] = rCol; buf[o + 1] = gCol; buf[o + 2] = bCol; buf[o + 3] = 65;
                }
            }
        }
    }
    return buf;
}

function buildAccessoryGeometry(presetKey) {
    switch (presetKey) {
        case 'hat': {
            const brim = new THREE.CylinderGeometry(0.24, 0.24, 0.02, 8);
            brim.translate(0, 0.22, 0);
            const crown = new THREE.CylinderGeometry(0.11, 0.13, 0.14, 8);
            crown.translate(0, 0.29, 0);
            const group = new THREE.Group();
            group.userData.geometries = [brim, crown];
            return [brim, crown];
        }
        case 'helmet': {
            const dome = new THREE.CylinderGeometry(0.11, 0.125, 0.22, 8);
            dome.translate(0, 0.14, 0);
            return [dome];
        }
        case 'visor': {
            const bar = new THREE.BoxGeometry(0.18, 0.045, 0.08);
            bar.translate(0, 0.14, 0.09);
            return [bar];
        }
        case 'horns': {
            const left = new THREE.ConeGeometry(0.032, 0.16, 5);
            left.rotateZ(0.35);
            left.translate(-0.08, 0.25, 0);
            const right = new THREE.ConeGeometry(0.032, 0.16, 5);
            right.rotateZ(-0.35);
            right.translate(0.08, 0.25, 0);
            return [left, right];
        }
        case 'crest': {
            const fin = new THREE.BoxGeometry(0.03, 0.14, 0.24);
            fin.translate(0, 0.27, -0.01);
            return [fin];
        }
        case 'halo': {
            const ring = new THREE.TorusGeometry(0.16, 0.015, 5, 12);
            ring.rotateX(Math.PI / 2 - 0.2);
            ring.translate(0, 0.30, -0.02);
            return [ring];
        }
        case 'armour_chest': {
            const plate = new THREE.BoxGeometry(0.36, 0.28, 0.23);
            plate.translate(0, 0.24, 0.01);
            return [plate];
        }
        case 'armour_shoulder': {
            const leftP = new THREE.BoxGeometry(0.14, 0.11, 0.16);
            leftP.translate(-0.22, 0.39, 0);
            const rightP = new THREE.BoxGeometry(0.14, 0.11, 0.16);
            rightP.translate(0.22, 0.39, 0);
            return [leftP, rightP];
        }
        default:
            throw new Error(`Unknown accessory preset '${presetKey}'.`);
    }
}

/**
 * Attaches a detachable low-poly accessory to the matching skeleton bone.
 */
export function setAccessory(mesh, presetKey, options = {}) {
    const preset = ACCESSORY_PRESETS[presetKey];
    if (!preset) throw new Error(`Unknown accessory preset '${presetKey}'.`);
    const slot = options.slot ?? preset.slot;
    removeAccessory(mesh, slot);

    const bone = mesh.skeleton?.bones?.find(b => b.name === preset.bone) ?? mesh;
    const colour = Number.isInteger(options.colour) ? options.colour : preset.defaultColor;
    const mat = new THREE.MeshLambertMaterial({ color: colour });
    const parts = buildAccessoryGeometry(presetKey);
    const holder = new THREE.Group();
    holder.name = `avatar-accessory:${slot}`;
    holder.userData.accessorySlot = slot;
    holder.userData.accessoryPreset = presetKey;
    holder.userData.accessoryColour = colour;

    for (const partGeo of parts) {
        const piece = new THREE.Mesh(partGeo, mat);
        holder.add(piece);
    }
    bone.add(holder);

    if (!mesh.userData.accessories) mesh.userData.accessories = {};
    mesh.userData.accessories[slot] = { preset: presetKey, colour };
    return holder;
}

export function removeAccessory(mesh, slot) {
    if (!mesh) return false;
    let removed = false;
    const targetName = `avatar-accessory:${slot}`;
    const toRemove = [];
    mesh.traverse(node => {
        if (node.name === targetName) toRemove.push(node);
    });
    for (const node of toRemove) {
        node.parent?.remove(node);
        node.traverse(child => {
            child.geometry?.dispose?.();
            child.material?.dispose?.();
        });
        removed = true;
    }
    if (mesh.userData?.accessories) {
        delete mesh.userData.accessories[slot];
    }
    return removed;
}

export function getAccessories(mesh) {
    return structuredClone(mesh?.userData?.accessories ?? {});
}
