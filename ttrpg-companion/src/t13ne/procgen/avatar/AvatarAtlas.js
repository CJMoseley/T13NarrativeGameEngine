/**
 * @module Avatar/AvatarAtlas
 * @description One RGBA atlas per avatar. Each body part and clothing slot owns a region, so the whole
 * colouring lives in one 256x256 texture that can be exported as PNG and painted.
 */
import * as THREE from 'three';
import { hashSeed, mulberry32 } from './avatarRandom.js';

export const ATLAS_SIZE = 256;
export const ATLAS_VERSION = 1;
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
    constructor() {
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
        if (slot >= ATLAS_CAPACITY) {
            throw new Error(`Avatar atlas is full (${ATLAS_CAPACITY} regions), cannot add "${key}".`);
        }
        const rect = {
            key,
            x: (slot % COLS) * REGION_W,
            y: Math.floor(slot / COLS) * REGION_H,
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
    for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i);
        const v = uv.getY(i);
        let px, py;
        if (isBox) {
            // BoxGeometry writes four vertices per face, in face order.
            const face = Math.floor(i / 4);
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
const shade = (rgb, f) => rgb.map(c => Math.min(255, Math.round(c * f)));

// Adds a small seeded per-pixel variation so flat colour does not look plastic.
function noisy(pick, key, amount) {
    const rand = mulberry32(hashSeed(key));
    return (x, y) => shade(pick(x, y), 1 - amount / 2 + amount * rand());
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
    const [base, tone, slot] = key.split(':');
    if (tone === 'cloth') {
        const cloth = palette.clothing?.[slot ?? base] ?? { colour: 0x6b6b6b, pattern: 'plain' };
        return noisy(clothPattern(toRgb(cloth.colour), cloth.pattern), key, 0.06);
    }
    if (tone === 'dark') return () => toRgb(palette.dark);
    if (tone === 'hair') return () => toRgb(palette.hair);
    return noisy(() => toRgb(palette.skin), key, 0.12);
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
