import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COMPONENT_TYPES, MIXINS } from './BodyPlanSchema.js';

/**
 * @module Avatar/AvatarLowPoly
 * @description PS1-era low-polygon anatomical geometry builders for procedural avatars.
 * All returned geometries are indexed BufferGeometries with position, normal, and uv attributes.
 */

const clampUVs = (geo) => {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, Math.min(Math.max(uv.getX(i), 0), 1), Math.min(Math.max(uv.getY(i), 0), 1));
    }
    return geo;
};

const smoothProfile = (t, stops) => {
    for (let i = 0; i < stops.length - 1; i++) {
        const [t0, v0] = stops[i];
        const [t1, v1] = stops[i + 1];
        if (t <= t1 || i === stops.length - 2) {
            const u = Math.min(Math.max((t - t0) / (t1 - t0 || 1), 0), 1);
            return v0 + (v1 - v0) * u;
        }
    }
    return stops[stops.length - 1][1];
};

const scaleCylinderRings = (geo, halfHeight, rxFn, rzFn, zOffsetFn = null) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const y = p.getY(i);
        const z = p.getZ(i);
        const ny = halfHeight > 0 ? y / halfHeight : 0;
        const rx = rxFn(ny, x, z);
        const rz = rzFn(ny, x, z);
        const zOff = zOffsetFn ? zOffsetFn(ny, x, z) : 0;
        p.setXYZ(i, x * rx, y, z * rz + zOff);
    }
    geo.computeVertexNormals();
    return geo;
};

/**
 * Sculpted 8-sided humanoid torso (spine or pelvis) with chest/waist/hip silhouette.
 */
export function createHumanoidTorso(spec, part, scale) {
    const halfW = (spec.size[0] * scale.x) / 2;
    const height = spec.size[1] * scale.y;
    const halfD = (spec.size[2] * scale.z) / 2;
    const geo = new THREE.CylinderGeometry(1, 1, height, 8, 4);

    if (part === 'spine') {
        const widthStops = [[-1, 0.70], [-0.5, 0.80], [0, 0.94], [0.5, 1.08], [1, 1.00]];
        const depthStops = [[-1, 0.78], [-0.5, 0.86], [0, 1.04], [0.5, 1.08], [1, 0.88]];
        scaleCylinderRings(
            geo,
            height / 2,
            (ny) => halfW * smoothProfile(ny, widthStops),
            (ny) => halfD * smoothProfile(ny, depthStops),
            (ny) => halfD * 0.08 * Math.max(0, ny)
        );
    } else {
        const widthStops = [[-1, 0.88], [0, 1.04], [1, 0.82]];
        const depthStops = [[-1, 0.86], [0, 1.05], [1, 0.86]];
        scaleCylinderRings(
            geo,
            height / 2,
            (ny) => halfW * smoothProfile(ny, widthStops),
            (ny) => halfD * smoothProfile(ny, depthStops)
        );
    }

    geo.translate(spec.center[0] * scale.x, spec.center[1] * scale.y, spec.center[2] * scale.z);
    return geo;
}

/**
 * Sculpted 8-sided quadruped trunk running along Z with ribcage, tucked flank, and hindquarters.
 */
export function createQuadrupedTorso(spec, scale) {
    const halfW = (spec.size[0] * scale.x) / 2;
    const halfH = (spec.size[1] * scale.y) / 2;
    const depth = spec.size[2] * scale.z;
    const geo = new THREE.CylinderGeometry(1, 1, depth, 8, 5);
    const widthStops = [[-1, 0.64], [-0.6, 0.96], [-0.1, 0.86], [0.5, 1.05], [1, 0.72]];
    const heightStops = [[-1, 0.68], [-0.6, 0.98], [-0.1, 0.88], [0.5, 1.12], [1, 0.76]];
    scaleCylinderRings(
        geo,
        depth / 2,
        (nz) => halfW * smoothProfile(nz, widthStops),
        (nz) => halfH * smoothProfile(nz, heightStops)
    );
    geo.rotateX(Math.PI / 2);
    geo.computeVertexNormals();
    geo.translate(spec.center[0] * scale.x, spec.center[1] * scale.y, spec.center[2] * scale.z);
    return geo;
}

/**
 * Sculpted 8-sided non-humanoid skull tapering from cranium toward brow and muzzle.
 */
