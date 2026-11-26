/**
 * @module Avatar/AvatarAtlas
 * @description One RGBA atlas per avatar. Each body part and clothing slot owns a region, so the whole
 * colouring lives in one texture that can be exported as PNG and painted.
 */
import * as THREE from 'three';
import { hashSeed, mulberry32 } from './avatarRandom.js';

export const ATLAS_SIZE = 512;
export const ATLAS_VERSION = 2;
export const LEGACY_ATLAS_SIZE = 256;
export const TILE = 16;
// A region holds the six faces of a box in a 3x2 grid of tiles.
export const REGION_W = 3 * TILE;
export const REGION_H = 2 * TILE;
const COLS = Math.floor(ATLAS_SIZE / REGION_W);
const ROWS = Math.floor(ATLAS_SIZE / REGION_H);
export const ATLAS_CAPACITY = COLS * ROWS;
export const CLOTH_PATTERNS = ['plain', 'stripe', 'check', 'hoop'];

// Clothing slots are reserved first so their regions are the same whatever the body plan adds.
const RESERVED_KEYS = ['top:cloth', 'bottom:cloth'];

/**
 * Allocates a region per key the first time it is used. Generation order is deterministic, so a given body plan always gets the same layout.
 */
export class AvatarAtlas {
    constructor(size = ATLAS_SIZE) {
        this.size = size;
        this.regions = new Map();
        for (const key of RESERVED_KEYS) this.region(key);
    }

    /**
     * @param {string} key - `${partId}:${tone}`, or `${slot}:cloth` for clothing.
     * @returns {{key: string, x: number, y: number, w: number, h: number}}
     */
    region(key) {
        const existing = this.regions.get(key);
        if (existing) return existing;
        const slot = this.regions.size;
        const cols = Math.floor(this.size / REGION_W);
        const capacity = cols * Math.floor(this.size / REGION_H);
        if (slot >= capacity) {
            throw new Error(`Avatar atlas is full (${capacity} regions), cannot add "${key}".`);
        }
        const rect = {
            key,
            x: (slot % cols) * REGION_W,
            y: Math.floor(slot / cols) * REGION_H,
            w: REGION_W,
            h: REGION_H
        };
        this.regions.set(key, rect);
        return rect;
    }
}

/**
 * Rewrites a geometry's UVs into a region. Box faces each get their own tile, so painting one face does not paint its neighbours.
 * Half-texel insets stop nearest-filtered sampling from bleeding into the next region.
 * @param {THREE.BufferGeometry} geo
 * @param {{x: number, y: number, w: number, h: number}} rect
 * @returns {THREE.BufferGeometry}
 */
export function mapUVsToRegion(geo, rect) {
    const uv = geo.attributes.uv;
    if (!uv) throw new Error('Atlas mapping needs UVs on every part.');
    const isBox = geo.type === 'BoxGeometry';
    const parameters = geo.parameters;
    const faceCounts = isBox ? [
        (parameters.depthSegments + 1) * (parameters.heightSegments + 1),
        (parameters.depthSegments + 1) * (parameters.heightSegments + 1),
        (parameters.widthSegments + 1) * (parameters.depthSegments + 1),
        (parameters.widthSegments + 1) * (parameters.depthSegments + 1),
        (parameters.widthSegments + 1) * (parameters.heightSegments + 1),
        (parameters.widthSegments + 1) * (parameters.heightSegments + 1)
    ] : [];
    for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i);
        const v = uv.getY(i);
        let px, py;
        if (isBox || geo.userData.atlasFace !== undefined) {
            // BoxGeometry writes four vertices per face, in face order.
            let face = geo.userData.atlasFace ?? 0;
            let offset = i;
            if (isBox) while (face < 5 && offset >= faceCounts[face]) offset -= faceCounts[face++];
            const col = face % 3;
            const row = Math.floor(face / 3);
            px = rect.x + col * TILE + u * (TILE - 1) + 0.5;
            py = rect.y + row * TILE + (1 - v) * (TILE - 1) + 0.5;
        } else {
            px = rect.x + u * (rect.w - 1) + 0.5;
            py = rect.y + (1 - v) * (rect.h - 1) + 0.5;
        }
        uv.setXY(i, px / ATLAS_SIZE, 1 - py / ATLAS_SIZE);
    }
    uv.needsUpdate = true;
    return geo;
}

const toRgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const shade = (rgb, f) => rgb.map(c => Math.max(0, Math.min(255, Math.round(c * f))));
const mixRgb = (a, b, t) => a.map((c, i) => Math.max(0, Math.min(255, Math.round(c + (b[i] - c) * t))));

