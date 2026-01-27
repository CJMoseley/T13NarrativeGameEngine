import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

/**
 * @module UHPP/SurfaceSynth
 * @description Phase E: Surface Reconstruction. Converts voxels to continuous manifold mesh.
 */
export class SurfaceSynth {
    constructor() {
    }

    /**
     * @param {object} context
     */
    async execute(context) {
        const {
            grid,
            gridDimensions,
            surfaceMethod = 'MARCHING_CUBES',
            material = new THREE.MeshStandardMaterial({ color: 0x888888 })
        } = context;

        if (!grid) return context;

        if (surfaceMethod === 'MARCHING_CUBES') {
            context.mesh = this._generateMarchingCubes(grid, gridDimensions, material);
        } else {
            // Default to discrete instancing handled by RenderBridge
            context.mesh = null;
        }

        console.log(`SurfaceSynth: Surface reconstruction complete (${surfaceMethod}).`);
        return context;
    }

    /**
     * @private
     */
    _generateMarchingCubes(grid, dims, material) {
        const resolution = Math.max(dims.x, dims.y, dims.z);
        const effect = new MarchingCubes(resolution, material, true, false, 100000);

        effect.position.set(0, 0, 0);
        effect.scale.set(dims.x, dims.y, dims.z);

        // Fill the scalar field
        // MarchingCubes.js expects a field of size resolution^3
        const size = resolution;
        for (let z = 0; z < dims.z; z++) {
            for (let y = 0; y < dims.y; y++) {
                for (let x = 0; x < dims.x; x++) {
                    const idx = x + y * dims.x + z * dims.x * dims.y;
                    const val = grid[idx];

                    if (val > 0) {
                        // In MarchingCubes, we usually set a value > threshold at the voxel center
                        // This implementation is a bit simplified
                        this._setVoxel(effect, x, y, z, size, 1.0);
                    }
                }
            }
        }

        effect.update();
        return effect;
    }

    /**
     * Internal helper to set voxel in Three.js MarchingCubes field.
     * @private
     */
    _setVoxel(effect, x, y, z, res, val) {
        const field = effect.field;
        const idx = x + y * res + z * res * res;
        if (idx < field.length) {
            field[idx] = val;
        }
    }
}