export function createAnimalHead(spec, scale) {
    const halfW = (spec.size[0] * scale.x) / 2;
    const halfH = (spec.size[1] * scale.y) / 2;
    const depth = spec.size[2] * scale.z;
    const geo = new THREE.CylinderGeometry(1, 1, depth, 8, 3);
    const widthStops = [[-1, 0.76], [-0.3, 1.02], [0.4, 0.88], [1, 0.62]];
    const heightStops = [[-1, 0.78], [-0.3, 1.00], [0.4, 0.84], [1, 0.58]];
    scaleCylinderRings(
        geo,
        depth / 2,
        (nz) => halfW * smoothProfile(nz, widthStops),
        (nz) => halfH * smoothProfile(nz, heightStops)
    );
    geo.rotateX(Math.PI / 2);
    geo.computeVertexNormals();
    geo.translate(spec.center[0] * scale.x, spec.center[1] * scale.y, spec.center[2] * scale.z);
    return geo;
}

/**
 * Low-poly faceted ovoid for arachnid/insectoid body segments and radial centers.
 */
export function createOvoid(size, center, scale, radialSegs = 8, heightSegs = 5) {
    const geo = new THREE.SphereGeometry(0.5, radialSegs, heightSegs);
    clampUVs(geo);
    geo.scale(size[0] * scale.x, size[1] * scale.y, size[2] * scale.z);
    geo.translate(center[0] * scale.x, center[1] * scale.y, center[2] * scale.z);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Tapered octagonal cylinder for non-humanoid necks and similar cylindrical segments.
 */
export function createTaperedCylinder(size, center, scale, topRatio = 0.85, botRatio = 1.05, radialSegs = 8) {
    const geo = new THREE.CylinderGeometry(0.5 * topRatio, 0.5 * botRatio, size[1] * scale.y, radialSegs, 2);
    geo.scale(size[0] * scale.x, 1, size[2] * scale.z);
    geo.translate(center[0] * scale.x, center[1] * scale.y, center[2] * scale.z);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Sculpted low-poly limb segment with anatomical muscle/taper profiles.
 */
export function createLimbSegment(comp, index, chainLength, thickness, length, humanoid) {
    const radialSegs = humanoid || comp.mixin === MIXINS.LEG ? 8 : 6;
    const heightSegs = humanoid ? 3 : 2;
    const geo = new THREE.CylinderGeometry(1, 1, length, radialSegs, heightSegs);

    let stops;
    if (humanoid && comp.mixin === MIXINS.LEG) {
        stops = index === 0
            ? [[-1, 0.60], [-0.33, 0.58], [0.33, 0.50], [1, 0.42]]
            : [[-1, 0.42], [-0.33, 0.46], [0.33, 0.36], [1, 0.27]];
    } else if (humanoid && comp.mixin === MIXINS.ARM) {
        stops = index === 0
            ? [[-1, 0.54], [-0.33, 0.52], [0.33, 0.46], [1, 0.40]]
            : [[-1, 0.42], [-0.33, 0.44], [0.33, 0.36], [1, 0.30]];
    } else {
        const segCount = Math.max(1, chainLength - 1);
        const isPointed = comp.mixin === MIXINS.SPIDER_LEG || comp.mixin === MIXINS.TENTACLE || comp.type === COMPONENT_TYPES.TAIL;
        const startTaper = 0.54 * (1 - 0.35 * (index / segCount));
        const endTaper = isPointed && index === segCount - 1
            ? 0.14
            : 0.54 * (1 - 0.35 * ((index + 1) / segCount));
        stops = [[-1, startTaper], [1, endTaper]];
    }

    scaleCylinderRings(
        geo,
        length / 2,
        (ny) => thickness * smoothProfile(ny, stops),
        (ny) => thickness * smoothProfile(ny, stops) * (humanoid ? 0.94 : 1)
    );
    return geo;
}

/**
 * Low-poly faceted sphere joint cap.
 */
export function createJointCap(radius) {
    return clampUVs(new THREE.SphereGeometry(radius, 6, 4));
}

/**
 * PS1-era low-poly sculpted hand (tapered 6-sided palm/mitten wedge with an integrated thumb).
 */
export function createHand(ext, side, scale) {
    const w = ext.size[0] * scale.x;
    const h = ext.size[1] * scale.y;
    const d = ext.size[2] * scale.z;
    const cx = ext.center[0] * scale.x;
    const cz = ext.center[2] * scale.z;
    const dir = side === 'left' ? -1 : 1;

    // Tapered 6-sided hand blade: slim wrist -> broad knuckles -> tapered fingertips
    const hand = new THREE.CylinderGeometry(1, 1, h, 6, 3);
    const widthStops = [[-1, 0.34], [-0.25, 0.48], [0.35, 0.46], [1, 0.36]];
    const depthStops = [[-1, 0.28], [-0.25, 0.46], [0.35, 0.48], [1, 0.40]];
    scaleCylinderRings(
        hand,
        h / 2,
        (ny) => w * smoothProfile(ny, widthStops),
        (ny) => d * smoothProfile(ny, depthStops)
    );
    hand.translate(cx, -h / 2, cz);

    // Integrated thumb wedge on the inner side
    const thumbLen = h * 0.36;
    const thumb = new THREE.CylinderGeometry(w * 0.09, w * 0.12, thumbLen, 4, 1);
    thumb.rotateY(Math.PI / 4);
    thumb.scale(1, 1, Math.min(1, (d * 0.44) / (w * 0.12)));
    thumb.rotateZ(-dir * 0.32);
    thumb.rotateX(-0.14);
    thumb.translate(cx - dir * 0.41 * w, -h * 0.36, cz + d * 0.10);
    thumb.computeVertexNormals();

    const merged = BufferGeometryUtils.mergeGeometries([hand, thumb]);
    hand.dispose();
    thumb.dispose();
    return merged;
}

/**
 * Low-poly tapered foot / boot (humanoid) or paw / hoof (quadruped).
 */
export function createFoot(ext, scale, humanoid) {
    const halfW = (ext.size[0] * scale.x) / 2;
    const halfH = (ext.size[1] * scale.y) / 2;
    const depth = ext.size[2] * scale.z;
    const geo = new THREE.CylinderGeometry(1, 1, depth, 6, 3);
    const widthStops = humanoid
        ? [[-1, 0.76], [-0.2, 0.92], [0.4, 1.0], [1, 0.68]]
        : [[-1, 0.85], [0.3, 1.0], [1, 0.72]];
    const heightStops = humanoid
        ? [[-1, 0.95], [-0.2, 0.98], [0.4, 0.72], [1, 0.48]]
        : [[-1, 0.95], [0.3, 0.90], [1, 0.65]];
    scaleCylinderRings(
        geo,
        depth / 2,
        (nz) => halfW * smoothProfile(nz, widthStops),
        (nz) => halfH * smoothProfile(nz, heightStops)
    );
    geo.rotateX(Math.PI / 2);
    geo.computeVertexNormals();
    geo.translate(ext.center[0] * scale.x, ext.center[1] * scale.y, ext.center[2] * scale.z);
    return geo;
}

/**
 * Sculpted low-poly side ear (tapered 6-sided helix/lobe).
 */
export function createEar(w, h, cx, cy, cz, sx, earSize, scale) {
    const earH = 0.055 * earSize * scale.y;
    const geo = new THREE.CylinderGeometry(0.011 * scale.x, 0.008 * scale.x, earH, 6, 2);
    geo.scale(1, 1, 1.8);
    geo.rotateZ(-sx * 0.18);
    geo.rotateY(sx * 0.2);
    geo.translate((cx + sx * (w / 2 + 0.008)) * scale.x, (cy - 0.02 * h) * scale.y, cz * scale.z);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Pointed 4-sided upright animal ear.
 */
export function createUprightEar(w, top, cz, sx, earSize, scale) {
    const earH = 0.075 * earSize * scale.y;
    const geo = new THREE.ConeGeometry(0.024 * scale.x, earH, 4);
    geo.rotateY(Math.PI / 4);
    geo.rotateZ(-sx * 0.16);
    geo.translate((sx * w * 0.3) * scale.x, (top + 0.032) * scale.y, cz * scale.z);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Tapered 6-sided animal snout.
 */
export function createSnout(w, h, d, center, scale) {
    const geo = new THREE.CylinderGeometry(0.62, 1.0, d * scale.z, 6, 2);
    geo.rotateX(Math.PI / 2);
    geo.scale((w * scale.x) / 2, (h * scale.y) / 2, 1);
    geo.translate(center[0] * scale.x, center[1] * scale.y, center[2] * scale.z);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Tapered low-poly hair lock for sideburns, temple bangs, and nape.
 */
export function createHairLock(w, h, d, center, rotX, rotZ, scale) {
    const geo = new THREE.CylinderGeometry(0.92, 0.45, h * scale.y, 4, 2);
    geo.rotateY(Math.PI / 4);
    geo.scale((w * scale.x) * 0.7, 1, (d * scale.z) * 0.7);
    if (rotX) geo.rotateX(rotX);
    if (rotZ) geo.rotateZ(rotZ);
    geo.translate(center[0] * scale.x, center[1] * scale.y, center[2] * scale.z);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Thin closed 3D bat/dragon wing membrane spanning the wing bone chain to the torso.
 */
export function createWingMembrane(chain, scale) {
    const p0 = new THREE.Vector3(0, 0, 0);
    const p1 = chain[1] ? chain[1].position.clone() : new THREE.Vector3(0.22 * scale.x, 0.1 * scale.y, -0.04 * scale.z);
    const p2 = chain[2] ? p1.clone().add(chain[2].position) : p1.clone().add(new THREE.Vector3(0.20 * scale.x, 0.02 * scale.y, -0.06 * scale.z));
    const side = Math.sign(p1.x) || 1;
    const rootBottom = new THREE.Vector3(-side * 0.02 * scale.x, -0.30 * scale.y, 0.01 * scale.z);
    const midTrail = new THREE.Vector3(p1.x * 0.85, p1.y - 0.28 * scale.y, p1.z - 0.02 * scale.z);
    const tipTrail = new THREE.Vector3(p2.x * 0.92, p2.y - 0.22 * scale.y, p2.z - 0.02 * scale.z);

    const pts = [p0, p1, p2, tipTrail, midTrail, rootBottom];
    const thickness = 0.005 * scale.z;
    const positions = [];
    const uvs = [];
    const uvCoords = [
        [0.1, 0.95], [0.55, 0.95], [0.98, 0.90],
        [0.90, 0.20], [0.50, 0.10], [0.10, 0.15]
    ];

    for (const offsetZ of [thickness, -thickness]) {
        for (let i = 0; i < pts.length; i++) {
            positions.push(pts[i].x, pts[i].y, pts[i].z + offsetZ);
            uvs.push(uvCoords[i][0], uvCoords[i][1]);
        }
    }

    const frontTris = [[0, 4, 1], [1, 4, 3], [1, 3, 2], [0, 5, 4]];
    const indices = [];
    for (const [a, b, c] of frontTris) {
        if (side >= 0) indices.push(a, b, c);
        else indices.push(a, c, b);
    }
    const n = pts.length;
    for (const [a, b, c] of frontTris) {
        if (side >= 0) indices.push(n + a, n + c, n + b);
        else indices.push(n + a, n + b, n + c);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Slender tapered 6-sided antenna with a faceted tip bulb.
 */
export function createAntenna(side, topY) {
    const shaft = new THREE.CylinderGeometry(0.005, 0.011, 0.21, 6, 2);
    shaft.translate(0, 0.105, 0);
    const bulb = clampUVs(new THREE.SphereGeometry(0.015, 6, 4));
    bulb.translate(0, 0.21, 0);
    const geo = BufferGeometryUtils.mergeGeometries([shaft, bulb]);
    shaft.dispose();
    bulb.dispose();
    geo.rotateZ(-side * 0.3);
    geo.rotateX(0.18);
    geo.translate(side * 0.055, topY - 0.01, 0.02);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Pointed 4-sided avian beak.
 */
export function createBeak(w, h, d, center, scale) {
    const geo = new THREE.ConeGeometry(Math.max(w, h) * 0.45 * scale.x, d * scale.z, 4);
    geo.rotateY(Math.PI / 4);
    geo.rotateX(Math.PI / 2);
    geo.translate(center[0] * scale.x, center[1] * scale.y, center[2] * scale.z);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Faceted 6-sided double-terminated crystal prism for crystalline body plans.
 */
export function createCrystal(size, center, scale) {
    const halfW = (size[0] * scale.x) / 2;
    const height = size[1] * scale.y;
    const halfD = (size[2] * scale.z) / 2;
    const geo = new THREE.CylinderGeometry(1, 1, height, 6, 3);
    scaleCylinderRings(
        geo,
        height / 2,
        (ny) => halfW * (1 - 0.72 * Math.abs(ny)),
        (ny) => halfD * (1 - 0.72 * Math.abs(ny))
    );
    geo.translate(center[0] * scale.x, center[1] * scale.y, center[2] * scale.z);
    return geo;
}

/**
 * Curved 2-segment tapered 6-sided horn.
 */
export function createHorn(side, topY) {
    const base = new THREE.CylinderGeometry(0.018, 0.028, 0.09, 6, 2);
    base.translate(0, 0.045, 0);
    const tip = new THREE.ConeGeometry(0.018, 0.09, 6);
    tip.rotateZ(side * 0.35);
    tip.rotateX(-0.2);
    tip.translate(-side * 0.014, 0.125, -0.008);
    const geo = BufferGeometryUtils.mergeGeometries([base, tip]);
    base.dispose();
    tip.dispose();
    geo.rotateZ(-side * 0.48);
    geo.translate(side * 0.08, topY - 0.01, 0.01);
    geo.computeVertexNormals();
    return geo;
}
