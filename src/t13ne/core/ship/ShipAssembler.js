import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { ShipComponent } from './ShipComponent.js';
import { COMPONENT_COLORS, getCompProps } from './ShipUtils.js';
import { racingLiveryShader, industrialLiveryShader, boxyLiveryShader, organicLiveryShader, miningLiveryShader, metallicLiveryShader } from './ShipShaders.js';
import { GlyphGenerator } from './GlyphGenerator.js';

export class ShipAssembler {
    constructor(componentFactory, hullGenerator, greebleGenerator, wiringGenerator, gameEngine) {
        this.componentFactory = componentFactory;
        this.hullGenerator = hullGenerator;
        this.greebleGenerator = greebleGenerator;
        this.wiringGenerator = wiringGenerator;
        this.gameEngine = gameEngine;
        this.shipCache = new Map();
        this.glyphGenerator = new GlyphGenerator();
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
            const { type, dims, pos, rot, usage } = getCompProps(comp);
            
            // Skip visual mesh for carve components
            if (usage && usage.includes('carve')) return null;

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
        }).filter(m => m !== null);

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
            shipGroup.add(hullMesh);

            // 2.5 Carve Surface Details (Thrusters, Cockpit) - BEFORE Greebling
            try {
                hullMesh.updateMatrix();
                let hullCSG = CSG.fromMesh(hullMesh);

                // Carve out space for Engines and Bridge to sit "in" the hull
                // Note: We use proxies for carving, not the actual component meshes which are kept for internals
                for (const comp of components) {
                    const { type, dims, pos, rot, usage } = getCompProps(comp);

                    if (usage.toLowerCase().includes('carve')) {
                        const cutterMesh = this.componentFactory.createProxy(type, dims);
                        // cutterMesh is temporary, doesn't need to be added to shipGroup
                        cutterMesh.position.set(...pos);
                        if (rot) cutterMesh.rotation.set(...rot);
                        cutterMesh.scale.multiplyScalar(1.02); // Slightly smaller offset for carving
                        cutterMesh.updateMatrix();
                        hullCSG = hullCSG.subtract(CSG.fromMesh(cutterMesh));
                    }
                }

                // 3. Carve interior spaces
                const interiorToCarve = interior || components.interior;
                if (interiorToCarve && interiorToCarve.length > 0) {
                    interiorToCarve.forEach(space => {
                        const spaceMesh = this.componentFactory.createProxy(space.type, space.dims);
                        spaceMesh.position.set(...(space.pos || [0, 0, 0]));
                        if (space.rot) {
                            spaceMesh.rotation.set(...space.rot);
                        }
                        spaceMesh.updateMatrix();
                        const spaceCSG = CSG.fromMesh(spaceMesh);
                        hullCSG = hullCSG.subtract(spaceCSG);
                    });
                }

                // Apply CSG result
                const carvedMesh = CSG.toMesh(hullCSG, hullMesh.matrix);
                hullMesh.geometry.dispose();
                hullMesh.geometry = carvedMesh.geometry;

            } catch (e) {
                console.warn("ShipFactory: Failed to carve interior/surface. Using solid hull.", e);
            }
            
            // Apply Hull Noise (Dents) only if NOT organic
            if (styleConfig.method !== 'ORGANIC') {
                hullGeometry = this.hullGenerator.applyHullNoise(hullGeometry);
            }

            // Apply Geometric Greebling (Rivets, Antennae, Vents, etc.)
            const greebles = this.greebleGenerator.generate(hullMesh, shipComponents, styleConfig, components.symmetryType, components.radialAxis, components.radialCount, components.hullType, components.seed);
            shipGroup.add(greebles);

            // Apply Decals (Logos, Text)
            const decals = this.greebleGenerator.generateDecals(hullMesh, shipComponents, this.glyphGenerator, components.shipName, components.corporation, components.seed);
            shipGroup.add(decals);
        }

        // Add solid component meshes to fill gaps
        componentMeshes.forEach(mesh => {
            if (hullMesh && styleConfig.method !== 'SKELETON') {
                mesh.visible = false;
            } else {
                mesh.material = new THREE.MeshStandardMaterial({
                    color: 0x555555,
                    roughness: 0.9,
                    metalness: 0.4,
                    flatShading: true,
                    wireframe: false
                });
                mesh.visible = true;
            }
            shipGroup.add(mesh);
        });

        this.shipCache.set(cacheKey, shipGroup);
        console.log("Procedural ship generated and cached.");
        return shipGroup;
    }

    async generateProceduralShipAsync(components, styleConfig, interior, targetScene = null) {
        const shipGroup = new THREE.Group();
        const scene = targetScene || this.gameEngine.physicsEngine.scene;
        const effectiveStyle = components.styleConfig || styleConfig || { method: 'INDUSTRIAL', padding: 0.1 };

        // 1. Generate individual component meshes (proxies) and Wires
        const componentMeshes = [];
        const compMap = new Map(); // Map ID to position for wiring
        const meshMap = new Map(); // Map ID to Mesh for raycasting
        
        // Add to scene immediately for showcase effect
        if (scene) scene.add(shipGroup);

        // Group components to accelerate showcase (batch identical types)
        const groupedComponents = new Map();
        for (const comp of components) {
            const { usage } = getCompProps(comp);
            let groupKey = 'misc';
            if (usage) {
                const u = usage.toLowerCase();
                if (u.includes('maze')) groupKey = 'maze';
                else if (u.includes('spine') || u.includes('fuselage')) groupKey = 'fuselage';
                else if (u.includes('branch')) groupKey = 'structure';
                else if (u.includes('wing') || u.includes('fin')) groupKey = 'wing';
                else if (u.includes('engine') || u.includes('thruster')) groupKey = 'engine';
                else groupKey = u.split('_')[0];
            }
            if (!groupedComponents.has(groupKey)) groupedComponents.set(groupKey, []);
            groupedComponents.get(groupKey).push(comp);
        }

        for (const [groupName, group] of groupedComponents) {
            for (const comp of group) {
                const { type, dims, pos, rot, usage } = getCompProps(comp);
                const mesh = this.componentFactory.createProxy(type, dims);
                
                // Skip visual mesh for carve components
                if (usage && usage.includes('carve')) continue;
                
                mesh.position.set(...pos);
                if (rot) {
                    mesh.rotation.set(...rot);
                }
                // FIX: Apply scale
                if (comp.scale) {
                    if (Array.isArray(comp.scale)) mesh.scale.set(...comp.scale);
                    else mesh.scale.copy(comp.scale);
                }
                
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

                // Initial Wireframe Material (Bright, no lighting, no PBR props)
                mesh.material = new THREE.MeshBasicMaterial({
                    color: color,
                    wireframe: true
                });

                // Visual flair: Add to group and highlight
                shipGroup.add(mesh);
                
                // Keep visible initially so we see the structure immediately
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
            // Small delay between groups to visualize construction steps
            await new Promise(resolve => setTimeout(resolve, 10)); // Accelerated
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
            wireGroup.name = 'wiring_visuals';
            shipGroup.add(wireGroup);
        }

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

        let hullGeometry;
        let hullMesh = null;

        if (effectiveStyle.method === 'ORGANIC') {
            // Organic styles use SDF which creates a single "melty" mesh, avoiding Z-fighting.
            hullGeometry = await this.hullGenerator.generateAsync(shipComponents, effectiveStyle);
        } else if (effectiveStyle.method === 'SKELETON') {
            // Skeleton style has no hull, so no Z-fighting.
            hullGeometry = null;
        } else {
            // For ALL OTHER styles (INDUSTRIAL, BOXY, DISC, etc.), use CSG to create a single, manifold hull.
            // This is the definitive fix for Z-fighting on hard-surface models.
            console.log(`ShipAssembler: Using unified CSG method for '${effectiveStyle.method}' style.`);
            let baseCSG = null;

            // 1. Union all non-carve components into a single solid.
            const structuralComponents = components.filter(c => !(getCompProps(c).usage || '').toLowerCase().includes('carve'));
            if (structuralComponents.length > 0) {
                for (const comp of structuralComponents) {
                    const { type, dims, pos, rot } = getCompProps(comp);
                    const mesh = this.componentFactory.createProxy(type, dims);
                    mesh.position.set(...pos);
                    if (rot) mesh.rotation.set(...rot);
                    if (comp.scale) {
                        if (Array.isArray(comp.scale)) mesh.scale.set(...comp.scale);
                        else mesh.scale.copy(comp.scale);
                    }
                    mesh.updateMatrix();
                    const compCSG = CSG.fromMesh(mesh);
                    baseCSG = baseCSG ? baseCSG.union(compCSG) : compCSG;
                    await new Promise(r => setTimeout(r, 0)); // Yield
                }
            }
            // 2. Subtract all carving components.
            const carvingComponents = components.filter(c => (getCompProps(c).usage || '').toLowerCase().includes('carve'));
            if (baseCSG && carvingComponents.length > 0) {
                for (const comp of carvingComponents) {
                    const { type, dims, pos, rot } = getCompProps(comp);
                    const cutterMesh = this.componentFactory.createProxy(type, dims);
                    cutterMesh.position.set(...pos);
                    if (rot) cutterMesh.rotation.set(...rot);
                    if (comp.scale) cutterMesh.scale.copy(comp.scale);
                    cutterMesh.updateMatrix();
                    baseCSG = baseCSG.subtract(CSG.fromMesh(cutterMesh));
                    await new Promise(r => setTimeout(r, 0)); // Yield
                }
            }

            if (baseCSG) {
                hullMesh = CSG.toMesh(baseCSG, new THREE.Matrix4());
                hullGeometry = hullMesh.geometry;
                // Apply slight scale to avoid Z-fighting with internal components
                hullGeometry.scale(1.005, 1.005, 1.005);
            }
        }

        if (hullGeometry && hullGeometry.attributes.position && hullGeometry.attributes.position.count > 0) {
            // Shader selection logic
            let selectedShader = industrialLiveryShader;
            if (effectiveStyle.method === 'BOXY') selectedShader = boxyLiveryShader;
            else if (effectiveStyle.method === 'RACING') selectedShader = racingLiveryShader;
            else if (effectiveStyle.method === 'ORGANIC') selectedShader = organicLiveryShader;
            else if (effectiveStyle.method === 'MINING') selectedShader = miningLiveryShader;
            else if (effectiveStyle.method === 'METALLIC') selectedShader = metallicLiveryShader;

            const hullMaterial = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.clone(selectedShader.uniforms),
                vertexShader: selectedShader.vertexShader,
                fragmentShader: selectedShader.fragmentShader,
                extensions: { derivatives: true },
                lights: true
            });

            // Livery application
            const livery = components.livery || {};
            if (hullMaterial.uniforms.noiseSeed) hullMaterial.uniforms.noiseSeed.value = livery.noiseSeed !== undefined ? livery.noiseSeed : Math.random() * 100;
            if (hullMaterial.uniforms.patternType) hullMaterial.uniforms.patternType.value = livery.patternType !== undefined ? livery.patternType : Math.floor(Math.random() * 3);
            if (hullMaterial.uniforms.color1) hullMaterial.uniforms.color1.value.setHex(livery.color1 !== undefined ? livery.color1 : Math.random() * 0xffffff);
            if (hullMaterial.uniforms.color2 && livery.color2 !== undefined) hullMaterial.uniforms.color2.value.setHex(livery.color2);
            if (hullMaterial.uniforms.color3 && livery.color3 !== undefined) hullMaterial.uniforms.color3.value.setHex(livery.color3);
            if (hullMaterial.uniforms.baseColor) hullMaterial.uniforms.baseColor.value.setHex(livery.color1 !== undefined ? livery.color1 : 0x667788);

            // Apply Hull Noise (Dents) only if NOT organic to preserve smooth surfaces
            if (effectiveStyle.method !== 'ORGANIC') {
                hullGeometry = this.hullGenerator.applyHullNoise(hullGeometry);
            }

            if (!hullMesh) { // If hull was generated by SDF/Convex
                hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
            } else { // If hull was generated by CSG
                hullMesh.material = hullMaterial;
            }

            hullMesh.name = "procedural_hull";
            shipGroup.add(hullMesh);

            // Hide the wireframe proxies now that we have a solid hull
            componentMeshes.forEach(mesh => {
                mesh.visible = false;
            });

            // Hide wiring visuals if hull is present (they are internal)
            const wg = shipGroup.getObjectByName('wiring_visuals');
            if (wg) wg.visible = false;

            // Brief delay to let the user see the structure (and ensure renderer updates)
            await new Promise(r => setTimeout(r, 2000));

            // Apply Geometric Greebling (Rivets, Antennae, Vents, etc.)
            try {
                const greebles = this.greebleGenerator.generate(hullMesh, shipComponents, effectiveStyle, components.symmetryType, components.radialAxis, components.radialCount, components.hullType, components.seed);
                shipGroup.add(greebles);

                // Apply Decals
                const decals = this.greebleGenerator.generateDecals(hullMesh, shipComponents, this.glyphGenerator, components.shipName, components.corporation, components.seed);
                shipGroup.add(decals);
            } catch (e) {
                console.error("ShipAssembler: Greeble generation failed.", e);
            }
        } else {
            console.warn("ShipFactory: Hull generation produced empty geometry or SKELETON style selected.");
            // For SKELETON style or failed hull, we keep proxies visible and maybe add struts
            componentMeshes.forEach(mesh => {
                // Keep as wireframe for the showcase scene to handle the final material.
                mesh.visible = true;
            });

            if (effectiveStyle.method === 'SKELETON') {
                // Apply Greebles to the component proxies directly
                const greebles = this.greebleGenerator.generate(shipGroup, shipComponents, effectiveStyle, components.symmetryType, components.radialAxis, components.radialCount, components.hullType, components.seed);
                shipGroup.add(greebles);
            }
        }

        // Generate struts between connected components for ALL styles to ensure connectivity
        // For SKELETON, these are the main structure. For others, they act as internal cabling or external supports if hull fails.
        if (wiringGraph) {
            const strutGroup = new THREE.Group();
            strutGroup.name = "internal_struts";
            // If a hull exists and we are not in SKELETON mode, hide struts by default (internal structure)
            if (hullMesh && effectiveStyle.method !== 'SKELETON') {
                strutGroup.visible = false;
            }
            shipGroup.add(strutGroup);

            const strutMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.6 });
            const processedStruts = new Set();
            const raycaster = new THREE.Raycaster();
            const tempVec = new THREE.Vector3();
            
            // Ensure matrices are up to date for raycasting
            shipGroup.updateMatrixWorld(true);

            for (const [sourceId, connections] of Object.entries(wiringGraph)) {
                const sourceMesh = meshMap.get(sourceId);
                if (!sourceMesh) continue;

                // Get the center of the source component for raycasting origin
                const sourceCentre = new THREE.Vector3();
                sourceMesh.geometry.computeBoundingBox();
                sourceMesh.geometry.boundingBox.getCenter(sourceCentre);
                sourceMesh.localToWorld(sourceCentre);

                for (const conn of connections) {
                    const edgeKey = [sourceId, conn.targetId].sort().join('-');
                    if (processedStruts.has(edgeKey)) continue;
                    processedStruts.add(edgeKey);

                    const targetMesh = meshMap.get(conn.targetId);
                    if (!targetMesh) continue;

                    // Get the center of the target component
                    const targetCentre = new THREE.Vector3();
                    targetMesh.geometry.computeBoundingBox();
                    targetMesh.geometry.boundingBox.getCenter(targetCentre);
                    targetMesh.localToWorld(targetCentre);

                    // Special handling for Torus targets: Connect to the rim, not the center
                    let endPoint = targetCentre.clone();
                    if (targetMesh.userData.primitiveType === 'torus') {
                        const dims = targetMesh.userData.originalDims || {};
                        const r = dims.radius || 1;
                        // Transform source center to torus local space
                        const localSource = sourceCentre.clone().applyMatrix4(targetMesh.matrixWorld.clone().invert());
                        // Project to XY plane (Torus plane) and normalize to radius
                        const rimPointLocal = new THREE.Vector3(localSource.x, localSource.y, 0).normalize().multiplyScalar(r);
                        // Transform back to world
                        endPoint = rimPointLocal.applyMatrix4(targetMesh.matrixWorld);
                    }


                    // Check for concentric/overlapping components (like Ring Hull)
                    const centerDist = sourceCentre.distanceTo(targetCentre);
                    if (centerDist < 2.0) {
                        const sourceType = sourceMesh.userData.primitiveType;
                        const targetType = targetMesh.userData.primitiveType;
                        let torusMesh = null;
                        let innerMesh = null;

                        if (sourceType === 'torus') {
                            torusMesh = sourceMesh;
                            innerMesh = targetMesh;
                        } else if (targetType === 'torus') {
                            torusMesh = targetMesh;
                            innerMesh = sourceMesh;
                        }

                        if (torusMesh) {
                            // Generate spokes
                            const spokeCount = 4;
                            for (let i = 0; i < spokeCount; i++) {
                                const angle = (i / spokeCount) * Math.PI * 2;
                                // Torus is in XY plane locally
                                const localDir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
                                localDir.applyQuaternion(torusMesh.quaternion).normalize();

                                // Raycast Out to Torus (find inner surface of ring)
                                raycaster.set(sourceCentre, localDir);
                                const torusHits = raycaster.intersectObject(torusMesh, false);

                                if (torusHits.length > 0) {
                                    const outerPoint = torusHits[0].point;

                                    // Raycast In to Inner Object (find outer surface)
                                    raycaster.set(outerPoint, localDir.clone().negate());
                                    const innerHits = raycaster.intersectObject(innerMesh, true);
                                    
                                    const innerPoint = innerHits.length > 0 ? innerHits[0].point : sourceCentre;
                                    const dist = innerPoint.distanceTo(outerPoint);
                                    
                                    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, dist, 6);
                                    strutGeo.rotateX(Math.PI / 2);
                                    const strut = new THREE.Mesh(strutGeo, strutMat);
                                    strut.position.copy(innerPoint).add(outerPoint).multiplyScalar(0.5);
                                    strut.lookAt(outerPoint);
                                    strutGroup.add(strut);
                                }
                            }
                            continue; // Skip standard strut generation
                        }
                    }

                    // Raycast from source center towards target center to find connection points on surfaces
                    const raycastDirection = tempVec.subVectors(targetCentre, sourceCentre).normalize();
                    
                    // Find intersection point on source mesh
                    raycaster.set(sourceCentre, raycastDirection);
                    const sourceIntersects = raycaster.intersectObject(sourceMesh, true);
                    let startPoint = sourceCentre; // Fallback
                    if (sourceIntersects.length > 0) {
                        startPoint = sourceIntersects[0].point;
                    }

                    // Find intersection point on target mesh
                    raycaster.set(endPoint, raycastDirection.negate()); // Raycast from target back to source
                    const targetIntersects = raycaster.intersectObject(targetMesh, true);
                    // let endPoint = targetCenter; // Already set
                    if (targetIntersects.length > 0) {
                        endPoint = targetIntersects[0].point;
                    }

                    // If both raycasts failed, use component centers as a last resort
                    if (sourceIntersects.length === 0 && targetIntersects.length === 0) {
                        startPoint = sourceCentre;
                        // endPoint is already set to rim or center
                    }
                    
                    const midPoint = tempVec.addVectors(startPoint, endPoint).multiplyScalar(0.5);
                    const dist = startPoint.distanceTo(endPoint);
                    
                    // FIX: Skip struts for wing-fuselage connections to avoid visual clutter
                    const sourceUsage = sourceMesh.userData.componentUsage || '';
                    const targetUsage = targetMesh.userData.componentUsage || '';
                    if ((sourceUsage.includes('wing') && (targetUsage.includes('fuselage') || targetUsage.includes('spine') || targetUsage.includes('hull'))) || 
                        (targetUsage.includes('wing') && (sourceUsage.includes('fuselage') || sourceUsage.includes('spine') || sourceUsage.includes('hull')))) {
                        continue; 
                    }

                    // FIX: Skip struts for embedded generators on arc ships
                    if (components.hullType === 'HORSESHOE' || components.hullType === 'STATION_RING') {
                        if (sourceUsage.includes('generator') || targetUsage.includes('generator') ||
                            sourceUsage.includes('shield') || targetUsage.includes('shield')) {
                            continue;
                        }
                    }

                    // FIX: Skip struts if components are touching or embedded to avoid visual clutter
                    if (dist < 0.5) continue;

                    // FIX: Create a single, thicker, correctly-oriented strut to avoid visual bugs.
                    // Embed strut into components by increasing length slightly
                    const strutRadius = 0.25;
                    const embedDepth = 1.0; 
                    const strutGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, dist + embedDepth, 8);
                    const strut = new THREE.Mesh(strutGeo, strutMat);

                    // Position at midpoint
                    strut.position.copy(midPoint);

                    // Align cylinder's default Y-axis along the vector from start to end
                    const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
                    const up = new THREE.Vector3(0, 1, 0);
                    const quat = new THREE.Quaternion().setFromUnitVectors(up, direction);
                    strut.quaternion.copy(quat);

                    strutGroup.add(strut);
                }
            }
        }

        return shipGroup;
    }
}
