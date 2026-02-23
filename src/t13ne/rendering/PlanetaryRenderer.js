import * as THREE from 'three';
import Logger from '../core/Logger.js';

export class PlanetaryRenderer {
    constructor(scene) {
        const funcName = 'PlanetaryRenderer.constructor';
        Logger.start(funcName);
        this.scene = scene;
        this.hasRendered = false;
        Logger.end(funcName);
    }

    render(environment) {
        const funcName = 'PlanetaryRenderer.render';
        Logger.start(funcName);
        if (this.hasRendered) return;

        this.renderTerrain(environment);
        this.renderVegetation(environment);
        this.renderBuildings(environment);
        this.renderRocks(environment);
        this.renderWater(environment);

        this.hasRendered = true;
        Logger.message('PlanetaryRenderer: Full surface render complete.');
        Logger.end(funcName);
    }

    renderTerrain(environment) {
        const size = 500;
        const segments = 50;
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        geometry.rotateX(-Math.PI / 2);

        if (!geometry || !geometry.attributes || !geometry.attributes.position || !geometry.attributes.position.array) return;
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i <= segments; i++) {
            for (let j = 0; j <= segments; j++) {
                const index = (i * (segments + 1) + j) * 3;
                const x = vertices[index];
                const z = vertices[index + 2];
                vertices[index + 1] = environment.getTerrainHeight(x, z);
            }
        }
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({ color: 0x336633 });
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
    }

    renderVegetation(environment) {
        const funcName = 'PlanetaryRenderer.renderVegetation';
        Logger.start(funcName, { treeCount: environment.trees.length });

        const material = new THREE.MeshPhongMaterial({ color: 0x553311 });
        for (const tree of environment.trees) {
            this.renderBranch(tree, material);
        }
    }

    renderBranch(branch, material) {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, branch.height, 8);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(branch.position.x, branch.position.y, branch.position.z);
        this.scene.add(mesh);

        for (const subBranch of branch.branches) {
            this.renderBranch(subBranch, material);
        }
    }

    renderBuildings(environment) {
        const funcName = 'PlanetaryRenderer.renderBuildings';
        Logger.start(funcName, { buildingCount: environment.buildings.length });

        const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
        for (const building of environment.buildings) {
            let geometry;
            if (building.type === 'prism') {
                geometry = new THREE.BoxGeometry(building.size.x, building.size.y, building.size.z);
            } else if (building.type === 'cylinder') {
                geometry = new THREE.CylinderGeometry(building.size.x / 2, building.size.x / 2, building.size.y, 16);
            }
            if (geometry) {
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(building.position.x, building.position.y, building.position.z);
                this.scene.add(mesh);
            }
        }
    }

    renderRocks(environment) {
        const funcName = 'PlanetaryRenderer.renderRocks';
        Logger.start(funcName, { rockCount: environment.generator.rocks.length });

        const material = new THREE.MeshPhongMaterial({ color: 0x555555 });
        for (const rock of environment.generator.rocks) {
            const geometry = new THREE.BoxGeometry(rock.size, rock.size, rock.size);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(rock.x, environment.getTerrainHeight(rock.x, rock.z), rock.z);
            this.scene.add(mesh);
        }
    }

    renderWater(environment) {
        const funcName = 'PlanetaryRenderer.renderWater';
        Logger.start(funcName, { waterLevel: environment.generator.waterLevel });

        const geometry = new THREE.PlaneGeometry(1000, 1000);
        geometry.rotateX(-Math.PI / 2);
        const material = new THREE.MeshPhongMaterial({
            color: 0x224488,
            transparent: true,
            opacity: 0.7
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = environment.generator.waterLevel;
        this.scene.add(mesh);
    }
}
