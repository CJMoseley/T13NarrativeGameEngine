/**
 * @module UHPP/UHPPPropBuilder
 * @description Procedural PS1/PS2 low-poly Location terrain blocks and Item Descendants
 * styled by T13 Formation Incarna (weirdfiction science-fantasy props, monoliths, consoles, ruins).
 */

import * as THREE from 'three';
import { FORMATION_PALETTES } from '../avatar/AvatarAtlas.js';
import { materialForFormation, resolveFormation } from '../avatar/AvatarFacetBody.js';
import { hashSeed, mulberry32 } from '../avatar/avatarRandom.js';

export const UHPP_PROP_TYPES = Object.freeze([
    'pillar',
    'wall',
    'dais',
    'crate',
    'ruin',
    'crystal',
    'monolith',
    'console',
    'relic'
]);

function createPropGeometry(propType, { width, height, depth, seed }) {
    const rand = mulberry32(hashSeed(`${propType}:${seed}`));
    let propMeshGeo;
    switch (propType) {
        case 'pillar':
            propMeshGeo = new THREE.CylinderGeometry(width * 0.36, width * 0.44, height, 6, 2);
            propMeshGeo.translate(0, height / 2, 0);
            break;
        case 'wall':
            propMeshGeo = new THREE.BoxGeometry(width, height, Math.max(0.25, depth * 0.35), 2, 2, 1);
            propMeshGeo.translate(0, height / 2, 0);
            break;
        case 'dais':
            propMeshGeo = new THREE.CylinderGeometry(width * 0.48, width * 0.58, Math.max(0.25, height * 0.45), 8, 1);
            propMeshGeo.translate(0, Math.max(0.25, height * 0.45) / 2, 0);
            break;
        case 'crystal':
            propMeshGeo = new THREE.OctahedronGeometry(Math.max(width, depth) * 0.42, 0);
            propMeshGeo.scale(1, Math.max(1.2, height / Math.max(0.4, width)), 1);
            propMeshGeo.translate(0, height * 0.5, 0);
            break;
        case 'monolith':
            propMeshGeo = new THREE.CylinderGeometry(width * 0.25, width * 0.45, height * 1.35, 4, 2);
            propMeshGeo.rotateY(Math.PI / 4);
            propMeshGeo.translate(0, (height * 1.35) / 2, 0);
            break;
        case 'console':
            propMeshGeo = new THREE.BoxGeometry(width * 0.85, height * 0.72, depth * 0.65, 2, 2, 2);
            propMeshGeo.translate(0, height * 0.36, 0);
            break;
        case 'relic':
            propMeshGeo = new THREE.DodecahedronGeometry(Math.min(width, depth) * 0.35, 0);
            propMeshGeo.translate(0, height * 0.45, 0);
            break;
        case 'ruin':
            propMeshGeo = new THREE.BoxGeometry(width, height * 0.85, depth, 2, 3, 2);
            propMeshGeo.translate(0, height * 0.425, 0);
            break;
        case 'crate':
        default:
            propMeshGeo = new THREE.BoxGeometry(width * 0.8, height * 0.75, depth * 0.8, 1, 1, 1);
            propMeshGeo.translate(0, height * 0.375, 0);
            break;
    }

    // Subtle deterministic weirdfiction vertex jitter for organic/ruined silhouettes
    if (propType === 'ruin' || propType === 'crystal' || propType === 'monolith') {
        const pos = propMeshGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            if (y <= 0.02) continue;
            pos.setX(i, pos.getX(i) + (rand() - 0.5) * 0.08 * width);
            pos.setZ(i, pos.getZ(i) + (rand() - 0.5) * 0.08 * depth);
        }
        propMeshGeo.computeVertexNormals();
    }
    return propMeshGeo;
}

/**
 * Builds a low-poly MeshLambertMaterial prop/terrain THREE.Group tinted by Formation Incarna.
 */
export function buildUHPPPropMesh(spec = {}) {
    const propType = UHPP_PROP_TYPES.includes(spec.propType) ? spec.propType : 'crate';
    const width = Math.max(0.25, Math.min(8, Number(spec.width ?? 0.9)));
    const height = Math.max(0.25, Math.min(8, Number(spec.height ?? 1.0)));
    const depth = Math.max(0.25, Math.min(8, Number(spec.depth ?? 0.9)));
    const seed = String(spec.seed ?? spec.name ?? propType);

    const { formation, material: materialFamily } = resolveFormation(
        { incarna: spec.incarna ?? spec.formation ?? 'Burden' },
        null
    );
    const palette = FORMATION_PALETTES[materialFamily] ?? { base: 0x7e7b75, dark: 0x3a3835 };
    const color = Number.isInteger(spec.color) ? spec.color : palette.base;

    const group = new THREE.Group();
    group.name = `uhpp-prop-${propType}`;

    const propMeshGeo = createPropGeometry(propType, { width, height, depth, seed });
    const mat = new THREE.MeshLambertMaterial({ color });
    const body = new THREE.Mesh(propMeshGeo, mat);
    group.add(body);

    // Optional Formation accent trim
    if (propType === 'console' || propType === 'monolith' || propType === 'relic') {
        const trimGeo = new THREE.BoxGeometry(width * 0.45, height * 0.14, depth * 0.45);
        const trimMat = new THREE.MeshLambertMaterial({ color: palette.dark });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.y = height * 0.78;
        group.add(trim);
    }

    group.userData.uhppProp = {
        propType,
        formation,
        material: materialFamily,
        width,
        height,
        depth,
        seed
    };
    return group;
}

/**
 * Converts a UHPP prop/terrain configuration into an authoritative VTT:SpawnToken payload.
 */
export function toVttPropTokenSpec(spec = {}, position = { x: 0, y: 0, z: 0 }) {
    const propType = UHPP_PROP_TYPES.includes(spec.propType) ? spec.propType : 'crate';
    const { formation, material } = resolveFormation({ incarna: spec.incarna ?? 'Burden' }, null);
    return {
        id: spec.id ?? `prop-${propType}-${Date.now()}`,
        name: spec.name ?? `${formation} ${propType}`,
        tokenType: ['wall', 'pillar', 'dais', 'ruin'].includes(propType) ? 'terrain' : 'prop',
        allegiance: 'prop',
        incarna: formation,
        color: spec.color ?? (FORMATION_PALETTES[material]?.base ?? 0x94a3b8),
        scale: Number(spec.scale ?? 1),
        position,
        propSpec: {
            propType,
            width: Number(spec.width ?? 0.9),
            height: Number(spec.height ?? 1.0),
            depth: Number(spec.depth ?? 0.9),
            seed: String(spec.seed ?? propType),
            incarna: formation
        }
    };
}
