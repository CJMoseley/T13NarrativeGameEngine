import { ATLAS_SIZE, LEGACY_ATLAS_SIZE, createAtlasTexture } from './AvatarAtlas.js';
import { applySculptProfile, setAccessory, removeAccessory } from './AvatarSculptor.js';

/**
 * Persist the atlas together with the exact UV layout it was painted for,
 * plus optional low-poly sculpt profile and detachable accessory slots.
 */
export function exportSkinDocument(mesh) {
    const atlas = mesh?.userData?.avatarAtlas;
    if (!atlas) throw new TypeError('An avatar atlas is required.');
    const doc = {
        format: 't13-avatar-skin',
        version: atlas.version,
        bodyPlan: atlas.bodyPlan,
        regions: structuredClone(atlas.regions),
        pixels: Array.from(atlas.pixels)
    };
    if (mesh.userData?.sculptProfile) {
        doc.sculpt = structuredClone(mesh.userData.sculptProfile);
    }
    if (mesh.userData?.accessories && Object.keys(mesh.userData.accessories).length > 0) {
        doc.accessories = structuredClone(mesh.userData.accessories);
    }
    return doc;
}

/**
 * Replace a live atlas (and optional sculpt/accessories) only if every region matches the destination avatar.
 */
export function importSkinDocument(mesh, document) {
    const atlas = mesh?.userData?.avatarAtlas;
    if (!atlas || !mesh.material?.map?.isDataTexture) throw new TypeError('An avatar atlas is required.');
    if (!document || document.format !== 't13-avatar-skin' ||
        (document.version !== atlas.version && document.version !== 1) || document.bodyPlan !== atlas.bodyPlan ||
        !document.regions || typeof document.regions !== 'object' || Array.isArray(document.regions)) {
        throw new Error('Skin format, atlas version or body plan does not match this avatar.');
    }
    const legacy = document.version === 1;
    const targetRegions = legacy ? atlas.legacyRegions : atlas.regions;
    if (!targetRegions) throw new Error('Legacy skin migration is unavailable for this avatar.');
    const keys = Object.keys(targetRegions);
    if (Object.keys(document.regions).length !== keys.length || keys.some(key => {
        const source = document.regions[key];
        const target = targetRegions[key];
        return !source || ['key', 'x', 'y', 'w', 'h'].some(field => source[field] !== target[field]);
    })) {
        throw new Error('Skin atlas layout does not match this avatar.');
    }
    const size = legacy ? LEGACY_ATLAS_SIZE : ATLAS_SIZE;
    const rawPixels = Array.isArray(document.pixels)
        ? document.pixels
        : ((typeof document.regionRleRgb24Base64 === 'string' || typeof document.regionRleRgb565Base64 === 'string' ||
            typeof document.regionRgbBase64 === 'string' || typeof document.regionRgb565Base64 === 'string')
            ? decodeSkinSyncPayload(document).pixels
            : (Array.isArray(document.rlePixels) ? decodeRleRgba(document.rlePixels, size * size * 4) : null));

    if (!Array.isArray(rawPixels) || rawPixels.length !== size * size * 4 ||
        rawPixels.some(value => !Number.isInteger(value) || value < 0 || value > 255)) {
        throw new Error('Skin document contains invalid RGBA pixels.');
    }
    let pixels = Uint8Array.from(rawPixels);
    if (legacy) {
        const source = pixels;
        pixels = new Uint8Array(atlas.pixels);
        for (const [key, target] of Object.entries(atlas.regions)) {
            const oldKey = atlas.legacyRegionKeys[key] ?? key;
            const old = targetRegions[oldKey];
            if (!old) throw new Error(`Legacy skin region is missing for ${key}.`);
            for (let row = 0; row < target.h; row++) {
                const start = ((old.y + row) * size + old.x) * 4;
                pixels.set(source.subarray(start, start + target.w * 4), ((target.y + row) * ATLAS_SIZE + target.x) * 4);
            }
        }
    }
    const texture = createAtlasTexture(pixels);
    const previous = mesh.material.map;
    atlas.pixels = pixels;
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
    previous.dispose();

    if (document.sculpt && typeof document.sculpt === 'object') {
        applySculptProfile(mesh, document.sculpt);
    }
    if (document.accessories && typeof document.accessories === 'object') {
        for (const slot of Object.keys(mesh.userData?.accessories || {})) {
            removeAccessory(mesh, slot);
        }
        for (const [slot, entry] of Object.entries(document.accessories)) {
            if (entry?.preset) {
                setAccessory(mesh, entry.preset, { slot, colour: entry.colour });
            }
        }
    }
}

