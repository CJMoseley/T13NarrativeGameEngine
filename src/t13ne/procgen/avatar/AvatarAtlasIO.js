/**
 * @module Avatar/AvatarAtlasIO
 * @description Browser-only PNG export and import for avatar atlases. Pixels stay top-down, matching the PNG.
 */
import { ATLAS_SIZE } from './AvatarAtlas.js';

/**
 * @param {Uint8Array} pixels - RGBA atlas pixels, top row first.
 * @returns {Promise<Blob>} PNG blob, 256x256.
 */
export function atlasToPngBlob(pixels) {
    const canvas = document.createElement('canvas');
    canvas.width = ATLAS_SIZE;
    canvas.height = ATLAS_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels), ATLAS_SIZE, ATLAS_SIZE), 0, 0);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encode failed'))), 'image/png');
    });
}

/**
 * @param {Blob|File} blob - A 256x256 PNG.
 * @returns {Promise<Uint8Array>} RGBA atlas pixels, ready for variant.atlasPixels.
 */
export async function pngBlobToAtlasPixels(blob) {
    const bitmap = await createImageBitmap(blob);
    if (bitmap.width !== ATLAS_SIZE || bitmap.height !== ATLAS_SIZE) {
        throw new Error(`Avatar skin PNG must be ${ATLAS_SIZE}x${ATLAS_SIZE}, got ${bitmap.width}x${bitmap.height}.`);
    }
    const canvas = document.createElement('canvas');
    canvas.width = ATLAS_SIZE;
    canvas.height = ATLAS_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return new Uint8Array(ctx.getImageData(0, 0, ATLAS_SIZE, ATLAS_SIZE).data);
}
