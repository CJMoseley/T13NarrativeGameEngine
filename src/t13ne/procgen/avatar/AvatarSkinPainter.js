import { ATLAS_SIZE, TILE } from './AvatarAtlas.js';

/**
 * Paints a procedural avatar's atlas at a raycast intersection UV.
 * The owning UI is responsible for raycasting and managing brush controls.
 */
export class AvatarSkinPainter {
    constructor(mesh) {
        if (!mesh?.userData?.avatarAtlas || !mesh.material?.map?.isDataTexture) {
            throw new TypeError('AvatarSkinPainter requires a procedural avatar with an atlas texture.');
        }
        this.mesh = mesh;
    }

    /**
     * @param {THREE.Intersection} hit
     * @param {{colour: number, radius?: number}} brush
     * @returns {boolean} Whether the hit was painted.
     */
    paint(hit, { colour, radius = 1 }) {
        if (!Number.isInteger(colour) || colour < 0 || colour > 0xffffff ||
            !Number.isInteger(radius) || radius < 0 || radius > ATLAS_SIZE) {
            throw new RangeError('Brush colour must be RGB and radius must be an integer between 0 and the atlas size.');
        }
        let object = hit?.object;
        while (object && object !== this.mesh) object = object.parent;
        if (!object || !hit.uv ||
            !Number.isFinite(hit.uv.x) || !Number.isFinite(hit.uv.y) ||
            hit.uv.x < 0 || hit.uv.x > 1 || hit.uv.y < 0 || hit.uv.y > 1) return false;

        const x = Math.min(ATLAS_SIZE - 1, Math.floor(hit.uv.x * ATLAS_SIZE));
        const y = Math.min(ATLAS_SIZE - 1, Math.floor((1 - hit.uv.y) * ATLAS_SIZE));
        const atlas = this.mesh.userData.avatarAtlas;
        const rect = Object.values(atlas.regions).find(r =>
            x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
        if (!rect) return false;
        const faceX = rect.x + Math.floor((x - rect.x) / TILE) * TILE;
        const faceY = rect.y + Math.floor((y - rect.y) / TILE) * TILE;
        const texture = this.mesh.material.map;
        for (let py = Math.max(faceY, y - radius); py <= Math.min(faceY + TILE - 1, rect.y + rect.h - 1, y + radius); py++) {
            for (let px = Math.max(faceX, x - radius); px <= Math.min(faceX + TILE - 1, rect.x + rect.w - 1, x + radius); px++) {
                if ((px - x) ** 2 + (py - y) ** 2 > radius ** 2) continue;
                const rgba = [colour >> 16 & 255, colour >> 8 & 255, colour & 255, 255];
                atlas.pixels.set(rgba, (py * ATLAS_SIZE + px) * 4);
                texture.image.data.set(rgba, ((ATLAS_SIZE - 1 - py) * ATLAS_SIZE + px) * 4);
            }
        }
        texture.needsUpdate = true;
        return true;
    }
}