/**
 * Run-length encodes RGBA pixels as packed uint32 [count, r, g, b, a, ...] for compact P2P SKIN_SYNC.
 */
export function encodeRleRgba(pixels) {
    const out = [];
    const total = pixels.length;
    let i = 0;
    while (i < total) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
        let count = 1;
        while (i + count * 4 < total && count < 65535 &&
            pixels[i + count * 4] === r &&
            pixels[i + count * 4 + 1] === g &&
            pixels[i + count * 4 + 2] === b &&
            pixels[i + count * 4 + 3] === a) {
            count++;
        }
        out.push(count, r, g, b, a);
        i += count * 4;
    }
    return out;
}

export function decodeRleRgba(rle, expectedBytes) {
    const out = [];
    for (let i = 0; i + 4 < rle.length; i += 5) {
        const count = rle[i];
        const r = rle[i + 1], g = rle[i + 2], b = rle[i + 3], a = rle[i + 4];
        if (!Number.isInteger(count) || count < 1 || out.length + count * 4 > expectedBytes) {
            throw new Error('Malformed RLE pixel payload.');
        }
        for (let k = 0; k < count; k++) out.push(r, g, b, a);
    }
    return out;
}

function uint8ToBase64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
        bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin);
}

function base64ToUint8(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        out[i] = bin.charCodeAt(i);
    }
    return out;
}

function packBitsEncodeBytes(src, stride) {
    const count = Math.floor(src.length / stride);
    const out = [];
    let i = 0;
    const eq = (a, b) => {
        for (let k = 0; k < stride; k++) {
            if (src[a * stride + k] !== src[b * stride + k]) return false;
        }
        return true;
    };
    while (i < count) {
        let run = 1;
        while (i + run < count && run < 128 && eq(i, i + run)) run++;
        if (run >= 2) {
            out.push(run - 1);
            for (let k = 0; k < stride; k++) out.push(src[i * stride + k]);
            i += run;
        } else {
            let litStart = i;
            let litLen = 0;
            while (i + litLen < count && litLen < 128) {
                if (i + litLen + 1 < count && eq(i + litLen, i + litLen + 1)) break;
                litLen++;
            }
            if (litLen === 0) litLen = 1;
            out.push(127 + litLen);
            for (let p = 0; p < litLen; p++) {
                const idx = (litStart + p) * stride;
                for (let k = 0; k < stride; k++) out.push(src[idx + k]);
            }
            i += litLen;
        }
    }
    return new Uint8Array(out);
}

function packBitsDecodeBytes(encoded, stride, expectedPixels) {
    const out = new Uint8Array(expectedPixels * stride);
    let srcIdx = 0;
    let dstPixel = 0;
    while (srcIdx < encoded.length && dstPixel < expectedPixels) {
        const ctrl = encoded[srcIdx++];
        if (ctrl < 128) {
            const count = ctrl + 1;
            for (let r = 0; r < count && dstPixel < expectedPixels; r++) {
                for (let k = 0; k < stride; k++) {
                    out[dstPixel * stride + k] = encoded[srcIdx + k] ?? 0;
                }
                dstPixel++;
            }
            srcIdx += stride;
        } else {
            const count = ctrl - 127;
            for (let r = 0; r < count && dstPixel < expectedPixels; r++) {
                for (let k = 0; k < stride; k++) {
                    out[dstPixel * stride + k] = encoded[srcIdx++] ?? 0;
                }
                dstPixel++;
            }
        }
    }
    return out;
}

/**
 * Encodes a skin document into a compact wire-ready payload suitable for P2P SKIN_SYNC (< 131 KB).
 * Uses PackBits RLE over active atlas regions (lossless RGB24, falling back to RGB565 for dense multi-limb plans).
 */
