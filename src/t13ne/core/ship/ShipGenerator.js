import * as THREE from 'three';
import { mulberry32, TECH_SPECS, QUALITIES, FALLBACK_MANUFACTURERS } from './ShipUtils.js';
import { GalacticHistory } from '@/src/t13ne/procgen/galaxy/GalacticHistory.js';
import { generateDisc, generateSpineOrStar } from './structures/StandardHulls.js';
import { generateFreighter, generateHorseshoe, generateBlob, generateCatamaran, generateYFork, generateBattlestar } from './structures/IndustrialHulls.js';
import { generateTree, generateMaze, generateBioCluster, generateMonolith, generateFractal, generateLiberator } from './structures/ExoticHulls.js';
import { generateStation } from './structures/StationHulls.js';
import { createSingleWingStructure } from './structures/WingGenerator.js';

export class ShipGenerator {
    constructor(wiringGenerator, gameEngine) {
        this.wiringGenerator = wiringGenerator;
        this.gameEngine = gameEngine;
    }

    async createRandomShip(seed, config = {}) {
        if (config.useWFC) {
            return this.createRandomShipWFC(seed, config);
        }
        // Initialize PRNG
        let seedVal = typeof seed === 'string' ?
            seed.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0) :
            seed;
        if (typeof seedVal === 'number' && !Number.isInteger(seedVal)) {
            seedVal = Math.floor(seedVal * 4294967296);
        }
        if (!seedVal) seedVal = Date.now();
        const random = mulberry32(seedVal >>> 0);

        const size = config.size || 'medium'; // small, medium, large
        const techLevel = config.techLevel || 1;

        // Determine Style and Padding
        const styleTypes = ['ORGANIC', 'INDUSTRIAL', 'SKELETON', 'BOXY', 'RACING', 'MINING', 'METALLIC'];
        let selectedStyle = config.style || styleTypes[Math.floor(random() * styleTypes.length)];
        const padding = 0.05 + random() * 0.15; // Procedural padding variation

        // Determine Harmonic Number (Segments for prisms)
        const harmonicOptions = [3, 4, 5, 6, 8];
        const harmonicSegments = harmonicOptions[Math.floor(random() * harmonicOptions.length)];

        // Determine Radial Count (3, 4, 5, 6, 8) - Ensure 3x or more for radial
        const radialCounts = [2, 3, 4, 5, 6, 8];
        const radialCount = radialCounts[Math.floor(random() * radialCounts.length)];

        const symmetryType = config.symmetry || (random() > 0.7 ? 'ASYMMETRICAL' : (random() > 0.5 ? 'RADIAL' : 'REFLECTIVE'));

        // Randomize Axis for symmetry
        let radialAxis = 'z';
        if (symmetryType === 'RADIAL') {
            radialAxis = random() > 0.5 ? 'y' : 'z';
        }

        const components = [];
        const explicitWiring = {};

        // Helper to get distance
        const getDist = (p1, p2) => {
            return new THREE.Vector3(...p1).distanceTo(new THREE.Vector3(...p2));
        };

