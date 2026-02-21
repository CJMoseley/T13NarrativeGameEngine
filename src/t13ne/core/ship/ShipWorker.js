// src/t13ne/core/ship/ShipWorker.js
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { HullGenerator } from '/src/t13ne/core/ship/HullGenerator.js';
import { ShipGenerator } from '/src/t13ne/core/ship/ShipGenerator.js';
import { WiringGenerator } from '/src/t13ne/core/ship/WiringGenerator.js';

let hullGenerator = new HullGenerator(null);
let shipGenerator = new ShipGenerator(new WiringGenerator(), null);

self.onmessage = async (e) => {
    const { type, data, requestId } = e.data;

    try {
        if (type === 'createRandomShip') {
            const { seed, config } = data;
            const components = await shipGenerator.createRandomShip(seed, config);
            self.postMessage({ type: 'shipCreated', components, requestId });
        }
        else if (type === 'generateSDFHull') {
            const { components, styleConfig } = data;

            const reconstructedComponents = components.map(c => ({
                ...c,
                position: new THREE.Vector3(c.position.x, c.position.y, c.position.z),
                rotation: new THREE.Euler(c.rotation.x, c.rotation.y, c.rotation.z, c.rotation.order),
                scale: new THREE.Vector3(c.scale.x, c.scale.y, c.scale.z)
            }));

            const geometry = await hullGenerator.generateSDFHullAsync(reconstructedComponents, styleConfig.blendStrength, styleConfig.padding);

            if (geometry) {
                const posAttr = geometry.getAttribute ? geometry.getAttribute('position') : (geometry.attributes?.position);
                const normAttr = geometry.getAttribute ? geometry.getAttribute('normal') : (geometry.attributes?.normal);

                const positions = posAttr?.array;
                const normals = normAttr?.array;

                if (!positions || !normals) {
                    throw new Error("SDF generated geometry with missing attributes or arrays");
                }

                const colorsAttr = geometry.getAttribute ? geometry.getAttribute('color') : (geometry.attributes?.color);
                const colors = colorsAttr?.array || null;

                const transferable = [];
                if (positions?.buffer) transferable.push(positions.buffer);
                if (normals?.buffer) transferable.push(normals.buffer);
                if (colors?.buffer) transferable.push(colors.buffer);

                self.postMessage({
                    type: 'hullGenerated',
                    geometryData: {
                        positions,
                        normals,
                        colors
                    },
                    requestId
                }, transferable);
            } else {
                self.postMessage({ type: 'hullGenerated', geometryData: null, requestId });
            }
        }
        else if (type === 'setPerformanceMode') {
            if (hullGenerator) hullGenerator.setPerformanceMode(data);
            self.postMessage({ type: 'performanceModeSet', requestId });
        }
        else if (type === 'generateCSGHull') {
            const { components } = data;
            let baseCSG = null;

            for (const comp of components) {
                if (!comp || !comp.geometry || !comp.geometry.positions) {
                    console.warn("ShipWorker: Skipping malformed component in generateCSGHull", comp);
                    continue;
                }
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.BufferAttribute(comp.geometry.positions, 3));
                if (comp.geometry.indices) {
                    geo.setIndex(new THREE.BufferAttribute(comp.geometry.indices, 1));
                }

                const mesh = new THREE.Mesh(geo);
                mesh.position.set(...comp.position);
                mesh.rotation.set(...comp.rotation);
                mesh.scale.set(...comp.scale);
                mesh.updateMatrix();

                try {
                    const compCSG = CSG.fromMesh(mesh);
                    if (comp.isCarve) {
                        if (baseCSG) baseCSG = baseCSG.subtract(compCSG);
                    } else {
                        baseCSG = baseCSG ? baseCSG.union(compCSG) : compCSG;
                    }
                } catch (csgError) {
                    console.error("ShipWorker: CSG operation failed for component", comp.usage, csgError);
                }
            }

            if (baseCSG) {
                const hullMesh = CSG.toMesh(baseCSG, new THREE.Matrix4());
                const geometry = hullMesh.geometry;

                const posAttr = geometry.getAttribute ? geometry.getAttribute('position') : (geometry.attributes?.position);

                if (posAttr?.array) {
                    const normAttr = geometry.getAttribute ? geometry.getAttribute('normal') : (geometry.attributes?.normal);
                    if (!normAttr?.array) {
                        try {
                            geometry.computeVertexNormals();
                        } catch (e) {
                            console.warn("ShipWorker: computeVertexNormals failed", e);
                        }
                    }
                } else {
                    throw new Error("CSG generated geometry with no position attribute or array");
                }

                const positions = posAttr.array;
                const updatedNormAttr = geometry.getAttribute ? geometry.getAttribute('normal') : (geometry.attributes?.normal);
                const normals = updatedNormAttr?.array || new Float32Array(positions.length);
                const indices = geometry.index?.array || null;

                const transferable = [];
                if (positions?.buffer) transferable.push(positions.buffer);
                if (normals?.buffer) transferable.push(normals.buffer);
                if (indices?.buffer) transferable.push(indices.buffer);

                self.postMessage({
                    type: 'hullGenerated',
                    geometryData: {
                        positions,
                        normals,
                        indices
                    },
                    requestId
                }, transferable);
            } else {
                self.postMessage({ type: 'hullGenerated', geometryData: null, requestId });
            }
        }
    } catch (error) {
        console.error("ShipWorker: Unhandled error", error);
        self.postMessage({ type: 'error', error: error.message, requestId });
    }
};
