import { ATLAS_SIZE, createAtlasTexture } from './AvatarAtlas.js';

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
        document.version !== atlas.version || document.bodyPlan !== atlas.bodyPlan ||
        !document.regions || typeof document.regions !== 'object' || Array.isArray(document.regions)) {
        throw new Error('Skin format, atlas version or body plan does not match this avatar.');
    }
    const keys = Object.keys(atlas.regions);
    if (Object.keys(document.regions).length !== keys.length || keys.some(key => {
        const source = document.regions[key];
        const target = atlas.regions[key];
        return !source || ['key', 'x', 'y', 'w', 'h'].some(field => source[field] !== target[field]);
    })) {
        throw new Error('Skin atlas layout does not match this avatar.');
    }
    if (!Array.isArray(document.pixels) || document.pixels.length !== ATLAS_SIZE * ATLAS_SIZE * 4 ||
        document.pixels.some(value => !Number.isInteger(value) || value < 0 || value > 255)) {
        throw new Error('Skin document contains invalid RGBA pixels.');
    }
    const pixels = Uint8Array.from(document.pixels);
    const texture = createAtlasTexture(pixels);
    const previous = mesh.material.map;
    atlas.pixels = pixels;
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
    previous.dispose();
}