// Surface palettes for the 24 Formation material families (see FORMATION_MATERIALS in AvatarFacetBody.js).
// 'flesh' uses the character/species skinTone directly; non-flesh Formations style body surfaces by material.
export const FORMATION_PALETTES = Object.freeze({
    flesh: null,
    spirit: Object.freeze({ base: 0xd8e8f8, dark: 0x3b536b, hair: 0xeaf4ff, pattern: 'plain', noise: 0.08 }),
    stone: Object.freeze({ base: 0x7e7b75, dark: 0x3a3835, hair: 0x5d5a55, pattern: 'speckle', noise: 0.18 }),
    artifice: Object.freeze({ base: 0xc29b61, dark: 0x3d3020, hair: 0x6e5430, pattern: 'panel', noise: 0.08 }),
    society: Object.freeze({ base: 0xd4b483, dark: 0x352b24, hair: 0x4f3a2c, pattern: 'stripe', noise: 0.08 }),
    cryptic: Object.freeze({ base: 0x454954, dark: 0x181a20, hair: 0x2a2d36, pattern: 'plain', noise: 0.14 }),
    liquid: Object.freeze({ base: 0x3b7ea1, dark: 0x16384c, hair: 0x5aaad4, pattern: 'hoop', noise: 0.12 }),
    gas: Object.freeze({ base: 0xc5d6d8, dark: 0x4d6063, hair: 0xe1ecee, pattern: 'plain', noise: 0.16 }),
    simulacrum: Object.freeze({ base: 0xd8cbb8, dark: 0x3e352d, hair: 0x7a6b58, pattern: 'panel', noise: 0.05 }),
    clockwork: Object.freeze({ base: 0xb5893a, dark: 0x3f2c10, hair: 0x7c5920, pattern: 'check', noise: 0.09 }),
    illusion: Object.freeze({ base: 0xa56cc1, dark: 0x361c47, hair: 0xd09cf0, pattern: 'stripe', noise: 0.12 }),
    thought: Object.freeze({ base: 0x7ea3cc, dark: 0x23374d, hair: 0xb6d0ee, pattern: 'plain', noise: 0.07 }),
    dream: Object.freeze({ base: 0xb8a2d8, dark: 0x382c4d, hair: 0xe0d2f5, pattern: 'hoop', noise: 0.10 }),
    toxin: Object.freeze({ base: 0x6f8f38, dark: 0x283611, hair: 0x4b6321, pattern: 'speckle', noise: 0.18 }),
    data: Object.freeze({ base: 0x2f6b5e, dark: 0x0f2923, hair: 0x52c4aa, pattern: 'stripe', noise: 0.08 }),
    fire: Object.freeze({ base: 0xd95b26, dark: 0x4a1808, hair: 0xffb347, pattern: 'hoop', noise: 0.16 }),
    wood: Object.freeze({ base: 0x8b5a2b, dark: 0x38220f, hair: 0x4f6b2a, pattern: 'hoop', noise: 0.14 }),
    armour: Object.freeze({ base: 0x5c6670, dark: 0x22272c, hair: 0x3c444c, pattern: 'panel', noise: 0.08 }),
    vice: Object.freeze({ base: 0x8c3b4a, dark: 0x2e1017, hair: 0x421620, pattern: 'stripe', noise: 0.11 }),
    metal: Object.freeze({ base: 0x8d99a6, dark: 0x2c333b, hair: 0x677380, pattern: 'stripe', noise: 0.07 }),
    energy: Object.freeze({ base: 0x68c8e8, dark: 0x1a485c, hair: 0xd4f5ff, pattern: 'hoop', noise: 0.10 }),
    arcane: Object.freeze({ base: 0x6b4c9a, dark: 0x24163b, hair: 0xb08fe0, pattern: 'check', noise: 0.13 }),
    structure: Object.freeze({ base: 0x938b82, dark: 0x332f2b, hair: 0x635d56, pattern: 'panel', noise: 0.10 }),
    belief: Object.freeze({ base: 0xd8b863, dark: 0x473814, hair: 0xf2de9b, pattern: 'plain', noise: 0.08 })
});

const MOTTLE_OLIVE = [104, 114, 52];

// Adds a small seeded per-pixel variation so flat colour does not look plastic.
function noisy(pick, key, amount) {
    const rand = mulberry32(hashSeed(key));
    return (x, y) => shade(pick(x, y), 1 - amount / 2 + amount * rand());
}