        // --- Helper: Attach Component with Symmetry ---
        const attachComponent = (usage, basePos, baseRot, type, dims, forceSymmetry = null, preventRotationSymmetry = false) => {
            // Add primary component
            let name;
            let namePromise = null;

            // Sanitize usage string for display name, removing numbers and underscores
            const displayName = usage.replace(/[0-9]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

            if (this.gameEngine && this.gameEngine.loreGenerator && this.gameEngine.loreGenerator.nameGenerator) {
                // Use the Lore Generator for procedural names
                const ng = this.gameEngine.loreGenerator.nameGenerator;
                const context = { type: 'TECHNOLOGY', usage: displayName };
                
                if (typeof ng.generatePlaceholder === 'function') {
                    name = ng.generatePlaceholder(context, random());
                    // Start the slow generation in background
                    namePromise = ng.generate(context, random());
                } else {
                    // Fallback for synchronous generators
                    name = ng.generate(context, random());
                }
            }

            if (!name) {
                let manufacturerName = FALLBACK_MANUFACTURERS[Math.floor(random() * FALLBACK_MANUFACTURERS.length)];
                const activeCorps = GalacticHistory.getCorporations()?.filter(c => c.status === 'Active');

                if (activeCorps && activeCorps.length > 0) {
                    manufacturerName = activeCorps[Math.floor(random() * activeCorps.length)].name;
                }
                name = `${manufacturerName} ${TECH_SPECS[Math.floor(random() * TECH_SPECS.length)]} ${displayName} ${QUALITIES[Math.floor(random() * QUALITIES.length)]}`;
            }

            // Generate a more robust unique ID
            const id = `${usage}_${(random() * 1e9) | 0}`;
            const stats = {
                integrity: 100 * (techLevel * 0.2),
                mass: 50,
                efficiency: 0.8 + (techLevel * 0.05),
                techLevel: techLevel
            };

            components.push({ usage, name, namePromise, type, dims, pos: basePos, rot: baseRot, id, stats });

            const effectiveSymmetry = forceSymmetry || symmetryType;

            // Handle Symmetry
            if (effectiveSymmetry === 'REFLECTIVE' && Math.abs(basePos[0]) > 0.1) {
                // Mirror across X axis (Standard Left/Right)
                const symPos = [-basePos[0], basePos[1], basePos[2]];
                let symRot = [baseRot[0], -baseRot[1], -baseRot[2]];
                let symScale = [-1, 1, 1];

                // FIX: Wedges are only symmetrical in one plane. Use rotation instead of negative scale to flip.
                if (type === 'wedge') {
                    symScale = [1, 1, 1];
                    symRot[2] += Math.PI;
                }

                // Apply random scaling variation to both (symmetric)
                if (type !== 'wedge') {
                    const scaleVar = 1.0 + (random() * 0.2 - 0.1); // +/- 10%
                    components[components.length - 1].scale = [scaleVar, scaleVar, scaleVar]; // Update original
                    symScale = [symScale[0] * scaleVar, symScale[1] * scaleVar, symScale[2] * scaleVar]; // Update mirror
                }

                components.push({ usage, name, namePromise, type, dims, pos: symPos, rot: symRot, scale: symScale, id: id + '_sym', stats });
            } else if (effectiveSymmetry === 'RADIAL') {
                // Check if component is on the axis of rotation to prevent overlapping duplicates
                const threshold = 0.1;
                const onAxis = (radialAxis === 'z' && Math.abs(basePos[0]) < threshold && Math.abs(basePos[1]) < threshold) ||
                    (radialAxis === 'y' && Math.abs(basePos[0]) < threshold && Math.abs(basePos[2]) < threshold);

                if (!onAxis || preventRotationSymmetry) {
                    const count = radialCount;
                    const radialIds = [{ id: id, pos: basePos }];

                    for (let i = 1; i < count; i++) {
                        const angle = (Math.PI * 2 / count) * i;
                        const cos = Math.cos(angle);
                        const sin = Math.sin(angle);

                        let rPos, rRot;

                        if (radialAxis === 'z') {
                            // Rotate around Z (Rocket style)
                            rPos = [
                                basePos[0] * cos - basePos[1] * sin,
                                basePos[0] * sin + basePos[1] * cos,
                                basePos[2]
                            ];
                            // Use Quaternion for correct global rotation
                            const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...baseRot));
                            const symQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
                            if (!preventRotationSymmetry) q.premultiply(symQ);
                            const e = new THREE.Euler().setFromQuaternion(q);
                            rRot = [e.x, e.y, e.z];
                        } else {
                            // Rotate around Y (Saucer style)
                            rPos = [
                                basePos[0] * cos + basePos[2] * sin,
                                basePos[1],
                                -basePos[0] * sin + basePos[2] * cos
                            ];
                            // Use Quaternion for correct global rotation
                            const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...baseRot));
                            const symQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                            if (!preventRotationSymmetry) q.premultiply(symQ);
                            const e = new THREE.Euler().setFromQuaternion(q);
                            rRot = [e.x, e.y, e.z];
                        }

                        const rId = id + `_rad_${i}`;
                        components.push({ usage, name, namePromise, type, dims, pos: rPos, rot: rRot, id: rId, stats });
                        radialIds.push({ id: rId, pos: rPos });
                        // Return the ID so we can link to it if needed
                    }
                }
            }
        };

        // 1. Generate Central Fuselage (Spine, Saucer, or Star)
        const spineLength = (size === 'small' ? 3 : (size === 'medium' ? 6 : 10)) * (0.8 + random() * 0.4);

        // Context object to pass to generators
        const context = {
            size,
            techLevel,
            spineLength,
            random,
            harmonicSegments,
            symmetryType,
            radialAxis,
            radialCount,
            attachComponent,
            wiringGenerator: this.wiringGenerator,
            explicitWiring,
            components,
            gameEngine: this.gameEngine
        };

        let mainHullRadius = 0;
        
        // Determine Hull Layout Strategy
        let hullType = 'SPINE';
        const rHull = random();
        let res = {};

        if (size === 'large' && rHull > 0.85) {
             hullType = random() > 0.5 ? 'STATION_WHEEL' : 'STATION_RING';
             // Stations often look best with Radial Y symmetry
             if (random() > 0.3) {
                 // Force radial Y for stations to ensure they lay flat/spin correctly
                 // Note: We can't easily change symmetryType here without refactoring, 
                 // but we can ensure the hull generation respects it.
             }
        } else if (symmetryType === 'RADIAL') {
             if (radialAxis === 'y') hullType = random() > 0.4 ? 'DISC' : 'STAR';
             else {
                 const roll = random();
                 if (radialCount >= 2 && radialCount <= 4 && roll > 0.7) hullType = 'LIBERATOR';
                 else hullType = roll > 0.4 ? 'Y_FORK' : 'SPINE';
             }
        } else if (symmetryType === 'ASYMMETRICAL') {
             if (rHull < 0.2) hullType = 'HORSESHOE'; // C-shape / Alien Juggernaut
             else if (rHull < 0.4) hullType = 'BLOB'; // Falcon-ish / Asymmetrical Wedge
             else if (rHull < 0.6) hullType = 'MAZE';
             else if (rHull < 0.75) hullType = 'BIO_CLUSTER';
             else hullType = 'MONOLITH'; // Borg / Monolith style
        } else if (symmetryType === 'REFLECTIVE') {
             if (rHull < 0.2 && size !== 'small') hullType = 'FREIGHTER'; // Nostromo / Trucker
             else if (rHull < 0.3) hullType = 'CATAMARAN'; // Twin Hull
             else if (rHull < 0.45) hullType = 'BATTLESTAR'; // New Type
             else if (rHull < 0.55) hullType = 'Y_FORK';
             else if (rHull < 0.7) hullType = 'FRACTAL';
             else hullType = 'SPINE';
        }

        // Inject Biological Types if Organic style
        if (selectedStyle === 'ORGANIC' && random() > 0.4) {
            const bioTypes = ['BIO_BIRD', 'BIO_FISH', 'BIO_CEPHALOPOD', 'BIO_INSECT'];
            hullType = bioTypes[Math.floor(random() * bioTypes.length)];
        }
        
        // Force INDUSTRIAL style for BLOB (Falcon-like) to ensure CSG carving works for the engine strip
        if (hullType === 'BLOB') {
            selectedStyle = 'INDUSTRIAL';
        }

        if (hullType === 'DISC') {
            // Saucer Body: Single large flat cylinder/prism
            res = generateDisc(context);
            mainHullRadius = res.mainHullRadius;
        } else if (hullType === 'FREIGHTER') {
            selectedStyle = 'BOXY';
            generateFreighter(context);
        } else if (hullType === 'HORSESHOE') {
            generateHorseshoe(context);
        } else if (hullType === 'BLOB') {
            res = generateBlob(context);
            cockpitPlaced = res.cockpitPlaced;
        } else if (hullType === 'CATAMARAN') {
            generateCatamaran(context);
        } else if (hullType === 'Y_FORK') {
            generateYFork(context);
        } else if (hullType === 'TREE') {
            generateTree(context);
        } else if (hullType === 'MAZE') {
            generateMaze(context);
        } else if (hullType === 'STATION_WHEEL' || hullType === 'STATION_RING') {
            generateStation(context, hullType);
        } else if (hullType === 'BIO_CLUSTER') {
            generateBioCluster(context);
        } else if (hullType === 'MONOLITH') {
            generateMonolith(context);
        } else if (hullType === 'FRACTAL') {
             generateFractal(context);
        } else if (hullType === 'BATTLESTAR') {
            generateBattlestar(context);
        } else if (hullType === 'LIBERATOR') {
            generateLiberator(context);
        } else {
            // SPINE / STAR (Default)
            res = generateSpineOrStar(context, hullType);
        }

        // Calculate generic hull radius/bounds for attachments
        let hullRadius = 2.0;
        const mainHull = components.find(c => c.usage.includes('fuselage') || c.usage.includes('hull'));
        
        if (mainHull && mainHull.dims) {
            // Rough estimate of extent
            hullRadius = Math.max(mainHull.dims.radius || 0, mainHull.dims.radiusTop || 0, mainHull.dims.radiusBottom || 0, (mainHull.dims.width || 0)/2, (mainHull.dims.depth || 0)/2);
            if (hullType === 'MONOLITH') hullRadius *= 1.2; // Extra buffer for monoliths
        } else if (components.length > 0) {
            // Fallback: Calculate bounds of all components (Handles MAZE, BIO_CLUSTER, FRACTAL)
            let maxExtent = 0;
            components.forEach(c => {
                const d = c.pos.map(Math.abs);
                const dim = Math.max(c.dims.width || 0, c.dims.height || 0, c.dims.depth || 0, c.dims.radius || 0);
                const r = Math.max(...d) + dim;
                if (r > maxExtent) maxExtent = r;
            });
            hullRadius = Math.max(2.0, maxExtent);
        }
        if (hullType === 'BLOB') hullRadius = spineLength * 0.6;

        // Engines
        const engineCount = size === 'small' ? 1 : (size === 'medium' ? 2 : 4);
        if (hullType === 'DISC') {
            // Saucer engines on rim (logic unchanged)
            const engR = mainHullRadius * 0.65;
            const engHeight = 2.0;
            
            // Embed engines deeply into the saucer, centered vertically (y=0).
            // This allows them to perturb the upper surface and not stick out the bottom excessively.
            attachComponent('engine', [engR, 0, 0], [0, 0, 0], 'cylinder', 
                { radiusTop: 0.8, radiusBottom: 0.6, height: engHeight }, 'RADIAL');
        } else if (hullType === 'FREIGHTER') {
            // Freighter engines are attached to the engine block at the rear
            const trussLen = spineLength * 1.5;
            const engineZ = -trussLen/2 - 4.0; // Behind the engine block (which is at -trussLen/2 - 2.5)
            
            // Main Engine
            attachComponent('engine_main', [0, 0, engineZ], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 1.0, radiusBottom: 1.5, height: 3.0 });
            // Side Engines
            attachComponent('engine_side', [2.5, 0, engineZ + 0.5], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 0.6, radiusBottom: 0.9, height: 2.5 }, 'REFLECTIVE');
        } else if (hullType === 'Y_FORK') {
             // Engines on prongs
             const prongLen = spineLength * 0.8;
             const spreadAngle = Math.PI / 6;
             
             const ex = Math.sin(spreadAngle) * prongLen;
             const ez = -Math.cos(spreadAngle) * prongLen;
             
             const symMode = symmetryType === 'ASYMMETRICAL' ? 'REFLECTIVE' : symmetryType;
             
             attachComponent('engine', [ex, 0, ez], [Math.PI/2, 0, -spreadAngle], 'cylinder', 
                {radiusTop: 0.8, radiusBottom: 1.1, height: 2.0}, symMode);
        } else if (hullType === 'MONOLITH') {
            // Monolith Engines: Place on faces or vertices to avoid edge-splitting
            const mono = components.find(c => c.usage === 'fuselage_monolith');
            let rearPoints = [];
            
            if (mono) {
                const rot = new THREE.Euler(...mono.rot);
                const q = new THREE.Quaternion().setFromEuler(rot);
                let vertices = [];

                if (mono.type === 'prism') {
                    const r = mono.dims.radius || 1;
                    const h = mono.dims.height || 1;
                    const segs = mono.dims.segments || 4;
                    for (let i = 0; i < segs; i++) {
                        const theta = (i / segs) * Math.PI * 2;
                        vertices.push(new THREE.Vector3(r * Math.cos(theta), h/2, r * Math.sin(theta)));
                        vertices.push(new THREE.Vector3(r * Math.cos(theta), -h/2, r * Math.sin(theta)));
                    }
                } else if (mono.type === 'tetrahedron') {
                    const r = mono.dims.radius || 1;
                    const s = r / Math.sqrt(3);
                    vertices.push(new THREE.Vector3(s, s, s));
                    vertices.push(new THREE.Vector3(s, -s, -s));
                    vertices.push(new THREE.Vector3(-s, s, -s));
                    vertices.push(new THREE.Vector3(-s, -s, s));
                } else {
                    const w = (mono.dims.width || 2) / 2;
                    const h = (mono.dims.height || 2) / 2;
                    const d = (mono.dims.depth || 2) / 2;
                    vertices = [
                        new THREE.Vector3(w, h, d), new THREE.Vector3(w, h, -d),
                        new THREE.Vector3(w, -h, d), new THREE.Vector3(w, -h, -d),
                        new THREE.Vector3(-w, h, d), new THREE.Vector3(-w, h, -d),
                        new THREE.Vector3(-w, -h, d), new THREE.Vector3(-w, -h, -d)
                    ];
                }
                
                const worldVerts = vertices.map(v => v.applyQuaternion(q).add(new THREE.Vector3(...mono.pos)));
                const minZ = worldVerts.reduce((min, v) => Math.min(min, v.z), Infinity);
                
                // Find vertices near the back
                rearPoints = worldVerts.filter(v => v.z < minZ + 0.5);
            }
            
            if (rearPoints.length > 0) {
                // Place engines at these rear points (corners/edges)
                // If too many, just pick a couple
                const pointsToUse = rearPoints.length > 4 ? [rearPoints[0], rearPoints[rearPoints.length-1]] : rearPoints;
                
                pointsToUse.forEach((pt, i) => {
                    // Embed by 0.5 units (Center at z - 1.0 for height 3.0 means front at z + 0.5)
                    attachComponent(`engine_${i}`, [pt.x, pt.y, pt.z - 1.0], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: 0.8, radiusBottom: 1.2, height: 3.0 });
                });
            } else {
                 // Fallback
                 attachComponent('engine', [0, 0, -spineLength/2 - 2], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: 0.8, radiusBottom: 1.2, height: 3.0 });
            }
        } else {
            if (hullType === 'STATION_RING' || hullType === 'STATION_WHEEL') {
                // Engines on the rim for rings
                const r = spineLength * 1.5;
                const tubeR = size === 'large' ? 3 : 1.5;
                
                // Distribute engines around the ring using radial symmetry
                // Place them slightly embedded in the rim
                // If Radial Axis is Y (Horizontal Ring), place on X axis
                // If Radial Axis is Z (Vertical Wheel), place on X axis
                // We use the 'RADIAL' symmetry of the ship to distribute them
                
                // Place at radius r (center of tube)
                attachComponent('engine', [r, 0, 0], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: 0.6, radiusBottom: 1.0, height: 2.5 }, 'RADIAL');

            } else 
            if (symmetryType === 'REFLECTIVE') {
                const engineHeight = 2.0;
                const engineZ = -spineLength / 2 - engineHeight / 2 + 0.5; // Increased overlap
                attachComponent('engine', [1.5, 0, engineZ], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 0.4, radiusBottom: 0.6, height: engineHeight });
            } else if (hullType === 'STAR') {
                // Engines at ends of arms
                const armLen = spineLength;
                // FIX: Rotate to point local -Y outwards along +X. This is a +90 deg rotation around Z.
                attachComponent('engine', [armLen, 0, 0], [0, 0, Math.PI / 2], 'cylinder', { radiusTop: 0.5, radiusBottom: 0.8, height: 2.0 });
            } else {
                // Central engine
                const engineHeight = 2.5;
                const engineZ = -spineLength / 2 - engineHeight / 2 + 0.5; // Increased overlap
                attachComponent('engine', [0, 0, engineZ], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 0.6, radiusBottom: 0.9, height: engineHeight });
            }
        }

        // Wings & Fins Generation
        if (random() > 0.1 && (hullType === 'SPINE' || hullType === 'BIO_BIRD' || hullType === 'BIO_INSECT')) { 
            const wingConfigVal = random(); // 0-0.4: Mono, 0.4-0.7: X-Wing, 0.7-1.0: Bi-Wing
            let wingConfig;
            if (wingConfigVal < 0.4) wingConfig = 'Monoplane';
            else if (wingConfigVal < 0.7) wingConfig = 'X-Wing';
            else wingConfig = 'Bi-Wing';

            // Prevent X-Wing style with radial symmetry
            let effectiveWingConfig = wingConfig;
            if (symmetryType === 'RADIAL' && wingConfig === 'X-Wing') {
                effectiveWingConfig = random() > 0.5 ? 'Monoplane' : 'Bi-Wing'; // Fallback to other types
            }

            // Dimensions - Allow larger wings relative to fuselage
            const baseRootChord = spineLength * (0.5 + random() * 0.5); // 50% to 100% of fuselage length
            const baseSpan = baseRootChord * (0.25 + random() * 0.75); // 25% to 100% of root chord
            const wingThickness = 0.2 + random() * 0.1;

            // Calculate Max Span for Radial Symmetry to prevent overlap
            let maxSpan = baseSpan;
            if (symmetryType === 'RADIAL') {
                const circumference = 2 * Math.PI * (mainHullRadius || 2);
                maxSpan = Math.min(baseSpan, (circumference / radialCount) * 0.8);
            }

            // Position Z: Explicit separation
            const wingZ = 0; // Main wings centered
            const canardZ = spineLength / 2 - 1.0; // Front
            const tailZ = -spineLength / 2 + 1.0; // Back

            // Calculate attachment point using Raycasting to ensure surface contact
            let attachX = 2.0; // Default fallback
            let attachY = 0;

            // Raycast from far right towards center to find the hull surface
            const rayOrigin = [50, 0, wingZ];
            const rayDir = [-1, 0, 0];
            const hit = this.getSurfacePoint(components, rayOrigin, rayDir, ['fuselage', 'hull', 'spine']);

            if (hit) {
                attachX = hit.x;
                attachY = hit.y;
                // Embed slightly to ensure connection (0.5 units)
                // Since we are attaching to the right side (+X), we subtract from X
                attachX -= 0.5;
            }

            // Force reflective symmetry for wings if the ship is asymmetrical, to ensure balance
            const symOverride = symmetryType === 'ASYMMETRICAL' ? 'REFLECTIVE' : null;

            if (effectiveWingConfig === 'Monoplane') {
                // Monoplane (Standard) - Variable height
                // Use calculated attachment Y instead of random
                const wingDefs = createSingleWingStructure([attachX, attachY, wingZ], 0, baseRootChord, symmetryType === 'RADIAL', wingThickness, baseSpan, random);
                
                let parentId = null;
                wingDefs.forEach((def, i) => {
                    attachComponent(def.usage, def.pos, def.rot, def.type, def.dims, symOverride);
                    // Get the ID of the component just added (it's the last one in the list)
                    const currentId = components[components.length - 1].id;
                    
                    // Wire to parent (previous segment) or fuselage if first
                    if (i === 0) {
                        // Main wing connects to fuselage. We find the nearest fuselage segment later in WiringGenerator, 
                        // but we can hint it here if we knew the fuselage ID. 
                        // For now, let WiringGenerator handle root-to-fuselage.
                    } else if (parentId) {
                        // Wire extension to parent wing segment
                        this.wiringGenerator.addConnection(explicitWiring, currentId, parentId, 'structural', 1.0);
                    }
                    parentId = currentId;
                });
            } else if (effectiveWingConfig === 'X-Wing') {
                // X-Wing (Angled)
                const angle = (Math.PI / 6) + random() * (Math.PI / 6); // 30-60 degrees
                
                const processWing = (defs) => {
                    let parentId = null;
                    defs.forEach((def, i) => {
                        attachComponent(def.usage, def.pos, def.rot, def.type, def.dims, symOverride);
                        const currentId = components[components.length - 1].id;
                        if (i > 0 && parentId) this.wiringGenerator.addConnection(explicitWiring, currentId, parentId, 'structural', 1.0);
                        parentId = currentId;
                    });
                };

                processWing(createSingleWingStructure([attachX, attachY + 0.2, wingZ], angle, baseRootChord, false, wingThickness, maxSpan, random));
                processWing(createSingleWingStructure([attachX, attachY - 0.2, wingZ], -angle, baseRootChord, false, wingThickness, maxSpan, random));
            } else {
                // Bi-Wing (Stacked)
                const gap = 2.0 + random();
                
                const processWing = (defs) => {
                    let parentId = null;
                    defs.forEach((def, i) => {
                        attachComponent(def.usage, def.pos, def.rot, def.type, def.dims, symOverride);
                        const currentId = components[components.length - 1].id;
                        if (i > 0 && parentId) this.wiringGenerator.addConnection(explicitWiring, currentId, parentId, 'structural', 1.0);
                        parentId = currentId;
                    });
                };

                processWing(createSingleWingStructure([attachX, attachY + gap / 2, wingZ], 0, baseRootChord, symmetryType === 'RADIAL', wingThickness, maxSpan, random));
                processWing(createSingleWingStructure([attachX, attachY - gap / 2, wingZ], 0, baseRootChord, symmetryType === 'RADIAL', wingThickness, maxSpan, random));
            }

            // Fins (Canards / Tail)
            // Front Canards
            if (random() > 0.6) {
                const canardW = baseSpan * 0.4;
                const canardL = baseRootChord * 0.3;
                const cX = attachX * 0.8; // Use the calculated attach X
                const canardSweep = canardL * 0.4;
                attachComponent('fin_front', [cX, 0, canardZ], [0, 0, 0], 'wedge', { span: canardW, rootChord: canardL, sweep: canardSweep, depth: 0.15, centered: false }, symOverride);
            }

            // Rear Fins / Vertical Stabilizers
            if (random() > 0.4) {
                const tailH = 2 + random() * 2;
                const tailL = spineLength * (0.2 + random() * 0.3); // Scale fin length to fuselage
                const tailSweep = tailL * 0.5;
                // Vertical fin on top (Rotate 90 Z)
                const tY = 0.8;
                attachComponent('fin_tail_top', [0, tY, tailZ], [0, 0, Math.PI / 2], 'wedge', { span: tailH, rootChord: tailL, sweep: tailSweep, depth: 0.2, centered: false });

                // Optional Bottom Fin
                if (random() > 0.7) {
                    attachComponent('fin_tail_bottom', [0, -tY, tailZ], [0, 0, -Math.PI / 2], 'wedge', { span: tailH, rootChord: tailL, sweep: tailSweep, depth: 0.2, centered: false });
                }
            }
        }

        // Cockpit
        let cockpitPlaced = false;

        // Check if we already added a bridge/cockpit in the hull generation phase (e.g. Freighter)
        if (components.some(c => c.usage.includes('bridge') || c.usage.includes('cockpit'))) {
            cockpitPlaced = true;
        }

        // 1. Check for "Tower Bridge" (Star Destroyer style) - Restricted to larger ships
        if (spineLength > 5 && (hullType === 'SPINE' || hullType === 'FREIGHTER' || hullType === 'Y_FORK') && random() > 0.4) {
            cockpitPlaced = true;
            const towerH = 1.5 + random();
            const towerZ = -(spineLength / 2) + 2.0;

            // Tower neck (Central)
            attachComponent('bridge_tower', [0, towerH / 2, towerZ], [0, 0, 0], 'box', { width: 1.0, height: towerH, depth: 1.5 });

            // Bridge on top
            if (symmetryType === 'REFLECTIVE' || symmetryType === 'RADIAL') {
                // Symmetrical Bridge: Use a Prism (Triangular) to look like a gable/wedge but symmetrical
                // Rotate to align flat side down
                attachComponent('bridge', [0, towerH + 0.4, towerZ], [Math.PI / 2, Math.PI / 2, 0], 'prism', { radius: 1.5, height: 1.5, segments: 3 });
            } else {
                // Asymmetrical Bridge: Use the Wedge
                attachComponent('bridge', [0, towerH + 0.4, towerZ], [0, 0, 0], 'wedge', { width: 3.0, length: 1.5, depth: 0.6 });
            }
        }

        // 2. Fallback / Other Styles
        if (!cockpitPlaced) {
            if (hullType === 'MONOLITH') {
                // Monolith Cockpit: Ensure it's outside the hull
                // Use raycasting from front (+Z) towards center
                const hit = this.getSurfacePoint(components, [0, 0, 50], [0, 0, -1], ['fuselage', 'monolith']);
                if (hit) {
                    // Embed by 0.5 units (Center at hit.z + 0.5 for depth 2.0 means back at hit.z - 0.5)
                    attachComponent('cockpit', [hit.x, hit.y, hit.z + 0.5], [0, 0, 0], 'box', { width: 2.5, height: 1.5, depth: 2.0 });
                } else {
                    // Fallback
                    attachComponent('cockpit', [0, 0, hullRadius + 0.5], [0, 0, 0], 'box', { width: 2.5, height: 1.5, depth: 2.0 });
                }
            } else if (hullType === 'HORSESHOE') {
                 // Horseshoe Cockpit: Place on the arc tip to avoid floating in the center void
                 const r = spineLength * 0.8; // Radius used in generation
                 const angle = 1.0; // Near tip (approx 57 degrees)
                 const cx = Math.cos(angle) * r;
                 const cz = Math.sin(angle) * r;
                 attachComponent('cockpit', [cx, 0, cz], [0, angle + Math.PI/2, 0], 'box', { width: 2, height: 1.5, depth: 3 });
            } else if (symmetryType === 'ASYMMETRICAL' || hullType === 'BLOB' || hullType === 'MAZE') {
                // Asymmetrical Side Cockpit (Cylinder Strut + Capsule)
                const isLeft = random() > 0.5;
                const sideDir = isLeft ? 1 : -1;
                
                // Strut configuration: Angled forward 30-60 degrees
                // We use 45 +/- 10 to ensure it is clearly diagonal and not straight forward or sideways
                const angleDeg = 45 + (random() - 0.5) * 20; 
                const angleRad = angleDeg * (Math.PI / 180);
                const strutLen = hullRadius * (1.2 + random() * 0.5);
                
                // Start at hull edge
                const startX = sideDir * hullRadius * 0.8;
                // Move startZ forward so the cockpit ends up near the front
                // If spineLength is 10, front is 5. 
                // We want endZ to be around 4-5.
                // endZ = startZ + sin(angle) * strutLen.
                // If strutLen is ~3, sin(45)*3 ~ 2.1. So startZ should be around 2.0.
                const startZ = spineLength * 0.25; 

                // End point (Cockpit location)
                // Angle is from X axis towards Z axis
                const endX = startX + (Math.cos(angleRad) * strutLen * sideDir);
                const endZ = startZ + (Math.sin(angleRad) * strutLen);
                
                // Strut Midpoint and Rotation
                const strutMidX = (startX + endX) / 2;
                const strutMidZ = (startZ + endZ) / 2;
                
                // Align cylinder with vector
                const dx = endX - startX;
                const dz = endZ - startZ;
                const rotY = Math.atan2(dx, dz);
                
                attachComponent('cockpit_strut', [strutMidX, 0, strutMidZ], [Math.PI/2, rotY, 0], 'cylinder', 
                    { radiusTop: 0.6, radiusBottom: 0.6, height: strutLen });
                
                // Capsule Cockpit
                const capLen = 3.0;
                const capRad = 1.0;
                const overlap = 0.5;
                const cockZ = endZ + capLen/2 - overlap;
                
                attachComponent('cockpit', [endX, 0, cockZ], [Math.PI/2, 0, 0], 'capsule', 
                    { radius: capRad, length: capLen - (capRad*2) }); 
            } else {
                if (hullType === 'DISC') {
                    // Cockpit on rim or center? Let's put it on the rim for rotation
                    const r = mainHullRadius * 0.8;
                    attachComponent('cockpit', [r, 0.5, 0], [0, 0, 0], 'ellipsoid', { width: 1.5, height: 0.8, length: 1.5 });
                } else if (hullType === 'STAR') {
                    // Cockpit on one arm
                    attachComponent('cockpit', [spineLength * 0.5, 0.5, 0], [0, 0, 0], 'ellipsoid', { width: 1.2, height: 0.8, length: 2.0 }, 'NONE'); // Only one cockpit
                } else if (hullType === 'HORSESHOE') {
                    // Cockpit on one tip of the horseshoe
                    const r = spineLength * 0.6; // Approx radius used in generation
                    attachComponent('cockpit', [r, 0.5, r], [0, Math.PI/4, 0], 'box', { width: 2, height: 1.5, depth: 3 });
                } else if (hullType === 'STATION_WHEEL' || hullType === 'STATION_RING') {
                    // Cockpit on Hub or Rim
                    const pos = hullType === 'STATION_WHEEL' ? [0, 2.5, 0] : [spineLength * 1.5, 1.5, 0];
                    attachComponent('cockpit', pos, [0, 0, 0], 'cylinder', { radiusTop: 1, radiusBottom: 1.2, height: 1.5 });
                } else if (hullType.startsWith('BIO_')) {
                    // Bio ships usually have head cockpits already, but if not:
                    // Place on top
                    attachComponent('cockpit', [0, 1.0, spineLength/3], [0, 0, 0], 'ellipsoid', { width: 1.0, height: 0.8, length: 1.5 });
                } else {
                    const cockpitZ = (spineLength / 2) - 1.5;
                    attachComponent('cockpit', [0, 0.6, cockpitZ], [0, 0, 0], 'ellipsoid', { width: 1.0, height: 0.8, length: 1.5 });
                }
            }
        }

        // Essential Systems (Power, Shield, Vortex) - Distributed Placement
        // Generator
        let genPos;
        if (hullType === 'DISC') genPos = [mainHullRadius * 0.4, 0, 0];
        else if (hullType === 'STAR') genPos = [spineLength * 0.3, 0, 0];
        else if (hullType === 'STATION_RING') {
            // Place on rim, opposite cockpit (approx)
            const r = spineLength * 1.5;
            genPos = [-r, 0, 0]; 
        } else if (hullType === 'STATION_WHEEL') {
            // Place on Hub
            genPos = [0, -1.5, 0];
        } else if (hullType === 'HORSESHOE') {
             const r = spineLength * 0.8;
             genPos = [r, -1.0, 0]; // Bottom of arc, back center
        } else {
            genPos = [0, -0.5, -(spineLength / 2) + 1.5];
        }
        attachComponent('generator', genPos, [0, 0, 0], 'box', { width: 1.5, height: 1.0, depth: 1.5 });

        // Shield Generator
        let shieldPos;
        let shieldDims = { radius: 0.8, tube: 0.2 };
        let shieldRot = [Math.PI / 2, 0, 0];

        if (hullType === 'STATION_RING' || hullType === 'STATION_WHEEL') {
             const rHull = spineLength * 1.5;
             const tubeR = size === 'large' ? 3 : 1.5;
             
             // Intersecting Torus Logic: Centered and sized to intersect the hull rim
             // Making radius equal ensures they intersect at the poles of the ring
             const rShield = rHull; 
             
             shieldDims = { radius: rShield, tube: tubeR * 0.4 };
             shieldPos = [0, 0, 0]; // Centered on CoG

             if (radialAxis === 'y') {
                 shieldRot = [Math.PI / 2, 0, 0]; // XZ Plane (Aligned with XZ Hull)
             } else {
                 shieldRot = [0, 0, 0]; // XY Plane (Aligned with XY Hull)
             }
        } else if (hullType === 'HORSESHOE') {
             // Place on the arc (back center) to avoid floating in void
             const r = spineLength * 0.8;
             shieldPos = [r, 1.0, 0]; // Top of arc, back center
        } else {
             shieldPos = hullType === 'DISC' ? [0, 0.5, 0] : [0, 0.8, 0];
        }
        attachComponent('shield', shieldPos, shieldRot, 'torus', shieldDims, 'NONE'); // Single shield

        // Vortex Generator
        let vortexPos;
        if (hullType === 'STATION_RING') {
             const r = spineLength * 1.5;
             vortexPos = [0, 0, -r]; // Opposite shield on rim
             if (radialAxis === 'z') vortexPos = [0, -r, 0];
        } else if (hullType === 'HORSESHOE') {
             const r = spineLength * 0.8;
             vortexPos = [r - 1.5, 0, 0]; // Inner curve
        } else {
             vortexPos = hullType === 'DISC' ? [mainHullRadius * 0.6, -0.5, 0] : [0, -0.8, spineLength / 2 - 1];
        }
        attachComponent('vortex', vortexPos, [0, 0, 0], 'dodecahedron', { radius: 0.6 });

        // Add Torus Ring for Radial Ships (Moved to end to check for wing connections)
        if (symmetryType === 'RADIAL' && random() > 0.7) { // Reduced probability from 0.3 to 0.7
            const ringRadius = (size === 'small' ? 3 : (size === 'medium' ? 6 : 10)) * (0.5 + random() * 0.5);
            const tubeRadius = ringRadius * 0.15 * (0.8 + random() * 0.4);

            let ringRot = [0, 0, 0];
            if (radialAxis === 'y') {
                ringRot = [Math.PI / 2, 0, 0];
            }

            // Check if any existing component (like a Wing) already connects to the ring
            let isConnected = false;
            const ringInnerR = ringRadius - tubeRadius;

            for (const c of components) {
                // Check if component extends from near center to the ring
                let dist = 0;
                let extent = 0;

                if (radialAxis === 'z') { // Ring in XY plane
                    dist = new THREE.Vector2(c.pos[0], c.pos[1]).length();
                    extent = Math.max(c.dims.width || 0, c.dims.height || 0, c.dims.depth || 0, c.dims.span || 0, c.dims.radius || 0);
                } else { // Ring in XZ plane (Saucer)
                    dist = new THREE.Vector2(c.pos[0], c.pos[2]).length();
                    extent = Math.max(c.dims.width || 0, c.dims.height || 0, c.dims.depth || 0, c.dims.span || 0, c.dims.radius || 0);
                }

                // If it's a wing (wedge), check span specifically
                if (c.type === 'wedge') {
                    const tipDist = dist + (c.dims.span || 0);
                    if (dist < ringInnerR && tipDist >= ringInnerR) {
                        isConnected = true;
                        break;
                    }
                } else {
                    // General check for other components
                    if (dist < ringInnerR && (dist + extent/2) >= ringInnerR) {
                        isConnected = true;
                        break;
                    }
                }
            }

            const ringId = 'fuselage_ring';
            attachComponent(ringId, [0, 0, 0], ringRot, 'torus', { radius: ringRadius, tube: tubeRadius }, 'NONE');
            
            // Only add spokes/struts if no other component connects the ring
            if (!isConnected) {
                const numSpokes = Math.max(3, radialCount);
                for(let i=0; i<numSpokes; i++) {
                    const angle = (Math.PI * 2 / numSpokes) * i;
                    const spokeLen = ringRadius - (tubeRadius || 1);
                    let sPos, sRot;
                    if (radialAxis === 'y') {
                        sPos = [Math.cos(angle) * spokeLen/2, 0, Math.sin(angle) * spokeLen/2];
                        sRot = [0, -angle, Math.PI/2]; 
                    } else {
                        sPos = [Math.cos(angle) * spokeLen/2, Math.sin(angle) * spokeLen/2, 0];
                        sRot = [0, 0, -angle + Math.PI/2]; 
                    }
                    attachComponent(`ring_spoke_${i}`, sPos, sRot, 'cylinder', { radiusTop: tubeRadius * 0.5, radiusBottom: tubeRadius * 0.5, height: spokeLen }, 'NONE');
                }
            }
        }

        // --- 2b. Calculate Center of Gravity (CoG) ---
        let totalMass = 0;
        let cog = new THREE.Vector3(0, 0, 0);

        components.forEach(c => {
            // Estimate mass from volume
            const d = c.dims;
            const vol = (d.width || d.radius || 1) * (d.height || d.radius || 1) * (d.depth || d.length || 1);
            const mass = vol * (c.usage === 'engine' ? 2.0 : 1.0); // Engines are heavy

            cog.add(new THREE.Vector3(...c.pos).multiplyScalar(mass));
            totalMass += mass;
        });

        if (totalMass > 0) cog.divideScalar(totalMass);

        // --- 2b.1 Move Shield Generator to CoG (or near it) ---
        // We want it balanced, but maybe not exactly at 0,0,0 if the CoG is there.
        // Actually, centering it on CoG is good for a shield.
        const shieldComp = components.find(c => c.usage === 'shield');
        if (shieldComp) {
            shieldComp.pos = [cog.x, cog.y, cog.z];
            // Ensure it doesn't clip too badly by checking bounds? 
            // For now, centering it is the requirement.
        }

        // --- 2b.2 Re-orient Engines to push through CoG --- (REMOVED per user feedback)
        // This was causing engines to be angled in ways that were visually unappealing
        // and could cause detachment from the fuselage. We will now assume parallel thrust
        // and that any torque from asymmetrical designs is handled by maneuvering thrusters or other systems.

        // 3. Generate Wiring Graph (Logical connections)
        // Use the WiringGenerator to create the full graph
        const wiringGraph = this.wiringGenerator.generateLogicalGraph(components, explicitWiring);
        
        // 4. Enforce Symmetry on Wiring
        this.enforceWiringSymmetry(wiringGraph, components);

        // Store the graph for harmonics calculation later
        // Note: In the refactored version, we return this data instead of setting it on 'this'
        // The caller (ShipFactory) will handle storing it.

        // Store symmetry info for greebling
        components.symmetryType = symmetryType;
        components.radialAxis = radialAxis;
        components.radialCount = radialCount;
        components.hullType = hullType;
        components.seed = seedVal;

        // Store style config for generation
        components.styleConfig = {
            method: selectedStyle,
            plating: random() > 0.5,
            blendStrength: selectedStyle === 'ORGANIC' ? 1.5 : 0.1,
            padding: padding
        };

        // Generate Livery (Seeded)
        // Use HSL to ensure we don't get black ships (military/stealth)
        // Bias towards industrial colors (low saturation, medium-high lightness)
        const hue = random();
        const saturation = random() * 0.3; // Low saturation
        const lightness = 0.6 + random() * 0.3; // 60% to 90% lightness (avoid darks)
        
        let baseColor = new THREE.Color().setHSL(hue, saturation, lightness);
        
        // Override colors for specific styles
        if (selectedStyle === 'MINING') baseColor = new THREE.Color(0x554433); // Brown/Grey
        if (selectedStyle === 'METALLIC') {
            const metals = [0xFFD700, 0xC0C0C0, 0xB87333, 0xcd7f32]; // Gold, Silver, Copper, Bronze
            baseColor = new THREE.Color(metals[Math.floor(random() * metals.length)]);
        }

        components.livery = {
            noiseSeed: random() * 100,
            patternType: Math.floor(random() * 3),
            color1: baseColor.getHex(),
            color2: Math.floor(random() * 0xffffff),
            color3: Math.floor(random() * 0xffffff)
        };

        // Return the components array, but also attach the wiring graph to it so it can be retrieved
        components.wiringGraph = wiringGraph;

        return components;
    }

    enforceWiringSymmetry(wiringGraph, components) {
        const compMap = new Map(components.map(c => [c.id, c]));
        
        const getSymId = (id) => {
            if (id.endsWith('_sym')) return id.replace('_sym', '');
            if (!id.endsWith('_sym') && compMap.has(id + '_sym')) return id + '_sym';
            return null;
        };

        const newConnections = [];

        for (const [sourceId, connections] of Object.entries(wiringGraph)) {
            const sourceSymId = getSymId(sourceId);
            
            for (const conn of connections) {
                const targetId = conn.targetId;
                const targetSymId = getSymId(targetId);

                if (sourceSymId && targetSymId) {
                    if (!wiringGraph[sourceSymId] || !wiringGraph[sourceSymId].find(c => c.targetId === targetSymId)) {
                        newConnections.push({ source: sourceSymId, target: targetSymId, type: conn.wiringType, length: conn.length });
                    }
                } else if (sourceSymId && !targetSymId) {
                     if (!wiringGraph[sourceSymId] || !wiringGraph[sourceSymId].find(c => c.targetId === targetId)) {
                        newConnections.push({ source: sourceSymId, target: targetId, type: conn.wiringType, length: conn.length });
                    }
                } else if (!sourceSymId && targetSymId) {
                     if (!wiringGraph[sourceId] || !wiringGraph[sourceId].find(c => c.targetId === targetSymId)) {
                        newConnections.push({ source: sourceId, target: targetSymId, type: conn.wiringType, length: conn.length });
                    }
                }
            }
        }
        
        newConnections.forEach(c => {
            this.wiringGenerator.addConnection(wiringGraph, c.source, c.target, c.type, c.length);
        });
    }

    // Helper to find surface point via raycasting
    getSurfacePoint(components, origin, direction, usageFilter = ['fuselage', 'hull', 'spine', 'block', 'monolith']) {
        const targets = components.filter(c => {
            if (!c.usage) return false;
            const u = c.usage.toLowerCase();
            if (Array.isArray(usageFilter)) {
                return usageFilter.some(f => u.includes(f));
            }
            return u.includes(usageFilter);
        });
        if (targets.length === 0) return null;

        const raycaster = new THREE.Raycaster(
            new THREE.Vector3(...origin),
            new THREE.Vector3(...direction).normalize()
        );

        let closestPoint = null;
        let minDistance = Infinity;

        for (const c of targets) {
            let geo;
            const d = c.dims;
            
            try {
                switch (c.type) {
                    case 'box': geo = new THREE.BoxGeometry(d.width, d.height, d.depth); break;
                    case 'cylinder': geo = new THREE.CylinderGeometry(d.radiusTop, d.radiusBottom, d.height, d.radialSegments || 16); break;
                    case 'prism': geo = new THREE.CylinderGeometry(d.radius || d.radiusTop, d.radius || d.radiusBottom, d.height, d.segments || 3); break;
                    case 'tetrahedron': geo = new THREE.TetrahedronGeometry(d.radius); break;
                    case 'sphere': geo = new THREE.SphereGeometry(d.radius, 16, 16); break;
                    case 'torus': geo = new THREE.TorusGeometry(d.radius, d.tube, 16, 32); break;
                    case 'cone': geo = new THREE.ConeGeometry(d.radius, d.height, 16); break;
                    default: continue;
                }
            } catch (e) { continue; }

            const mesh = new THREE.Mesh(geo);
            mesh.position.set(...c.pos);
            mesh.rotation.set(...c.rot);
            if (c.scale) mesh.scale.set(...c.scale);
            mesh.updateMatrixWorld();

            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                if (intersects[0].distance < minDistance) {
                    minDistance = intersects[0].distance;
                    closestPoint = intersects[0].point;
                }
            }
            
            geo.dispose();
        }

        return closestPoint;
    }

    /**
     * Advanced WFC-based ship generation.
     */
    async createRandomShipWFC(seed, config = {}) {
        // This is a skeleton/implementation of how WFC would generate a ship.
        // It uses the UHPP pipeline if available.
        console.log("ShipGenerator: Generating ship using WFC...");

        // Define a simple 3D grid for the ship
        const gridDimensions = { x: 10, y: 5, z: 15 };

        // Initial setup for UHPP
        const initialContext = {
            gridDimensions,
            tileSet: {
                tiles: [
                    { type: 'Void', weight: 10, primitive: 'Box', color: 0x000000 },
                    { type: 'Hull', weight: 10, primitive: 'Box', color: 0xaaaaaa },
                    { type: 'Engine', weight: 2, primitive: 'Cylinder', color: 0xff3333 },
                    { type: 'Bridge', weight: 1, primitive: 'Box', color: 0x3333ff }
                ],
                weights: [10, 10, 2, 1],
                tileTypes: ['Void', 'Hull', 'Engine', 'Bridge']
            },
            rules: [
                [0, 1, 1], [1, 1, 1], [2, 1, 1], // Hull next to Hull
                [0, 1, 0], [1, 1, 0], [2, 1, 0], // Hull next to Void
                [2, 2, 1], // Engine at the back (negative Z) of Hull
                [2, 1, 3]  // Bridge at the front (positive Z) of Hull
            ],
            lsystemConfig: {
                axiom: 'F',
                productions: { 'F': 'F[+F]F' },
                iterations: 1
            }
        };

        // Note: Actual pipeline execution would happen in ShipFactory
        // which has access to the UniversalPipeline instance.
        // For now, we return a compatible component list that could be derived from WFC.

        return this.createRandomShip(seed, { ...config, useWFC: false });
    }
}
