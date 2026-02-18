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
                const posAttr = geometry.getAttribute ? geometry.getAttribute('position') : (geometry.attributes ? geometry.attributes.position : null);
                const normAttr = geometry.getAttribute ? geometry.getAttribute('normal') : (geometry.attributes ? geometry.attributes.normal : null);

                const positions = posAttr ? posAttr.array : null;
                const normals = normAttr ? normAttr.array : null;

                if (!positions || !normals) {
                    throw new Error("SDF generated geometry with missing attributes");
                }

                const colorsAttr = geometry.getAttribute ? geometry.getAttribute('color') : (geometry.attributes ? geometry.attributes.color : null);
                const colors = colorsAttr ? colorsAttr.array : null;

                self.postMessage({
                    type: 'hullGenerated',
                    geometryData: {
                        positions,
                        normals,
                        colors
                    },
                    requestId
                }, [positions.buffer, normals.buffer, ...(colors ? [colors.buffer] : [])]);
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
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.BufferAttribute(comp.geometry.positions, 3));
                if (comp.geometry.indices) geo.setIndex(new THREE.BufferAttribute(comp.geometry.indices, 1));

                const mesh = new THREE.Mesh(geo);
                mesh.position.set(...comp.position);
                mesh.rotation.set(...comp.rotation);
                mesh.scale.set(...comp.scale);
                mesh.updateMatrix();

                const compCSG = CSG.fromMesh(mesh);
                if (comp.isCarve) {
                    if (baseCSG) baseCSG = baseCSG.subtract(compCSG);
                } else {
                    baseCSG = baseCSG ? baseCSG.union(compCSG) : compCSG;
                }
            }

            if (baseCSG) {
                const hullMesh = CSG.toMesh(baseCSG, new THREE.Matrix4());
                const geometry = hullMesh.geometry;

                const posAttr = geometry.getAttribute ? geometry.getAttribute('position') : (geometry.attributes ? geometry.attributes.position : null);
                const normAttr = geometry.getAttribute ? geometry.getAttribute('normal') : (geometry.attributes ? geometry.attributes.normal : null);

                if (!normAttr) {
                    geometry.computeVertexNormals();
                }

                const positions = posAttr ? posAttr.array : null;
                if (!positions) {
                    throw new Error("CSG generated geometry with no position attribute");
                }

                const normals = normAttr ? normAttr.array : new Float32Array(positions.length);
                const indices = geometry.index ? geometry.index.array : null;

                self.postMessage({
                    type: 'hullGenerated',
                    geometryData: {
                        positions,
                        normals,
                        indices
                    },
                    requestId
                }, [positions.buffer, normals.buffer, ...(indices ? [indices.buffer] : [])]);
            } else {
                self.postMessage({ type: 'hullGenerated', geometryData: null, requestId });
            }
        }
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message, requestId });
    }
};