// Adds deterministic blotchy Miasma mottling across 2x2 texel cells when mottle > 0.
function mottled(pick, key, mottle) {
    if (!mottle || mottle <= 0) return pick;
    const strength = Math.max(0, Math.min(1, mottle));
    const cellSalt = hashSeed(`mottle:${key}`);
    return (x, y) => {
        const base = pick(x, y);
        const cellHash = hashSeed(`${cellSalt}:${x >> 1}:${y >> 1}`);
        const sample = (cellHash & 0xffff) / 0xffff;
        if (sample > 0.35 + 0.35 * strength) return base;
        const blotch = ((cellHash >>> 16) & 0xff) / 255;
        const factor = strength * (0.22 + 0.28 * blotch);
        return mixRgb(shade(base, 1 - 0.18 * factor), MOTTLE_OLIVE, factor);
    };
}

function surfacePattern(rgb, pattern) {
    const dark = shade(rgb, 0.78);
    const light = shade(rgb, 1.10);
    switch (pattern) {
        case 'stripe': return (x) => (x % 4 < 2 ? rgb : dark);
        case 'check': return (x, y) => (((x >> 2) + (y >> 2)) % 2 ? rgb : dark);
        case 'hoop': return (x, y) => (y % 4 < 2 ? rgb : dark);
        case 'panel': return (x, y) => (x % 8 === 0 || y % 8 === 0 ? dark : (x % 8 === 1 || y % 8 === 1 ? light : rgb));
        case 'speckle': return (x, y) => (((x * 7 + y * 13) % 5 === 0) ? dark : rgb);
        default: return () => rgb;
    }
}

function clothPattern(rgb, pattern) {
    const dark = shade(rgb, 0.78);
    switch (pattern) {
        case 'stripe': return (x) => (x % 4 < 2 ? rgb : dark);
        case 'check': return (x, y) => (((x >> 2) + (y >> 2)) % 2 ? rgb : dark);
        case 'hoop': return (x, y) => (y % 4 < 2 ? rgb : dark);
        default: return () => rgb;
    }
}

function painterFor(key, palette) {
    const [base, tone, slot] = key.replace(/#\d+$/, '').split(':');
    const formationMat = palette.material && palette.material !== 'flesh' ? FORMATION_PALETTES[palette.material] : null;
    if (tone === 'cloth') {
        const cloth = palette.clothing?.[slot ?? base] ?? { colour: 0x6b6b6b, pattern: 'plain' };
        return noisy(clothPattern(toRgb(cloth.colour), cloth.pattern), key, 0.06);
    }
    if (tone === 'dark') return () => toRgb(formationMat && !palette.preserveDark ? formationMat.dark : palette.dark);
    if (tone === 'hair') return () => toRgb(formationMat && !palette.preserveHair ? formationMat.hair : palette.hair);
    if (formationMat && !palette.preserveSkin) {
        const matBase = palette.skinTintFn ? palette.skinTintFn(formationMat.base) : formationMat.base;
        return mottled(noisy(surfacePattern(toRgb(matBase), formationMat.pattern), key, formationMat.noise), key, palette.mottle);
    }
    return mottled(noisy(() => toRgb(palette.skin), key, 0.12), key, palette.mottle);
}

/**
 * Fills every region with its default colour. Output is RGBA, top row first, fully opaque.
 * @param {AvatarAtlas} atlas
 * @param {{skin: number, dark: number, hair: number, clothing?: object}} palette
 * @returns {Uint8Array}
 */
export function paintAtlas(atlas, palette) {
    const pixels = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4);
    for (const rect of atlas.regions.values()) {
        const colourAt = painterFor(rect.key, palette);
        for (let y = 0; y < rect.h; y++) {
            for (let x = 0; x < rect.w; x++) {
                const [r, g, b] = colourAt(x, y);
                const o = ((rect.y + y) * ATLAS_SIZE + rect.x + x) * 4;
                pixels[o] = r;
                pixels[o + 1] = g;
                pixels[o + 2] = b;
                pixels[o + 3] = 255;
            }
        }
    }
    return pixels;
}

/**
 * Wraps atlas pixels in a texture. Rows are flipped here because DataTexture is bottom-up in UV space.
 * @param {Uint8Array} pixels - Top-down RGBA, as produced by paintAtlas.
 * @returns {THREE.DataTexture}
 */
export function createAtlasTexture(pixels) {
    const rowBytes = ATLAS_SIZE * 4;
    const flipped = new Uint8Array(pixels.length);
    for (let y = 0; y < ATLAS_SIZE; y++) {
        flipped.set(pixels.subarray(y * rowBytes, (y + 1) * rowBytes), (ATLAS_SIZE - 1 - y) * rowBytes);
    }
    const texture = new THREE.DataTexture(flipped, ATLAS_SIZE, ATLAS_SIZE, THREE.RGBAFormat);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}
