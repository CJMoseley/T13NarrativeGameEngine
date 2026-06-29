import * as THREE from 'three';
import { edgeTable, triTable, cornerIndexFromEdge, cubeCorners } from './MarchingCubesTables.js';
import { materialRegistry } from './MaterialRegistry.js';
import { GRID_EMPTY } from './Aliases.js';

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
            materialParams = { color: 0x888888 }
        } = context;

        if (!grid) return context;

        const material = context.material || materialRegistry.getMaterial(materialParams);

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
        const { x: X, y: Y, z: Z } = dims;
        const vertices = [];
        const threshold = 0.5;

        // Iterate through each 1x1x1 cell in the grid
        for (let z = 0; z < Z - 1; z++) {
            for (let y = 0; y < Y - 1; y++) {
                for (let x = 0; x < X - 1; x++) {
                    let cubeIndex = 0;
                    const cornerDensities = new Float32Array(8);
                    const cornerPositions = [];

                    // 1. Determine the index into the edge table which tells us which edges are intersected
                    for (let i = 0; i < 8; i++) {
                        const cx = x + cubeCorners[i][0];
                        const cy = y + cubeCorners[i][1];
                        const cz = z + cubeCorners[i][2];
                        const idx = cx + cy * X + cz * X * Y;

                        // Use grid value as density
                        const val = grid[idx] !== GRID_EMPTY ? 1.0 : 0.0;
                        cornerDensities[i] = val;
                        cornerPositions.push(new THREE.Vector3(cx, cy, cz));

                        if (val > threshold) cubeIndex |= (1 << i);
                    }

                    // 2. Look up the triangulation for this configuration
                    const edges = edgeTable[cubeIndex];
                    if (edges === 0) continue;

                    const triangles = triTable[cubeIndex];
                    for (let i = 0; triangles[i] !== -1; i += 3) {
                        // For each triangle, get the three edges that make it up
                        for (let j = 0; j < 3; j++) {
                            const edgeIdx = triangles[i + j];
                            const v1Idx = cornerIndexFromEdge[edgeIdx][0];
                            const v2Idx = cornerIndexFromEdge[edgeIdx][1];

                            const p1 = cornerPositions[v1Idx];
                            const p2 = cornerPositions[v2Idx];
                            const d1 = cornerDensities[v1Idx];
                            const d2 = cornerDensities[v2Idx];

                            // Linear interpolation for smoother surface
                            const mu = (threshold - d1) / (d2 - d1 || 0.000001);
                            const vx = p1.x + mu * (p2.x - p1.x);
                            const vy = p1.y + mu * (p2.y - p1.y);
                            const vz = p1.z + mu * (p2.z - p1.z);

                            vertices.push(vx, vy, vz);
                        }
                    }
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
}
