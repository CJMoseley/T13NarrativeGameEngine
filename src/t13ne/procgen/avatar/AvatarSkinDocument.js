import { ATLAS_SIZE, LEGACY_ATLAS_SIZE, createAtlasTexture } from './AvatarAtlas.js';

/**
 * Persist the atlas together with the exact UV layout it was painted for.
 */
export function exportSkinDocument(mesh) {
    const atlas = mesh?.userData?.avatarAtlas;
    if (!atlas) throw new TypeError('An avatar atlas is required.');
    return {
        format: 't13-avatar-skin',
        version: atlas.version,
        bodyPlan: atlas.bodyPlan,
        regions: structuredClone(atlas.regions),
        pixels: Array.from(atlas.pixels)
    };
}

/**
 * Replace a live atlas only if every region matches the destination avatar.
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
    const sourceSize = legacy ? LEGACY_ATLAS_SIZE : ATLAS_SIZE;
    if (!Array.isArray(document.pixels) || document.pixels.length !== sourceSize * sourceSize * 4 ||
        document.pixels.some(value => !Number.isInteger(value) || value < 0 || value > 255)) {
        throw new Error('Skin document contains invalid RGBA pixels.');
    }
    let pixels = Uint8Array.from(document.pixels);
    if (legacy) {
        const source = pixels;
        pixels = new Uint8Array(atlas.pixels);
        for (const [key, target] of Object.entries(atlas.regions)) {
            const oldKey = atlas.legacyRegionKeys[key] ?? key;
            const old = targetRegions[oldKey];
            if (!old) throw new Error(`Legacy skin region is missing for ${key}.`);
            for (let row = 0; row < target.h; row++) {
                const start = ((old.y + row) * sourceSize + old.x) * 4;
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
}
