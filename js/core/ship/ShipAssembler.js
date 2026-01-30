/* LEGACY CODE - MOVED TO src/t13ne/core/

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { ShipComponent } from './ShipComponent.js';
import { COMPONENT_COLORS, getCompProps } from './ShipUtils.js';
import { racingLiveryShader } from './ShipShaders.js';

export class ShipAssembler {
    constructor(componentFactory, hullGenerator, greebleGenerator, wiringGenerator, gameEngine) {
        this.componentFactory = componentFactory;
        this.hullGenerator = hullGenerator;
        this.greebleGenerator = greebleGenerator;
        this.wiringGenerator = wiringGenerator;
        this.gameEngine = gameEngine;
        this.shipCache = new Map();
    }

    generateProceduralShip(components, styleConfig, interior) {
        const cacheKey = `${JSON.stringify(components)}_${JSON.stringify(styleConfig)}_${JSON.stringify(interior)}`;
        if (this.shipCache.has(cacheKey)) {
            const cachedMesh = this.shipCache.get(cacheKey);
            return cachedMesh.clone();
        }

        const shipGroup = new THREE.Group();

        // 1. Generate individual component meshes (proxies)
        const componentMeshes = components.map(comp => {
            const { type, dims, pos, rot } = getCompProps(comp);
            const mesh = this.componentFactory.createProxy(type, dims);
            mesh.position.set(...pos);
            if (rot) {
                mesh.rotation.set(...rot);
            }
            // FIX: Apply scale if present (e.g. for mirroring)
            if (comp.scale) {
                if (Array.isArray(comp.scale)) mesh.scale.set(...comp.scale);
                else mesh.scale.copy(comp.scale);
            }
            return mesh;
        });

        // 2. Generate the main hull
        const shipComponents = components.map(c => {
            const { type, dims, pos, rot, def, usage } = getCompProps(c);
            
            const { sdfType, scale } = this.componentFactory.getSDFConfig(type, dims);

            // Apply component level scaling (from createRandomShip variation/mirroring)
            if (c.scale) {
                const s = Array.isArray(c.scale) ? new THREE.Vector3(...c.scale) : c.scale;
                // Multiply the dimensions by the scale factor to ensure hull matches proxy
                scale.multiply(s);
            }

            // Ensure stats object has usage/name for GreebleGenerator
            const stats = def.stats ? { ...def.stats } : (def.isComponent ? { ...def } : {});
            if (!stats.usage) stats.usage = usage;
            if (!stats.name) stats.name = def.name || usage;

            return new ShipComponent(
                type,
                new THREE.Vector3(...pos),
                new THREE.Euler(...rot),
                scale,
                stats, // Pass stats/definition
                sdfType,
                dims,
                def.harmonics || {} // Pass harmonics
            );
        });

        let hullGeometry = this.hullGenerator.generate(shipComponents, components.styleConfig || styleConfig);
        const hullMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(racingLiveryShader.uniforms),
            vertexShader: racingLiveryShader.vertexShader,
            fragmentShader: racingLiveryShader.fragmentShader
        });
        // Randomize livery
        const livery = components.livery || {};
        hullMaterial.uniforms.noiseSeed.value = livery.noiseSeed !== undefined ? livery.noiseSeed : Math.random() * 100;
        hullMaterial.uniforms.patternType.value = livery.patternType !== undefined ? livery.patternType : Math.floor(Math.random() * 3);
        hullMaterial.uniforms.color1.value.setHex(livery.color1 !== undefined ? livery.color1 : Math.random() * 0xffffff);
        if (livery.color2 !== undefined) hullMaterial.uniforms.color2.value.setHex(livery.color2);
        if (livery.color3 !== undefined) hullMaterial.uniforms.color3.value.setHex(livery.color3);

        let hullMesh = null;
        if (hullGeometry && hullGeometry.attributes.position && hullGeometry.attributes.position.count > 0) {
            hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
            hullMesh.name = "procedural_hull";
            
            // Apply Hull Noise (Dents) only if NOT organic
            if (styleConfig.method !== 'ORGANIC') {
                hullGeometry = this.hullGenerator.applyHullNoise(hullGeometry);
            }

            // Apply Geometric Greebling (Rivets, Antennae, Vents, etc.)
            const greebles = this.greebleGenerator.generate(hullMesh, shipComponents, styleConfig, components.symmetryType, components.radialAxis, components.radialCount);
            shipGroup.add(greebles);

            try {
                // 3. Carve interior spaces
                if (interior && interior.length > 0) {
                    hullMesh.updateMatrix();
                    let hullCSG = CSG.fromMesh(hullMesh);

                    interior.forEach(space => {
                        const spaceMesh = this.componentFactory.createProxy(space.type, space.dims);
                        spaceMesh.position.set(...(space.pos || [0, 0, 0]));
                        if (space.rot) {
                            spaceMesh.rotation.set(...space.rot);
                        }
                        spaceMesh.updateMatrix();
                        const spaceCSG = CSG.fromMesh(spaceMesh);
                        hullCSG = hullCSG.subtract(spaceCSG);
                    });

                    hullMesh = CSG.toMesh(hullCSG, hullMesh.matrix);
                    hullMesh.material = hullMaterial;
                }
            } catch (e) {
                console.warn("ShipFactory: Failed to carve interior. Using solid hull.", e);
            }
            
            shipGroup.add(hullMesh);
        }

        // Optional: Add the proxy meshes for visualization or as placeholders for "real" components
        componentMeshes.forEach(mesh => {
            mesh.material = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                wireframe: true,
                opacity: 0.2,
                transparent: true
            });
            shipGroup.add(mesh);
        });

        this.shipCache.set(cacheKey, shipGroup);
        console.log("Procedural ship generated and cached.");
        return shipGroup;
    }

    async generateProceduralShipAsync(components, styleConfig, interior) {
        const shipGroup = new THREE.Group();
        const scene = this.gameEngine.physicsEngine.scene;
        const effectiveStyle = components.styleConfig || styleConfig || { method: 'INDUSTRIAL', padding: 0.1 };

        // 1. Generate individual component meshes (proxies) and Wires
        const componentMeshes = [];
        const compMap = new Map(); // Map ID to position for wiring
        const meshMap = new Map(); // Map ID to Mesh for raycasting

        for (const comp of components) {
            const { type, dims, pos, rot, usage } = getCompProps(comp);
            const mesh = this.componentFactory.createProxy(type, dims);
            
            mesh.position.set(...pos);
            if (rot) {
                mesh.rotation.set(...rot);
            }
            // FIX: Apply scale
            if (comp.scale) {
                if (Array.isArray(comp.scale)) mesh.scale.set(...comp.scale);
                else mesh.scale.copy(comp.scale);
            }
            
            // Scale down slightly to fit inside hull and avoid z-fighting, but provide solid core
            mesh.scale.multiplyScalar(0.95);
            
            // Determine color based on usage
            let color = COMPONENT_COLORS.default;
            if (usage) {
                const lowerUsage = usage.toLowerCase();
                for (const key in COMPONENT_COLORS) {
                    if (lowerUsage.includes(key)) {
                        color = COMPONENT_COLORS[key];
                        break;
                    }
                }
            }

            // Always use Industrial/Solid look for internals to fill gaps in hull
            let matParams = {
                color: 0x555555, // Base industrial grey
                roughness: 0.7,
                metalness: 0.6,
                flatShading: true
            };

            if (usage) {
                const u = usage.toLowerCase();
                if (u.includes('cockpit') || u.includes('bridge')) {
                    matParams.color = 0x112233; // Dark glass
                    matParams.roughness = 0.1;
                    matParams.metalness = 0.9;
                } else if (u.includes('engine') || u.includes('thruster')) {
                    matParams.color = 0x333333; // Dark metal
                    matParams.emissive = 0x110000; // Slight heat glow
                } else if (u.includes('wing') || u.includes('fin')) {
                    matParams.color = 0x888888; // Light panels
                } else if (u.includes('weapon')) {
                    matParams.color = 0x222222; // Gunmetal
                }
            }
            mesh.material = new THREE.MeshStandardMaterial(matParams);

            // Visual flair: Add to group and highlight
            shipGroup.add(mesh);
            
            // Keep visible initially so we see the structure immediately
            // Add metadata for the Showcase scene to group them
            mesh.userData.componentName = comp.name || `${usage} Component`;
            mesh.userData.componentUsage = usage;
            mesh.userData.componentId = comp.id;
            mesh.userData.namePromise = comp.namePromise;
            mesh.visible = true;
            componentMeshes.push(mesh);
            
            if (comp.id) {
                compMap.set(comp.id, mesh.position);
                meshMap.set(comp.id, mesh);
            }
        }

        // 1b. Generate Wiring Meshes
        // Note: wiringGraph is now attached to components array in ShipGenerator
        const wiringGraph = components.wiringGraph;
        if (wiringGraph) {
            // Create map of component data for WiringGenerator (needed for Torus connections)
            const compDataMap = new Map();
            components.forEach(c => {
                compDataMap.set(c.id, { type: c.type, dims: c.dims, rotation: new THREE.Euler(...c.rot) });
            });

            const wireGroup = this.wiringGenerator.createVisuals(wiringGraph, compMap, compDataMap);
            shipGroup.add(wireGroup);
        }

        if (scene) scene.add(shipGroup);

        // Yield to the renderer so the user sees the component skeleton before the hull generates
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Generate the main hull
        const shipComponents = components.map(c => {
            const { type, dims, pos, rot, def, usage } = getCompProps(c);
            
            const { sdfType, scale } = this.componentFactory.getSDFConfig(type, dims);

            // Apply component level scaling (from createRandomShip variation/mirroring)
            if (c.scale) {
                const s = Array.isArray(c.scale) ? new THREE.Vector3(...c.scale) : c.scale;
                // Multiply the dimensions by the scale factor to ensure hull matches proxy
                scale.multiply(s);
            }

            // Ensure stats object has usage/name for GreebleGenerator
            const stats = def.stats ? { ...def.stats } : (def.isComponent ? { ...def } : {});
            if (!stats.usage) stats.usage = usage;
            if (!stats.name) stats.name = def.name || usage;

            return new ShipComponent(
                type,
                new THREE.Vector3(...pos),
                new THREE.Euler(...rot),
                scale,
                stats,
                sdfType,
                dims,
                def.harmonics || {} // Pass harmonics
            );
        });

        let hullGeometry = this.hullGenerator.generate(shipComponents, effectiveStyle);
        // Use Racing Livery Shader Material
        const hullMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(racingLiveryShader.uniforms),
            vertexShader: racingLiveryShader.vertexShader,
            fragmentShader: racingLiveryShader.fragmentShader
        });
        // Randomize livery
        const livery = components.livery || {};
        hullMaterial.uniforms.noiseSeed.value = livery.noiseSeed !== undefined ? livery.noiseSeed : Math.random() * 100;
        hullMaterial.uniforms.patternType.value = livery.patternType !== undefined ? livery.patternType : Math.floor(Math.random() * 3);
        hullMaterial.uniforms.color1.value.setHex(livery.color1 !== undefined ? livery.color1 : Math.random() * 0xffffff);
        if (livery.color2 !== undefined) hullMaterial.uniforms.color2.value.setHex(livery.color2);
        if (livery.color3 !== undefined) hullMaterial.uniforms.color3.value.setHex(livery.color3);
        
        let hullMesh = null;

        // Check if hull generation actually produced geometry (generateSDFHull returns null on failure)
        if (hullGeometry && hullGeometry.attributes.position && hullGeometry.attributes.position.count > 0) {
            // Apply Hull Noise (Dents) only if NOT organic to preserve smooth surfaces
            if (effectiveStyle.method !== 'ORGANIC') {
                hullGeometry = this.hullGenerator.applyHullNoise(hullGeometry);
            }

            // Apply Geometric Greebling (Rivets, Antennae, Vents, etc.)
            const greebles = this.greebleGenerator.generate(new THREE.Mesh(hullGeometry), shipComponents, effectiveStyle, components.symmetryType, components.radialAxis, components.radialCount);
            shipGroup.add(greebles);
            
            hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
            hullMesh.name = "procedural_hull";
            console.log(`ShipFactory: Hull generated successfully. Vertices: ${hullGeometry.attributes.position.count}, Indices: ${hullGeometry.index ? hullGeometry.index.count : 'None'}`);
            shipGroup.add(hullMesh);
            // Ensure hull is visible and rendered
            hullMesh.visible = true;

            // Brief delay to let the user see the structure (and ensure renderer updates)
            await new Promise(r => setTimeout(r, 2000));

        } else {
            console.warn("ShipFactory: Hull generation produced empty geometry or SKELETON style selected.");
            // For SKELETON style or failed hull, we keep proxies visible and maybe add struts
            if (effectiveStyle.method === 'SKELETON') {
                // Apply Greebles to the component proxies directly
                // We create a temporary group of the meshes to raycast against
                const greebles = this.greebleGenerator.generate(shipGroup, shipComponents, effectiveStyle, components.symmetryType, components.radialAxis, components.radialCount);
                shipGroup.add(greebles);
            }
        }

        // Generate struts between connected components for ALL styles to ensure connectivity
        // For SKELETON, these are the main structure. For others, they act as internal cabling or external supports if hull fails.
        if (wiringGraph) {
            const strutMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.6 });
            const processedStruts = new Set();
            const raycaster = new THREE.Raycaster();
            
            // Ensure matrices are up to date for raycasting
            shipGroup.updateMatrixWorld(true);

            for (const [sourceId, connections] of Object.entries(wiringGraph)) {
                const startPos = compMap.get(sourceId);
                const sourceMesh = meshMap.get(sourceId);
                if (!startPos || !sourceMesh) continue;

                for (const conn of connections) {
                    const edgeKey = [sourceId, conn.targetId].sort().join('-');
                    if (processedStruts.has(edgeKey)) continue;
                    processedStruts.add(edgeKey);

                    const endPos = compMap.get(conn.targetId);
                    if (!endPos) continue;
                    
                    // Raycast to find the nearest surface in the direction of the connection
                    const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
                    raycaster.set(startPos, direction);
                    
                    // Intersect with all components
                    const intersects = raycaster.intersectObjects(componentMeshes, false);
                    
                    let targetPoint = endPos;

                    for (const hit of intersects) {
                        // Ignore self-intersections (source mesh)
                        if (hit.object !== sourceMesh) {
                            // Stop at the first valid intersection (nearest component)
                            targetPoint = hit.point;
                            break;
                        }
                    }
                    
                    const dist = startPos.distanceTo(targetPoint);
                    
                    // Create 3 struts in a triangle formation
                    const strutCount = 3;
                    const strutRadius = 0.04;
                    const offset = 0.12;
                    
                    for (let i = 0; i < strutCount; i++) {
                        const angle = (i / strutCount) * Math.PI * 2;
                        const offsetX = Math.cos(angle) * offset;
                        const offsetY = Math.sin(angle) * offset;
                        
                        const strutGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, dist, 4);
                        strutGeo.rotateX(Math.PI / 2);
                        strutGeo.translate(offsetX, offsetY, dist / 2);
                        const strut = new THREE.Mesh(strutGeo, strutMat);
                        strut.position.copy(startPos);
                        strut.lookAt(targetPoint);
                        shipGroup.add(strut);
                    }
                }
            }
        }

        // 2.5 Carve Surface Details (Thrusters, Cockpit)
        if (hullMesh) {
            try {
                // Ensure matrices are updated before CSG
                hullMesh.updateMatrix();
                let hullCSG = CSG.fromMesh(hullMesh);
                
                // Carve out space for Engines and Bridge to sit "in" the hull
                for (const comp of components) {
                    const { type, dims, pos, rot, usage } = getCompProps(comp);

                    if (usage.includes('Engine') || usage.includes('Bridge') || usage.includes('cockpit') || type === 'cone') {
                        const cutterMesh = this.componentFactory.createProxy(type, dims);
                        shipGroup.add(cutterMesh); // Add to group to inherit transform
                        cutterMesh.position.set(...pos);
                        if (rot) cutterMesh.rotation.set(...rot);
                        cutterMesh.scale.multiplyScalar(1.05); // Slightly larger to create a recess
                        cutterMesh.updateMatrix(); // Update local matrix for CSG
                        hullCSG = hullCSG.subtract(CSG.fromMesh(cutterMesh));
                        shipGroup.remove(cutterMesh);
                    }
                }
                hullMesh = CSG.toMesh(hullCSG, hullMesh.matrix);
                hullMesh.material = hullMaterial;
            } catch (e) {
                console.warn("ShipFactory: Failed to carve surface details.", e);
            }
        }

        // 3. Carve interior spaces
        if (hullMesh && interior && interior.length > 0) {
            try {
                hullMesh.updateMatrix();
                let hullCSG = CSG.fromMesh(hullMesh);

                interior.forEach(space => {
                    const spaceMesh = this.componentFactory.createProxy(space.type, space.dims);
                    shipGroup.add(spaceMesh); // Add to group to inherit transform
                    spaceMesh.position.set(...(space.pos || [0, 0, 0]));
                    if (space.rot) {
                        spaceMesh.rotation.set(...space.rot);
                    }
                    spaceMesh.updateMatrixWorld();
                    const spaceCSG = CSG.fromMesh(spaceMesh);
                    hullCSG = hullCSG.subtract(spaceCSG);
                    shipGroup.remove(spaceMesh);
                });

                hullMesh = CSG.toMesh(hullCSG, hullMesh.matrix);
                hullMesh.material = hullMaterial;
            } catch (e) {
                console.warn("ShipFactory: Failed to carve interior. Using solid hull.", e);
            }
        }

        return shipGroup;
    }
}

*/