export function encodeSkinSyncPayload(doc) {
    const atlasSize = doc.version === 1 ? LEGACY_ATLAS_SIZE : ATLAS_SIZE;
    const regionEntries = Object.entries(doc.regions || {}).sort(([a], [b]) => a.localeCompare(b));
    let totalRegionPixels = 0;
    for (const [, rect] of regionEntries) {
        totalRegionPixels += rect.w * rect.h;
    }

    const rgb = new Uint8Array(totalRegionPixels * 3);
    let offset = 0;
    for (const [, rect] of regionEntries) {
        for (let y = rect.y; y < rect.y + rect.h; y++) {
            for (let x = rect.x; x < rect.x + rect.w; x++) {
                const src = (y * atlasSize + x) * 4;
                rgb[offset++] = doc.pixels[src];
                rgb[offset++] = doc.pixels[src + 1];
                rgb[offset++] = doc.pixels[src + 2];
            }
        }
    }

    const rle24 = packBitsEncodeBytes(rgb, 3);
    const payload = {
        format: doc.format,
        version: doc.version,
        bodyPlan: doc.bodyPlan,
        regions: doc.regions,
        ...(doc.sculpt ? { sculpt: doc.sculpt } : {}),
        ...(doc.accessories ? { accessories: doc.accessories } : {})
    };

    if (rle24.length <= 88000) {
        payload.regionRleRgb24Base64 = uint8ToBase64(rle24);
    } else {
        const rgb565 = new Uint8Array(totalRegionPixels * 2);
        for (let p = 0; p < totalRegionPixels; p++) {
            const r = rgb[p * 3] >> 3;
            const g = rgb[p * 3 + 1] >> 2;
            const b = rgb[p * 3 + 2] >> 3;
            const packed = (r << 11) | (g << 5) | b;
            rgb565[p * 2] = packed & 0xff;
            rgb565[p * 2 + 1] = (packed >> 8) & 0xff;
        }
        payload.regionRleRgb565Base64 = uint8ToBase64(packBitsEncodeBytes(rgb565, 2));
    }
    return payload;
}

export function decodeSkinSyncPayload(wireDoc) {
    const atlasSize = wireDoc.version === 1 ? LEGACY_ATLAS_SIZE : ATLAS_SIZE;
    const pixels = new Array(atlasSize * atlasSize * 4).fill(0);
    if (Array.isArray(wireDoc.pixels)) {
        return { ...wireDoc };
    }
    if (Array.isArray(wireDoc.rlePixels)) {
        return {
            format: wireDoc.format,
            version: wireDoc.version,
            bodyPlan: wireDoc.bodyPlan,
            regions: wireDoc.regions,
            pixels: decodeRleRgba(wireDoc.rlePixels, atlasSize * atlasSize * 4),
            ...(wireDoc.sculpt ? { sculpt: wireDoc.sculpt } : {}),
            ...(wireDoc.accessories ? { accessories: wireDoc.accessories } : {})
        };
    }

    const regionEntries = Object.entries(wireDoc.regions || {}).sort(([a], [b]) => a.localeCompare(b));
    let totalRegionPixels = 0;
    for (const [, rect] of regionEntries) totalRegionPixels += rect.w * rect.h;

    let rgb = null;
    let rgb565 = null;
    if (typeof wireDoc.regionRleRgb24Base64 === 'string') {
        rgb = packBitsDecodeBytes(base64ToUint8(wireDoc.regionRleRgb24Base64), 3, totalRegionPixels);
    } else if (typeof wireDoc.regionRleRgb565Base64 === 'string') {
        rgb565 = packBitsDecodeBytes(base64ToUint8(wireDoc.regionRleRgb565Base64), 2, totalRegionPixels);
    } else if (typeof wireDoc.regionRgbBase64 === 'string') {
        rgb = base64ToUint8(wireDoc.regionRgbBase64);
    } else if (typeof wireDoc.regionRgb565Base64 === 'string') {
        rgb565 = base64ToUint8(wireDoc.regionRgb565Base64);
    }

    if (rgb) {
        let offset = 0;
        for (const [, rect] of regionEntries) {
            for (let y = rect.y; y < rect.y + rect.h; y++) {
                for (let x = rect.x; x < rect.x + rect.w; x++) {
                    const dst = (y * atlasSize + x) * 4;
                    pixels[dst] = rgb[offset++] ?? 0;
                    pixels[dst + 1] = rgb[offset++] ?? 0;
                    pixels[dst + 2] = rgb[offset++] ?? 0;
                    pixels[dst + 3] = 255;
                }
            }
        }
    } else if (rgb565) {
        let offset = 0;
        for (const [, rect] of regionEntries) {
            for (let y = rect.y; y < rect.y + rect.h; y++) {
                for (let x = rect.x; x < rect.x + rect.w; x++) {
                    const lo = rgb565[offset++] ?? 0;
                    const hi = rgb565[offset++] ?? 0;
                    const packed = lo | (hi << 8);
                    const dst = (y * atlasSize + x) * 4;
                    pixels[dst] = ((packed >> 11) & 0x1f) << 3;
                    pixels[dst + 1] = ((packed >> 5) & 0x3f) << 2;
                    pixels[dst + 2] = (packed & 0x1f) << 3;
                    pixels[dst + 3] = 255;
                }
            }
        }
    }

    return {
        format: wireDoc.format,
        version: wireDoc.version,
        bodyPlan: wireDoc.bodyPlan,
        regions: wireDoc.regions,
        pixels,
        ...(wireDoc.sculpt ? { sculpt: wireDoc.sculpt } : {}),
        ...(wireDoc.accessories ? { accessories: wireDoc.accessories } : {})
    };
}
