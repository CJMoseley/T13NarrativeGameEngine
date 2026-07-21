import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import Logger from '/src/t13ne/core/Logger.js';
import { ShipComponent } from '/src/t13ne/core/ship/ShipComponent.js';
import { COMPONENT_COLORS, getCompProps, mulberry32 } from '/src/t13ne/core/ship/ShipUtils.js';
import { racingLiveryShader, industrialLiveryShader, boxyLiveryShader, organicLiveryShader, miningLiveryShader, metallicLiveryShader } from '/src/t13ne/core/ship/ShipShaders.js';
import { GlyphGenerator } from '/src/t13ne/core/ship/GlyphGenerator.js';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
            // Attach component data to mesh for later use (e.g. coloring)
            mesh.userData.componentData = comp;
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
            fragmentShader: racingLiveryShader.fragmentShader,
            vertexColors: true
        });

        // Randomize livery
        const livery = components.livery || {};
        const prng = mulberry32(components.seed || 0);
        hullMaterial.uniforms.noiseSeed.value = livery.noiseSeed !== undefined ? livery.noiseSeed : prng() * 100;
        hullMaterial.uniforms.patternType.value = livery.patternType !== undefined ? livery.patternType : Math.floor(prng() * 3);
        hullMaterial.uniforms.color1.value.setHex(livery.color1 !== undefined ? livery.color1 : Math.floor(prng() * 0xffffff));

        let hullMesh = null;
        if (hullGeometry && hullGeometry.attributes?.position && (hullGeometry.attributes.position.array || hullGeometry.attributes.position.count > 0)) {
            // FIX: Ensure geometry has color attribute for shaders that expect vertexColors
            if (!hullGeometry.attributes.color?.array) {
                const count = hullGeometry.attributes.position.count;
                const colors = new Float32Array(count * 3);
                const posAttr = hullGeometry.attributes.position;
                const v = new THREE.Vector3();
                
                // Pre-calculate component colors and positions for speed
                const compData = shipComponents.map(c => {
                    let colorHex = COMPONENT_COLORS.default;
                    const usage = c.stats ? c.stats.usage : '';
                    if (usage) {
                        const lowerUsage = usage.toLowerCase();
                        for (const key in COMPONENT_COLORS) {
                            if (lowerUsage.includes(key)) {
                                colorHex = COMPONENT_COLORS[key];
                                break;
                            }
                        }
                    }
                    return { pos: c.position, color: new THREE.Color(colorHex) };
                });

                for (let i = 0; i < count; i++) {
                    v.fromBufferAttribute(posAttr, i);
                    let minDistSq = Infinity;
                    let closestColor = compData[0] ? compData[0].color : new THREE.Color(1,1,1);

                    for (const c of compData) {
                        const distSq = v.distanceToSquared(c.pos);
                        if (distSq < minDistSq) {
                            minDistSq = distSq;
                            closestColor = c.color;
                        }
                    }
                    colors[i * 3] = closestColor.r;
                    colors[i * 3 + 1] = closestColor.g;
                    colors[i * 3 + 2] = closestColor.b;
                }
                hullGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            }

            hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
            hullMesh.name = "procedural_hull";
            hullMesh.material.side = THREE.DoubleSide;
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
            
            // Apply Decals (Logos, Text)
            const decals = this.greebleGenerator.generateDecals(hullMesh, shipComponents, this.glyphGenerator, components.shipName, components.corporation, components.seed, components.livery);
            shipGroup.add(decals);
        }

        // Add solid component meshes to fill gaps
        componentMeshes.forEach(mesh => {
            // FIX: Keep components visible as requested
            let color = (components.livery && components.livery.color1) ? components.livery.color1 : 0x555555;
            
            // Allow individual component color override
            if (mesh.userData.componentData && mesh.userData.componentData.color) {
                color = mesh.userData.componentData.color;
            }

            mesh.material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.9,
                metalness: 0.4,
                flatShading: true,
                wireframe: false
            });
            mesh.visible = true;
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
        // The showcase scene passes itself as targetScene.
        const isShowcase = targetScene !== null;

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
                
                // FIX: Ensure geometry has color attribute for shaders that expect vertexColors
                if (mesh.geometry?.attributes && !mesh.geometry.attributes.color?.array && mesh.geometry.attributes.position) {
                    const count = mesh.geometry.attributes.position.count;
                    const colors = new Float32Array(count * 3);
                    for (let i = 0; i < count * 3; i++) colors[i] = 1.0; // Default to White
                    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                }

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
                compDataMap.set(c.id, { type: c.type, dims: c.dims, rotation: new THREE.Euler(...(c.rot || [0,0,0])) });
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
            if (this.gameEngine.shipFactory?.useWorker) {
                // Sanitize components for worker (plain objects only)
                const sanitizedComponents = shipComponents.map(c => {
                    if (!c) return null;
                    return {
                        type: c.type,
                        position: c.position ? { x: c.position.x, y: c.position.y, z: c.position.z } : { x: 0, y: 0, z: 0 },
                        rotation: c.rotation ? { x: c.rotation.x, y: c.rotation.y, z: c.rotation.z, order: c.rotation.order } : { x: 0, y: 0, z: 0, order: 'XYZ' },
                        scale: c.scale ? { x: c.scale.x, y: c.scale.y, z: c.scale.z } : { x: 1, y: 1, z: 1 },
                        sdfType: c.sdfType,
                        dims: c.dims
                    };
                }).filter(c => c !== null);

                Logger.start('ShipAssembler.worker.generateSDFHull');
                const geoData = await this.gameEngine.shipFactory.callWorker('generateSDFHull', {
                    components: sanitizedComponents,
                    styleConfig: effectiveStyle
                });
                if (geoData) {
                    hullGeometry = new THREE.BufferGeometry();
                    hullGeometry.setAttribute('position', new THREE.BufferAttribute(geoData.positions, 3));
                    if (geoData.normals) {
                        hullGeometry.setAttribute('normal', new THREE.BufferAttribute(geoData.normals, 3));
                    }
                    if (geoData.colors) {
                        hullGeometry.setAttribute('color', new THREE.BufferAttribute(geoData.colors, 3));
                    }
                }
                Logger.end('ShipAssembler.worker.generateSDFHull');
            } else {
                hullGeometry = await this.hullGenerator.generateAsync(shipComponents, effectiveStyle);
            }
        } else if (effectiveStyle.method === 'SKELETON') {
            // Skeleton style has no hull, so no Z-fighting.
            hullGeometry = null;
        } else {
            // For ALL OTHER styles (INDUSTRIAL, BOXY, DISC, etc.), use CSG to create a single, manifold hull.
            // This is the definitive fix for Z-fighting on hard-surface models.
            console.log(`ShipAssembler: Using unified CSG method for '${effectiveStyle.method}' style.`);
            
            if (this.gameEngine.shipFactory?.useWorker) {
                const workerComponents = [];
                for (const comp of components) {
                    try {
                        const { type, dims, pos, rot, usage } = getCompProps(comp);
                        const isCarve = (usage || '').toLowerCase().includes('carve');
                        const mesh = this.componentFactory.createProxy(type, dims);

                        if (!mesh?.geometry) continue;

                        const geo = mesh.geometry;
                        const posAttr = geo.getAttribute ? geo.getAttribute('position') : (geo.attributes?.position);

                        if (!posAttr?.array) {
                            console.warn(`ShipAssembler: Component ${usage} (${type}) has no position attribute or array!`);
                            continue;
                        }

                        let s = [1, 1, 1];
                        if (comp.scale) {
                            if (Array.isArray(comp.scale)) s = comp.scale;
                            else s = [comp.scale.x, comp.scale.y, comp.scale.z];
                        }

                        workerComponents.push({
                            position: pos,
                            rotation: rot,
                            scale: s,
                            isCarve: isCarve,
                            usage: usage,
                            geometry: {
                                positions: posAttr.array,
                                indices: (geo.index && geo.index.array) ? geo.index.array : null
                            }
                        });
                    } catch (e) {
                        console.error(`ShipAssembler: Error processing component for worker:`, e);
                    }
                }

                Logger.start('ShipAssembler.worker.generateCSGHull');
                const geoData = await this.gameEngine.shipFactory.callWorker('generateCSGHull', { components: workerComponents });
                Logger.end('ShipAssembler.worker.generateCSGHull');
                if (geoData && geoData.positions) {
                    hullGeometry = new THREE.BufferGeometry();
                    hullGeometry.setAttribute('position', new THREE.BufferAttribute(geoData.positions, 3));
                    if (geoData.normals) {
                        hullGeometry.setAttribute('normal', new THREE.BufferAttribute(geoData.normals, 3));
                    }
                    if (geoData.indices) {
                        hullGeometry.setIndex(new THREE.BufferAttribute(geoData.indices, 1));
                    }
                    // Apply slight scale to avoid Z-fighting with internal components
                    hullGeometry.scale(1.005, 1.005, 1.005);
                }
            } else { // Run synchronous CSG
                let baseCSG = null;

                // 1. Union all non-carve components into a single solid.
                const structuralComponents = components.filter(c => !(getCompProps(c).usage || '').toLowerCase().includes('carve'));
                if (structuralComponents.length > 0) {
                    for (const comp of structuralComponents) {
                        const { type, dims, pos, rot } = getCompProps(comp);
                        const mesh = this.componentFactory.createProxy(type, dims);
                        mesh.position.set(...pos);
                        if (rot) mesh.rotation.set(...rot);
                        
                        // FIX: Handle negative scale (mirroring) by baking it into geometry
                        let s = new THREE.Vector3(1, 1, 1);
                        if (comp.scale) {
                            if (Array.isArray(comp.scale)) s.set(...comp.scale);
                            else s.copy(comp.scale);
                        }

                        if (s.x < 0 || s.y < 0 || s.z < 0) {
                            mesh.scale.set(1, 1, 1);
                            mesh.geometry = mesh.geometry.clone();
                            mesh.geometry.scale(s.x, s.y, s.z);

                            // If determinant is negative, we need to flip faces to restore outward normals
                            if (s.x * s.y * s.z < 0) {
                                const index = mesh.geometry.index;
                                if (index) {
                                    for (let i = 0; i < index.count; i += 3) {
                                        const a = index.getX(i);
                                        index.setX(i, index.getX(i+2));
                                        index.setX(i+2, a);
                                    }
                                }
                                mesh.geometry.computeVertexNormals();
                            }
                        } else {
                            mesh.scale.copy(s);
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
        }

        if (hullGeometry?.attributes?.position && (hullGeometry.attributes.position.array?.length > 0 || hullGeometry.attributes.position.count > 0)) {
            // FIX: Ensure geometry has color attribute for shaders that expect vertexColors
            if (!hullGeometry.attributes.color?.array) {
                const count = hullGeometry.attributes.position.count;
                const colors = new Float32Array(count * 3);
                const posAttr = hullGeometry.attributes.position;
                const v = new THREE.Vector3();
                
                // Pre-calculate component colors and positions for speed
                const compData = shipComponents.map(c => {
                    let colorHex = COMPONENT_COLORS.default;
                    const usage = c.stats ? c.stats.usage : '';
                    if (usage) {
                        const lowerUsage = usage.toLowerCase();
                        for (const key in COMPONENT_COLORS) {
                            if (lowerUsage.includes(key)) {
                                colorHex = COMPONENT_COLORS[key];
                                break;
                            }
                        }
                    }
                    return { pos: c.position, color: new THREE.Color(colorHex) };
                });

                for (let i = 0; i < count; i++) {
                    v.fromBufferAttribute(posAttr, i);
                    let minDistSq = Infinity;
                    let closestColor = compData[0] ? compData[0].color : new THREE.Color(1,1,1);

                    for (const c of compData) {
                        const distSq = v.distanceToSquared(c.pos);
                        if (distSq < minDistSq) {
                            minDistSq = distSq;
                            closestColor = c.color;
                        }
                    }
                    colors[i * 3] = closestColor.r;
                    colors[i * 3 + 1] = closestColor.g;
                    colors[i * 3 + 2] = closestColor.b;
                }
                hullGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            }

            // Shader selection logic
            let selectedShader = industrialLiveryShader;
            if (effectiveStyle.method === 'BOXY') selectedShader = boxyLiveryShader;
            else if (effectiveStyle.method === 'RACING') selectedShader = racingLiveryShader;
            else if (effectiveStyle.method === 'ORGANIC') selectedShader = organicLiveryShader;
            else if (effectiveStyle.method === 'MINING') selectedShader = miningLiveryShader;
            else if (effectiveStyle.method === 'METALLIC') selectedShader = metallicLiveryShader;

            const livery = components.livery || {};

            const hullMaterial = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.clone(selectedShader.uniforms),
                vertexShader: selectedShader.vertexShader,
                fragmentShader: selectedShader.fragmentShader,
                extensions: { derivatives: true },
                lights: true,
                vertexColors: true
            });

            // Livery application
            const prng = mulberry32(components.seed || 0);
            if (hullMaterial.uniforms.noiseSeed) hullMaterial.uniforms.noiseSeed.value = livery.noiseSeed !== undefined ? livery.noiseSeed : prng() * 100;
            if (hullMaterial.uniforms.patternType) hullMaterial.uniforms.patternType.value = livery.patternType !== undefined ? livery.patternType : Math.floor(prng() * 3);
            if (hullMaterial.uniforms.color1) hullMaterial.uniforms.color1.value.setHex(livery.color1 !== undefined ? livery.color1 : Math.floor(prng() * 0xffffff));
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

            // Hide wiring visuals if hull is present (they are internal)
            const wg = shipGroup.getObjectByName('wiring_visuals');
            if (wg) wg.visible = false;

            // Brief delay to let the user see the structure (and ensure renderer updates)
            await new Promise(r => setTimeout(r, 2000));

            // Apply Geometric Greebling (Rivets, Antennae, Vents, etc.)
            try {
                Logger.start('ShipAssembler.greebleGenerator.generate');
                const greebles = this.greebleGenerator.generate(hullMesh, shipComponents, effectiveStyle, components.symmetryType, components.radialAxis, components.radialCount, components.hullType, components.seed);
                // Wait for any async greeble models to load before adding to group/LODs
                if (greebles.userData.loadingPromise) {
                    await greebles.userData.loadingPromise;
                }
                shipGroup.add(greebles);

                // Apply Decals
                const decals = this.greebleGenerator.generateDecals(hullMesh, shipComponents, this.glyphGenerator, components.shipName, components.corporation, components.seed, components.livery);
                shipGroup.add(decals);
                Logger.end('ShipAssembler.greebleGenerator.generate');
            } catch (e) {
                console.error("ShipAssembler: Greeble generation failed.", e);
            }

            // Optimization: Hide internal component proxies if hull exists and we are not in showcase
            // They are kept in the group for destruction effects ("blown apart") but shouldn't be rendered normally
            if (!isShowcase) {
                componentMeshes.forEach(m => m.visible = false);
            }
        } else {
            console.warn("ShipFactory: Hull generation produced empty geometry or SKELETON style selected.");
            // For SKELETON style or failed hull, we keep proxies visible and maybe add struts
            componentMeshes.forEach(mesh => {
                mesh.visible = true;
            });

            if (effectiveStyle.method === 'SKELETON') {
                // Apply Greebles to the component proxies directly
                const greebles = this.greebleGenerator.generate(shipGroup, shipComponents, effectiveStyle, components.symmetryType, components.radialAxis, components.radialCount, components.hullType, components.seed);
                shipGroup.add(greebles);
            }
        }

        // Generate struts between connected components
        if (wiringGraph) {
            const strutGroup = new THREE.Group();
            strutGroup.name = "internal_struts";
            if (hullMesh && effectiveStyle.method !== 'SKELETON') {
                strutGroup.visible = false;
            }
            shipGroup.add(strutGroup);

            const strutMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.6 });
            const processedStruts = new Set();
            const raycaster = new THREE.Raycaster();
            const tempVec = new THREE.Vector3();
            
            shipGroup.updateMatrixWorld(true);

            for (const [sourceId, connections] of Object.entries(wiringGraph)) {
                const sourceMesh = meshMap.get(sourceId);
                if (!sourceMesh) continue;

                const sourceCentre = new THREE.Vector3();
                sourceMesh.geometry?.computeBoundingBox();
                sourceMesh.geometry?.boundingBox?.getCenter(sourceCentre);
                sourceMesh.localToWorld(sourceCentre);

                for (const conn of connections) {
                    const edgeKey = [sourceId, conn.targetId].sort().join('-');
                    if (processedStruts.has(edgeKey)) continue;
                    processedStruts.add(edgeKey);

                    const targetMesh = meshMap.get(conn.targetId);
                    if (!targetMesh) continue;

                    const targetCentre = new THREE.Vector3();
                    targetMesh.geometry?.computeBoundingBox();
                    targetMesh.geometry?.boundingBox?.getCenter(targetCentre);
                    targetMesh.localToWorld(targetCentre);

                    let endPoint = targetCentre.clone();
                    if (targetMesh.userData.primitiveType === 'torus') {
                        const dims = targetMesh.userData.originalDims || {};
                        const r = dims.radius || 1;
                        const localSource = sourceCentre.clone().applyMatrix4(targetMesh.matrixWorld.clone().invert());
                        const rimPointLocal = new THREE.Vector3(localSource.x, localSource.y, 0).normalize().multiplyScalar(r);
                        endPoint = rimPointLocal.applyMatrix4(targetMesh.matrixWorld);
                    }

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
                            const spokeCount = 4;
                            for (let i = 0; i < spokeCount; i++) {
                                const angle = (i / spokeCount) * Math.PI * 2;
                                const localDir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
                                localDir.applyQuaternion(torusMesh.quaternion).normalize();

                                raycaster.set(sourceCentre, localDir);
                                const torusHits = raycaster.intersectObject(torusMesh, false);

                                if (torusHits.length > 0) {
                                    const outerPoint = torusHits[0].point;
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
                            continue;
                        }
                    }

                    const raycastDirection = tempVec.subVectors(targetCentre, sourceCentre).normalize();
                    raycaster.set(sourceCentre, raycastDirection);
                    const sourceIntersects = raycaster.intersectObject(sourceMesh, true);
                    let startPoint = sourceCentre;
                    if (sourceIntersects.length > 0) {
                        startPoint = sourceIntersects[0].point;
                    }

                    raycaster.set(endPoint, raycastDirection.negate());
                    const targetIntersects = raycaster.intersectObject(targetMesh, true);
                    if (targetIntersects.length > 0) {
                        endPoint = targetIntersects[0].point;
                    }

                    if (sourceIntersects.length === 0 || targetIntersects.length === 0) continue;

                    const gapVec = new THREE.Vector3().subVectors(endPoint, startPoint);
                    if (gapVec.dot(raycastDirection) > 0) continue;
                    
                    const midPoint = tempVec.addVectors(startPoint, endPoint).multiplyScalar(0.5);
                    const dist = startPoint.distanceTo(endPoint);
                    
                    const sourceUsage = sourceMesh.userData.componentUsage || '';
                    const targetUsage = targetMesh.userData.componentUsage || '';

                    if (sourceUsage.includes('mandible') || targetUsage.includes('mandible')) continue;

                    if ((sourceUsage.includes('wing') && (targetUsage.includes('fuselage') || targetUsage.includes('spine') || targetUsage.includes('hull'))) || 
                        (targetUsage.includes('wing') && (sourceUsage.includes('fuselage') || sourceUsage.includes('spine') || sourceUsage.includes('hull')))) {
                        continue; 
                    }

                    if (dist < 0.5) continue;

                    const strutRadius = 0.25;
                    const embedDepth = 1.0; 
                    const strutGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, dist + embedDepth, 8);
                    const strut = new THREE.Mesh(strutGeo, strutMat);
                    strut.position.copy(midPoint);

                    const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
                    const up = new THREE.Vector3(0, 1, 0);
                    const quat = new THREE.Quaternion().setFromUnitVectors(up, direction);
                    strut.quaternion.copy(quat);

                    strutGroup.add(strut);
                }
            }
        }

        // --- LOD GENERATION ---
        const lod = new THREE.LOD();
        
        // LOD 1: Normal (Distance 100)
        // This is the shipGroup we just built.
        lod.addLevel(shipGroup, 100);

        // LOD 0: Human Scale (Distance 0) - With Interiors Carved
        // We clone the shipGroup and replace the hull with a carved version if interiors exist.
        if (interior && interior.length > 0 && hullMesh && effectiveStyle.method !== 'SKELETON') {
            const lod0Group = shipGroup.clone();
            const lod0Hull = lod0Group.getObjectByName("procedural_hull");
            
            if (lod0Hull) {
                try {
                    // Perform extra carving for interiors on the solid CSG Hull
                    let hullCSG = CSG.fromMesh(lod0Hull);
                    for (const space of interior) {
                        const spaceMesh = this.componentFactory.createProxy(space.type, space.dims);
                        spaceMesh.position.set(...(space.pos || [0, 0, 0]));
                        if (space.rot) spaceMesh.rotation.set(...space.rot);
                        spaceMesh.updateMatrix();
                        hullCSG = hullCSG.subtract(CSG.fromMesh(spaceMesh));
                    }
                    const carvedMesh = CSG.toMesh(hullCSG, lod0Hull.matrix);
                    lod0Hull.geometry.dispose();
                    lod0Hull.geometry = carvedMesh.geometry;
                    // Re-apply attributes if lost (CSG usually preserves them but let's be safe)
                    if (!lod0Hull.geometry.attributes.color && hullMesh.geometry.attributes.color) {
                        lod0Hull.geometry.setAttribute('color', hullMesh.geometry.attributes.color);
                    }
                } catch (e) {
                    console.warn("ShipAssembler: LOD 0 Interior carving failed", e);
                }
            }
            lod.addLevel(lod0Group, 0);
        } else {
            lod.addLevel(shipGroup.clone(), 0);
        }

        // LOD 2: Mid Distance (Distance 300) - Simplified Mesh
        // Merge everything into one mesh and simplify
        await new Promise(r => setTimeout(r, 0)); // Yield
        const mergedGeo = this._mergeShipGeometries(shipGroup);
        if (mergedGeo) {
            const modifier = new SimplifyModifier();
            // Reduce by 50%
            const count = mergedGeo.attributes.position.count;
            const simplifiedGeo = modifier.modify(mergedGeo, Math.floor(count * 0.5));
            
            const lod2Mesh = new THREE.Mesh(simplifiedGeo, hullMesh ? hullMesh.material : new THREE.MeshStandardMaterial({ color: 0x888888 }));
            lod2Mesh.name = "lod2_mesh";
            lod.addLevel(lod2Mesh, 300);

            // LOD 3: Far Distance (Distance 1000) - Heavily Simplified
            // Reduce by 80%
            const simplifiedGeoFar = modifier.modify(mergedGeo, Math.floor(count * 0.8));
            const lod3Mesh = new THREE.Mesh(simplifiedGeoFar, hullMesh ? hullMesh.material : new THREE.MeshStandardMaterial({ color: 0x888888 }));
            lod3Mesh.name = "lod3_mesh";
            lod.addLevel(lod3Mesh, 1000);
        }

        // If we added the raw group to the scene for the showcase, replace it with the LOD
        if (scene && isShowcase) {
            scene.remove(shipGroup);
            scene.add(lod);
        }

        return lod;
    }

    _mergeShipGeometries(group) {
        const geometries = [];
        group.updateMatrixWorld(true);
        group.traverse(child => {
            // Exclude decals (they don't bake well) and wires
            if (child.parent && child.parent.name === 'decals') return;
            if (child.userData.isWire) return;

            if (child.isMesh && child.geometry && child.visible) {
                const geom = child.geometry.clone();
                geom.applyMatrix4(child.matrixWorld);
                
                // Standardize attributes: Position, Normal, Color
                if (!geom.attributes.color) {
                    const count = geom.attributes.position.count;
                    const colors = new Float32Array(count * 3);
                    const matColor = child.material.color || new THREE.Color(1,1,1);
                    for(let i=0; i<count*3; i+=3) {
                        colors[i] = matColor.r; colors[i+1] = matColor.g; colors[i+2] = matColor.b;
                    }
                    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                }
                // Strip other attributes to ensure merge success
                if (geom.index) geom.setIndex(null); 
                geometries.push(geom);
            }
        });
        
        if (geometries.length === 0) return null;
        try {
            return BufferGeometryUtils.mergeGeometries(geometries, false);
        } catch (e) {
            console.warn("LOD Merge failed", e);
            return null;
        }
    }
}
