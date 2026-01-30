import * as THREE from 'three';
import { primitiveRegistry } from './PrimitiveModelRegistry.js';
import { materialRegistry } from './MaterialRegistry.js';
import { gridToTile, GRID_EMPTY } from './Aliases.js';

/**
 * @module UHPP/RenderBridge
 * @description Bridges the pipeline output to the Three.js scene.
 * Handles both discrete mesh instancing and continuous manifold rendering.
 */
export class RenderBridge {
    constructor(threeScene) {
        this.threeScene = threeScene;
        this.activeGroup = new THREE.Group();
        this.threeScene.add(this.activeGroup);
    }

    /**
     * Renders the pipeline result.
     * @param {object} context - Pipeline context containing grid and mesh info.
     */
    render(context) {
        const {
            grid,
            gridDimensions,
            tileSet,
            mesh,
            renderMode = 'INSTANCED'
        } = context;

        // Clear previous render
        this.clear();

        if (mesh) {
            // If SurfaceSynth already generated a mesh (e.g. Marching Cubes)
            this.activeGroup.add(mesh);
        } else if (renderMode === 'INSTANCED' && grid && tileSet) {
            this._renderInstanced(grid, gridDimensions, tileSet);
        }

        return this.activeGroup;
    }

    /**
     * Clears the current rendering.
     * Note: We don't dispose geometries or materials here as they are managed and cached
     * by the respective registries (PrimitiveModelRegistry, MaterialRegistry).
     */
    clear() {
        while (this.activeGroup.children.length) {
            const obj = this.activeGroup.children[0];
            // Disposal is handled by registries or central manager
            this.activeGroup.remove(obj);
        }
    }

    /**
     * Standard discrete mesh instancing.
     * @private
     */
    _renderInstanced(grid, dims, tileSet) {
        const { x: X, y: Y, z: Z } = dims;

        // Group by tileID to use InstancedMesh for performance
        const instancesByTile = new Map();

        for (let z = 0; z < Z; z++) {
            for (let y = 0; y < Y; y++) {
                for (let x = 0; x < X; x++) {
                    const idx = x + y * X + z * X * Y;
                    const gridValue = grid[idx];

                    if (gridValue !== GRID_EMPTY) {
                        const tileID = gridToTile(gridValue);
                        if (!instancesByTile.has(tileID)) instancesByTile.set(tileID, []);
                        instancesByTile.get(tileID).push(new THREE.Vector3(x, y, z));
                    }
                }
            }
        }

        for (const [tileID, positions] of instancesByTile) {
            const tileData = tileSet.tiles[tileID];
            if (!tileData) continue;

            // Get geometry and material from registries
            const geometry = primitiveRegistry.getGeometry(tileData.primitive || 'Box', tileData.params || {});
            const material = tileData.material || materialRegistry.getMaterial({
                color: tileData.color,
                ...tileData.materialParams
            });

            const instancedMesh = new THREE.InstancedMesh(geometry, material, positions.length);
            const dummy = new THREE.Object3D();

            positions.forEach((pos, i) => {
                dummy.position.copy(pos);
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(i, dummy.matrix);
            });

            instancedMesh.instanceMatrix.needsUpdate = true;
            this.activeGroup.add(instancedMesh);
        }
    }
}
