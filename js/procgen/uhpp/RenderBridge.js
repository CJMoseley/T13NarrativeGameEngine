import * as THREE from 'three';
import { primitiveRegistry } from './PrimitiveModelRegistry.js';

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
     */
    clear() {
        while (this.activeGroup.children.length) {
            const obj = this.activeGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
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
                    const tileVal = grid[idx] - 1;

                    if (tileVal >= 0) {
                        if (!instancesByTile.has(tileVal)) instancesByTile.set(tileVal, []);
                        instancesByTile.get(tileVal).push(new THREE.Vector3(x, y, z));
                    }
                }
            }
        }

        for (const [tileID, positions] of instancesByTile) {
            const tileData = tileSet.tiles[tileID];
            if (!tileData) continue;

            // Get geometry and material from primitive registry or tile data
            const geometry = primitiveRegistry.getGeometry(tileData.primitive || 'Box', tileData.params || {});
            const material = tileData.material || new THREE.MeshStandardMaterial({ color: tileData.color || 0xcccccc });

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
