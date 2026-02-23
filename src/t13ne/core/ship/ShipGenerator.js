import * as THREE from 'three';
import { TECH_SPECS, QUALITIES, FALLBACK_MANUFACTURERS, SHIP_PREFIXES, SHIP_ADJECTIVES, SHIP_NOUNS, getSurfacePoint } from '/src/t13ne/core/ship/ShipUtils.js';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { GalacticHistory } from '/src/t13ne/procgen/galaxy/GalacticHistory.js';
import { generateDisc, generateSpineOrStar } from '/src/t13ne/core/ship/structures/StandardHulls.js';
import { generateFreighter, generateHorseshoe, generateBlob, generateCatamaran, generateYFork, generateHeavyCarrier, generateSideCockpit, generateScavenger } from '/src/t13ne/core/ship/structures/IndustrialHulls.js';
import { generateTree, generateMaze, generateBioCluster, generateMonolith, generateFractal, generateLiberator, generateBioBird, generateBioFish, generateBioInsect, generateBioCephalopod } from '/src/t13ne/core/ship/structures/ExoticHulls.js';
import { generateStation } from '/src/t13ne/core/ship/structures/StationHulls.js';
import { generateWings } from '/src/t13ne/core/ship/structures/WingGenerator.js';
import { generateInteriors } from '/src/t13ne/core/ship/InteriorGenerator.js';
import { ShipSynthesizer } from '/src/t13ne/core/ship/ShipSynthesizer.js';

export class ShipGenerator {
    constructor(wiringGenerator, gameEngine) {
        this.wiringGenerator = wiringGenerator;
        this.gameEngine = gameEngine;
        this.synthesizer = new ShipSynthesizer();
    }

    async createRandomShip(seed, config = {}) {
        if (config.useWFC) {
            return this.createRandomShipWFC(seed, config);
        }
        // Use ProcGen for seeded randomness
        const prng = ProcGen.createPRNG(seed);
        const random = () => prng.nextDouble();

        // Declare hullType in outer scope so attachComponent can see it
        let hullType;

        // Generate a consistent theme for the entire ship
        let shipManufacturer = FALLBACK_MANUFACTURERS[Math.floor(random() * FALLBACK_MANUFACTURERS.length)];
        const activeCorps = GalacticHistory.getCorporations()?.filter(c => c.status === 'Active');
        if (activeCorps && activeCorps.length > 0) {
            shipManufacturer = activeCorps[Math.floor(random() * activeCorps.length)].name;
        }
        const shipTech = TECH_SPECS[Math.floor(random() * TECH_SPECS.length)];
        const shipQuality = QUALITIES[Math.floor(random() * QUALITIES.length)];

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
        let radialCount = radialCounts[Math.floor(random() * radialCounts.length)];

        const symmetryType = config.symmetry || (random() > 0.7 ? 'ASYMMETRICAL' : (random() > 0.5 ? 'RADIAL' : 'REFLECTIVE'));

        // Randomize Axis for symmetry
        let radialAxis = 'z';
        if (symmetryType === 'RADIAL') {
            radialAxis = random() > 0.5 ? 'y' : 'z';
        }

        const components = [];
        const explicitWiring = {};

        // Helper to get distance (used in legacy generation)
        const getDist = (p1, p2) => {
            return new THREE.Vector3(...p1).distanceTo(new THREE.Vector3(...p2));
        };

        // --- Helper: Attach Component with Symmetry ---
        const attachComponent = (usage, basePos, baseRot, type, dims, forceSymmetry = null, preventRotationSymmetry = false, overrideName = null, extraProps = {}) => {
            // Add primary component
            let name = overrideName;
            let namePromise = null;

            // Sanitize usage string for display name, removing numbers and underscores
            const displayName = usage.replace(/[0-9]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

            if (!name && this.gameEngine && this.gameEngine.loreGenerator && this.gameEngine.loreGenerator.nameGenerator) {
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
                // Apply consistent theme only for Organic/Bio ships to ensure components group together
                if (selectedStyle === 'ORGANIC' || (hullType && hullType.startsWith('BIO_'))) {
                    name = `${shipManufacturer} ${shipTech} ${displayName} ${shipQuality}`;
                } else {
                    let localManu = FALLBACK_MANUFACTURERS[Math.floor(random() * FALLBACK_MANUFACTURERS.length)];
                    const activeCorps = GalacticHistory.getCorporations()?.filter(c => c.status === 'Active');
                    if (activeCorps && activeCorps.length > 0) {
                        localManu = activeCorps[Math.floor(random() * activeCorps.length)].name;
                    }
                    const localTech = TECH_SPECS[Math.floor(random() * TECH_SPECS.length)];
                    const localQual = QUALITIES[Math.floor(random() * QUALITIES.length)];
                    name = `${localManu} ${localTech} ${displayName} ${localQual}`;
                }
            }

            // Generate a more robust unique ID
            const id = `${usage}_${(random() * 1e9) | 0}`;
            const stats = {
                integrity: 100 * (techLevel * 0.2),
                mass: 50,
                efficiency: 0.8 + (techLevel * 0.05),
                techLevel: techLevel
            };
            
            // Propagate forceSymmetry to stats if present, so GreebleGenerator can respect it
            // This is crucial for components like wings that might have different symmetry than the hull
            if (forceSymmetry) stats.forceSymmetry = forceSymmetry;

            components.push({ usage, name, namePromise, type, dims, pos: basePos, rot: baseRot, id, stats, ...extraProps });

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

                components.push({ usage, name, namePromise, type, dims, pos: symPos, rot: symRot, scale: symScale, id: id + '_sym', stats, ...extraProps });
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
                        components.push({ usage, name, namePromise, type, dims, pos: rPos, rot: rRot, id: rId, stats, ...extraProps });
                        radialIds.push({ id: rId, pos: rPos });
                        // Return the ID so we can link to it if needed
                    }
                }
            }
            return id;
        };

        // --- NEW: Ship Synthesizer Integration ---
        // Determine if we should use the new Synthesizer or Legacy generators
        // We use Legacy if a specific complex hullType is requested that isn't supported by the Synthesizer yet,
        // or if the config explicitly requests legacy mode.
        const legacyTypes = ['HORSESHOE', 'BLOB', 'Y_FORK', 'TREE', 'MAZE', 'BIO_CLUSTER', 'MONOLITH', 'FRACTAL', 'HEAVY_CARRIER', 'LIBERATOR', 'BIO_BIRD', 'BIO_FISH', 'BIO_INSECT', 'BIO_CEPHALOPOD', 'SCAVENGER'];
        
        let useSynthesizer = true;
        if (config.hullType && legacyTypes.includes(config.hullType)) {
            useSynthesizer = false;
        } else if (config.legacy) {
            useSynthesizer = false;
        }

        if (useSynthesizer) {
            // Use the new Socket-based Ship Synthesizer
            const synthConfig = {
                style: selectedStyle,
                tags: [],
                size: size
            };
            
            // Map style to tags for the synthesizer
            if (selectedStyle === 'INDUSTRIAL') synthConfig.tags.push('industrial');
            if (selectedStyle === 'ORGANIC') synthConfig.tags.push('organic');
            if (selectedStyle === 'RACING') synthConfig.tags.push('fast');
            if (selectedStyle === 'BOXY') synthConfig.tags.push('industrial');
            
            const rawComponents = this.synthesizer.generate(seed, synthConfig);

            // Hydrate components with game-specific data (stats, names) that the raw synthesizer doesn't provide
            rawComponents.forEach(comp => {
                // Re-use attachComponent logic to populate stats and ID, but bypass the push to 'components' array since we have the object
                // We call attachComponent to register it properly if we were building iteratively, but here we have the list.
                // So we manually hydrate.
                this._hydrateSynthesizedComponent(comp, techLevel, shipManufacturer, shipTech, shipQuality, random);
                components.push(comp);
            });

            // --- Add Essential Internals for Synthesizer Ships ---
            // Calculate bounds to place internals roughly in the center
            let min = new THREE.Vector3(Infinity, Infinity, Infinity);
            let max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
            if (components.length > 0) {
                components.forEach(c => {
                    const p = new THREE.Vector3(...c.pos);
                    min.min(p);
                    max.max(p);
                });
                const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
                
                // Generator & Shield (Center)
                attachComponent('generator', [center.x, center.y, center.z], [0,0,0], 'box', { width: 1.5, height: 1.0, depth: 1.5 });
                attachComponent('shield', [center.x, center.y, center.z], [Math.PI/2, 0, 0], 'torus', { radius: 0.8, tube: 0.2 }, 'NONE');
            }
        } else {
            // --- LEGACY GENERATION ---
        // 1. Generate Central Fuselage (Spine, Saucer, or Star)
        let spineLength = (size === 'small' ? 3 : (size === 'medium' ? 6 : 10)) * (0.8 + random() * 0.4);

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
            gameEngine: this.gameEngine, // Pass gameEngine for lore generator access
            getSurfacePoint: getSurfacePoint
        };

        let mainHullRadius = 0;
        
        // Determine Hull Layout Strategy
        hullType = 'SPINE';
        const rHull = random();
        let res = {};
        let cockpitPlaced = false;

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
                 if (radialCount >= 3 && radialCount <= 5 && roll > 0.7) hullType = 'LIBERATOR';
                 else hullType = roll > 0.4 ? 'Y_FORK' : 'SPINE';
             }
        } else if (symmetryType === 'ASYMMETRICAL') {
             if (rHull < 0.2) hullType = 'HORSESHOE'; // C-shape / Alien Juggernaut
             else if (rHull < 0.4) hullType = 'BLOB'; // Falcon-ish / Asymmetrical Wedge
             else if (rHull < 0.6) hullType = 'MAZE';
             else if (rHull < 0.75) hullType = 'BIO_CLUSTER';
             else if (rHull < 0.85) hullType = 'SCAVENGER';
             else hullType = 'MONOLITH'; // Borg / Monolith style
        } else if (symmetryType === 'REFLECTIVE') {
             if (rHull < 0.2 && size !== 'small') hullType = 'FREIGHTER'; // Nostromo / Trucker
             else if (rHull < 0.3) hullType = 'CATAMARAN'; // Twin Hull
             else if (rHull < 0.45) hullType = 'HEAVY_CARRIER'; // New Type
             else if (rHull < 0.55) hullType = 'Y_FORK';
             else if (rHull < 0.7) hullType = 'FRACTAL';
             else hullType = 'SPINE';
        }

        // Inject Biological Types if Organic style
        if (selectedStyle === 'ORGANIC' && random() > 0.4) {
            const bioTypes = ['BIO_BIRD', 'BIO_FISH', 'BIO_CEPHALOPOD', 'BIO_INSECT'];
            hullType = bioTypes[Math.floor(random() * bioTypes.length)];
            
            // Force Bilateral (Reflective) Symmetry for animals to avoid 3-headed birds
            if (hullType !== 'BIO_CEPHALOPOD') {
                context.symmetryType = 'REFLECTIVE';
                // Note: components.symmetryType is set at the end of this function
            }
        }
        
        // Force Symmetry for Cephalopods to avoid Rings and Radial artifacts
        if (hullType === 'BIO_CEPHALOPOD') {
            components.symmetryType = 'REFLECTIVE'; // Override for generation logic
        }

        // Force INDUSTRIAL style for BLOB (Falcon-like) to ensure CSG carving works for the engine strip
        // Force INDUSTRIAL for CATAMARAN to prevent organic blending perturbing the saucer
        if (hullType === 'BLOB' || hullType === 'CATAMARAN') {
            selectedStyle = 'INDUSTRIAL';
        }
        
        // Force INDUSTRIAL for SCAVENGER to look like welded parts
        if (hullType === 'SCAVENGER') {
            selectedStyle = 'INDUSTRIAL';
        }

        // Enforce Liberator Constraints
        if (hullType === 'LIBERATOR') {
            // Ensure radial count is within valid range for Liberator (3-5)
            if (radialCount < 3 || radialCount > 5) radialCount = 3;
            context.radialCount = radialCount;
            context.symmetryType = 'RADIAL';
            context.radialAxis = 'z';
        }
        
        if (hullType === 'HEAVY_CARRIER') {
            spineLength = 120; // Force large scale for Carrier to make generic components look small
            context.spineLength = spineLength;
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
        } else if (hullType === 'HEAVY_CARRIER') {
            generateHeavyCarrier(context);
        } else if (hullType === 'LIBERATOR') {
            generateLiberator(context);
        } else if (hullType === 'BIO_BIRD') {
            generateBioBird(context);
        } else if (hullType === 'BIO_FISH') {
            generateBioFish(context);
        } else if (hullType === 'BIO_INSECT') {
            generateBioInsect(context);
        } else if (hullType === 'BIO_CEPHALOPOD') {
            generateBioCephalopod(context);
        } else if (hullType === 'SCAVENGER') {
            generateScavenger(context);
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

        // Nose Cone for SPINE ships (Applied to all symmetries to avoid flat fronts)
        if (hullType === 'SPINE') {
            const lastRad = res.lastSegmentRadius || 1.5;
            const lastZ = res.lastSegmentZ !== undefined ? res.lastSegmentZ : (spineLength / 2);
            const lastSegs = res.lastSegmentSegments || 8;
            const lastRot = res.lastSegmentRotation || [Math.PI / 2, 0, 0];
            
            const noseType = Math.floor(random() * 6); // 0-5

            if (noseType === 0) {
                // Type 1: Cone Nose
                const noseLength = lastRad * (1.5 + random());
                const noseZ = lastZ + noseLength / 2 - 0.2; // Overlap slightly
                attachComponent('nose_cone', [0, 0, noseZ], lastRot, 'cone', 
                    { radius: lastRad, height: noseLength, radialSegments: lastSegs }, 'NONE');
            } else if (noseType === 1) {
                // Type 2: Dome Nose (Ellipsoid)
                const noseLength = lastRad * (1.0 + random());
                attachComponent('nose_dome', [0, 0, lastZ], [0, 0, 0], 'ellipsoid', 
                    { width: lastRad, height: lastRad, length: noseLength }, 'NONE');
            } else if (noseType === 2) {
                // Type 3: Stepped Nose (Cylinder + Cone)
                const stepLen = lastRad * 0.6;
                const tipLen = lastRad * 1.0;
                const r2 = lastRad * 0.7;
                attachComponent('nose_step', [0, 0, lastZ + stepLen/2 - 0.1], lastRot, 'cylinder',
                    { radiusTop: r2, radiusBottom: lastRad, height: stepLen, radialSegments: lastSegs }, 'NONE');
                attachComponent('nose_tip', [0, 0, lastZ + stepLen + tipLen/2 - 0.1], lastRot, 'cone',
                    { radius: r2, height: tipLen, radialSegments: lastSegs }, 'NONE');
            } else if (noseType === 3) {
                // Type 4: Antenna / Sensor Spike
                attachComponent('nose_cap', [0, 0, lastZ + 0.1], lastRot, 'cylinder',
                    { radiusTop: lastRad * 0.9, radiusBottom: lastRad, height: 0.2, radialSegments: lastSegs }, 'NONE');
                const spikeLen = lastRad * 2.5;
                attachComponent('nose_spike', [0, 0, lastZ + spikeLen/2], [Math.PI/2, 0, 0], 'cylinder',
                    { radiusTop: 0.1, radiusBottom: 0.3, height: spikeLen }, 'NONE');
            } else if (noseType === 4) {
                // Type 5: Truncated Cone with Dome
                const baseLen = lastRad * 0.8;
                const tipRad = lastRad * 0.6;
                attachComponent('nose_trunc', [0, 0, lastZ + baseLen/2 - 0.1], lastRot, 'cylinder',
                    { radiusTop: tipRad, radiusBottom: lastRad, height: baseLen, radialSegments: lastSegs }, 'NONE');
                attachComponent('nose_dome_cap', [0, 0, lastZ + baseLen - 0.2], [0, 0, 0], 'sphere', 
                    { radius: tipRad }, 'NONE');
            } else {
                // Type 6: Sloped Front (Sliced Cone)
                const noseLength = lastRad * 2.0;
                // Renamed to fuselage_nose to ensure it persists as a hull component
                attachComponent('fuselage_nose', [0, 0, lastZ + noseLength/2 - 0.2], lastRot, 'cone',
                    { radius: lastRad, height: noseLength, radialSegments: lastSegs }, 'NONE');
                
                const sliceSize = Math.max(lastRad, noseLength) * 3;
                
                // Calculate slice position and rotation to match the nose's roll
                const roll = lastRot[2] || 0;
                const sliceY = lastRad * 0.8;
                
                // Rotate the offset vector (0, sliceY) by the roll angle
                const sX = -sliceY * Math.sin(roll);
                const sY = sliceY * Math.cos(roll);

                // Position carve slightly further forward to ensure base remains
                // The slice rotation should be independent of the cone's roll to get a clean top-down slope.
                attachComponent('carve_nose_slice', [sX, sY, lastZ + noseLength], [Math.PI/4, 0, 0], 'box', 
                    { width: sliceSize, height: sliceSize, depth: sliceSize }, 'NONE');
            }

            // Add Sensors for Spine ships
            const sensorZ = (spineLength / 2) - 3.0;
            let sensorY = 0.8; // Default fallback
            // Raycast to find surface to ensure attachment
            if (getSurfacePoint) {
                try {
                    const hit = getSurfacePoint(components, [0, 20, sensorZ], [0, -1, 0], ['fuselage', 'hull', 'spine']);
                    if (hit) sensorY = hit.y + 0.1; // Embed slightly (Height 0.4, Half 0.2. Center at Surface + 0.1 means 0.1 embedded)
                } catch (e) { /* Ignore raycast error */ }
            }
            const sensorId = attachComponent('sensor_array', [0, sensorY, sensorZ], [0, 0, 0], 'box', { width: 0.6, height: 0.4, depth: 0.8 }, 'NONE');
            
            // Wire to bridge
            const bridge = components.find(c => c.usage.includes('bridge') || c.usage.includes('cockpit'));
            if (bridge) {
                this.wiringGenerator.addConnection(explicitWiring, sensorId, bridge.id, 'data', 3.0);
            }
        }

        // Generate Wings (Legacy procedural wings)
        generateWings(context);

        // Engines
        const engineCount = size === 'small' ? 1 : (size === 'medium' ? 2 : 4);
        if (hullType === 'DISC') {
            // Saucer engines on rim
            const engR = mainHullRadius * 0.65;
            const engHeight = 2.0;
            
            // Distribute engines within the arc
            const angleOffset = random() * Math.PI * 2;
            const ex = Math.cos(angleOffset) * engR;
            const ez = Math.sin(angleOffset) * engR;

            // Embed engines deeply into the saucer, centered vertically (y=0).
            // This allows them to perturb the upper surface and not stick out the bottom excessively.
            // Align vertically as requested (Cylinder default Y is up).
            attachComponent('engine', [ex, 0, ez], [0, 0, 0], 'cylinder', 
                { radiusTop: 0.6, radiusBottom: 0.8, height: engHeight }, 'RADIAL');
        } else if (hullType === 'FREIGHTER') {
            // Freighter engines are attached to the engine block at the rear
            const trussLen = spineLength * 1.5;
            const engineZ = -trussLen/2 - 4.0 + 0.5; // Behind the engine block (which is at -trussLen/2 - 2.5) + Overlap
            
            // Main Engine
            attachComponent('engine_main', [0, 0, engineZ], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 1.0, radiusBottom: 1.5, height: 3.0 });
            // Side Engines
            attachComponent('engine_side', [2.5, 0, engineZ + 0.5], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 0.6, radiusBottom: 0.9, height: 2.5 }, 'REFLECTIVE');
        } else if (hullType === 'Y_FORK') {
             // Engines on prongs
             const prongLen = spineLength * 0.8;
             const embedDepth = 1.0; // Embed engine into prong to ensure connection
             const spreadAngle = Math.PI / 6;
             
             const ex = Math.sin(spreadAngle) * (prongLen - embedDepth);
             const ez = -Math.cos(spreadAngle) * (prongLen - embedDepth);
             
             const symMode = symmetryType === 'ASYMMETRICAL' ? 'REFLECTIVE' : symmetryType;
             
             // Engines point directly back (Z-axis), embedded in prong tips
             attachComponent('engine', [ex, 0, ez], [Math.PI/2, 0, 0], 'cylinder', 
                {radiusTop: 0.8, radiusBottom: 1.1, height: 2.0}, symMode);
        } else if (hullType === 'MONOLITH') {
            // Monolith Engines: Place symmetrically on the rear face
            const mono = components.find(c => c.usage === 'fuselage_monolith');
            
            if (mono) {
                let rearZ = 0;
                let halfWidth = 0;
                let engineCount = 1;

                // Helper to get scale safely
                const getScale = (idx) => {
                    if (!mono.scale) return 1;
                    if (Array.isArray(mono.scale)) return mono.scale[idx];
                    if (mono.scale.x !== undefined) return [mono.scale.x, mono.scale.y, mono.scale.z][idx];
                    return 1;
                };
                const sX = getScale(0);
                const sY = getScale(1);
                const sZ = getScale(2);

                if (mono.type === 'prism' || mono.type === 'cylinder') {
                    // Height is along Y in local, Z in world (due to 90deg X rot)
                    const h = (mono.dims.height || 1) * sY;
                    const r = (mono.dims.radius || mono.dims.radiusTop || 1) * sX;
                    
                    rearZ = -h / 2;
                    halfWidth = r;
                    
                    // For prisms, check if we have enough space for 2 engines
                    if (halfWidth > 3.0) engineCount = 2;
                    
                } else if (mono.type === 'box') {
                    const d = (mono.dims.depth || 1) * sZ;
                    const w = (mono.dims.width || 1) * sX;
                    
                    rearZ = -d / 2;
                    halfWidth = w / 2;
                    
                    if (halfWidth > 3.0) engineCount = 2;
                } else {
                    // Tetrahedron or others - stick to single center engine
                    const r = (mono.dims.radius || 1) * sX;
                    rearZ = -r * 0.5; 
                }
                
                // Apply Monolith position offset
                const pos = mono.pos;
                const worldRearZ = pos[2] + rearZ;
                const worldX = pos[0];
                const worldY = pos[1];

                if (engineCount === 2) {
                    const offset = halfWidth * 0.5;
                    // Embed 90% (Height 3.0 -> 2.7 inside, 0.3 outside).
                    // Rear face at worldRearZ - 0.3. Center at worldRearZ - 0.3 + 1.5 = worldRearZ + 1.2
                    attachComponent('engine_L', [worldX - offset, worldY, worldRearZ + 1.2], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: 0.8, radiusBottom: 1.2, height: 3.0 });
                    attachComponent('engine_R', [worldX + offset, worldY, worldRearZ + 1.2], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: 0.8, radiusBottom: 1.2, height: 3.0 });
                } else {
                    attachComponent('engine_main', [worldX, worldY, worldRearZ + 1.2], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: 0.8, radiusBottom: 1.2, height: 3.0 });
                }
            } else {
                 // Fallback
                 attachComponent('engine', [0, 0, -spineLength/2 - 2], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: 0.8, radiusBottom: 1.2, height: 3.0 });
            }
        } else if (hullType === 'BIO_CEPHALOPOD') {
             // Engines on the fins (wings) of the mantle (Mantle is now at front +Z)
             const headLen = spineLength * 0.5;
             const finZ = headLen * 0.5; // Match fin position
             const wingX = headLen * 0.25 + (headLen * 0.6) * 0.6; // Approx mid-wing
             
             // Point backward (-Z) for thrust
             attachComponent('engine', [wingX, 0, finZ], [Math.PI/2, 0, 0], 'cone', 
                { radius: 0.4, height: 1.2 }, 'REFLECTIVE'); // Cone points up Y, rotated X 90 -> Z. Wait, we want exhaust -Z.
                // If cone points +Y (default), Rot X 90 points it +Z. Rot X -90 points it -Z.
                // Actually, standard engine orientation in this file seems to be [Math.PI/2, 0, 0] for rear-facing?
                // Let's check: Cylinder height is Y. Rot X 90 aligns Y to Z.
                // Cone: Point is at Y+. Base at Y-.
                // If we want point to be back (exhaust shape?), or point to be front (aerodynamic)?
                // Usually cones are aerodynamic, so point forward.
                // If [Math.PI/2, 0, 0], Top(Point) is at +Z. Base is at -Z.
                // So this points the cone forward. Correct for flight.
        } else if (hullType === 'BIO_FISH') {
             // Vertical paired engines for Fish
             const engineHeight = 2.0;
             const engineZ = -spineLength / 2 - engineHeight / 2 + 0.5;
             const engineY = spineLength * 0.15; // Offset vertically
             
             // Top Engine
             attachComponent('engine_top', [0, engineY, engineZ], [Math.PI / 2, 0, 0], 'cone', 
                { radius: 0.5, height: engineHeight }, 'NONE');
             // Bottom Engine
             attachComponent('engine_bottom', [0, -engineY, engineZ], [Math.PI / 2, 0, 0], 'cone', 
                { radius: 0.5, height: engineHeight }, 'NONE');
        } else if (hullType === 'CATAMARAN' || hullType === 'BLOB') {
                // Skip generic engines for Catamaran as it has Nacelles, and Blob has integrated engine strip
        } else if (hullType === 'LIBERATOR') {
                // Liberator has specific engines in generateLiberator, skip default
        } else if (hullType === 'STATION_RING' || hullType === 'STATION_WHEEL') {
                // Engines on the rim for rings
                const r = spineLength * 1.5;
                
                // Distribute engines around the ring using radial symmetry
                const angleOffset = random() * Math.PI * 2;
                const ex = Math.cos(angleOffset) * r;
                const ez = Math.sin(angleOffset) * r;

                // Place at radius r (center of tube)
            let pos;
                if (radialAxis === 'z') {
                     pos = [ex, ez, 0]; // XY plane
                } else {
                     pos = [ex, 0, ez]; // XZ plane
                }

            // Point engines aft (along Z axis) for propulsion, rather than outward
            const rot = [Math.PI/2, 0, 0]; 

            attachComponent('engine', pos, rot, 'cylinder', { radiusTop: 0.6, radiusBottom: 1.0, height: 2.5 }, 'RADIAL', true);
            
            // Add Main Engine on Central Spine
            const spineLen = r * 1.2;
            const engineZ = -spineLen / 2 - 1.5; // Behind spine
            
            attachComponent('engine_main', [0, 0, engineZ], [Math.PI/2, 0, 0], 'cylinder', 
                { radiusTop: 1.5, radiusBottom: 2.0, height: 3.0 }, 'NONE');

        } else if (symmetryType === 'REFLECTIVE') {
                // Add Sensors/Scanners
                const sensorHeight = 1.0;
                // FIX: Ensure sensorZ is within the hull bounds. 
                // Previously -spineLength/2 + 4.0 could be > spineLength/2 for small ships, causing floating sensors at the front.
                const sensorZ = Math.min(-spineLength / 2 + 4.0, spineLength / 2 - 1.0); 
                
                let sensorX = 2.0;
                if (getSurfacePoint) {
                     try {
                         const rayOrigin = [20, 0, sensorZ];
                         const rayDir = [-1, 0, 0];
                         const hit = getSurfacePoint(components, rayOrigin, rayDir, ['fuselage', 'hull', 'spine']);
                         if (hit) {
                             sensorX = hit.x; // Embed half-way to ensure connection
                         }
                     } catch (e) { /* Ignore */ }
                }
                
                const sensorId = attachComponent('sensor_array', [sensorX, 0.5, sensorZ], [0, 0, 0], 'box', { width: 0.5, height: 0.5, depth: 1.0 });
                
                // Add Antenna Dish to make it look like a sensor
                // Place on front face and rotate to point forward
                attachComponent('sensor_dish', [sensorX, 0.5, sensorZ + 0.6], [Math.PI/2, 0, 0], 'cone', { radius: 0.2, height: 0.4 }, 'REFLECTIVE');
                
                // Wire to bridge if possible (Power and Data)
                const bridge = components.find(c => c.usage.includes('bridge') || c.usage.includes('cockpit')) || components.find(c => c.usage.includes('fuselage'));
                if (bridge) {
                    this.wiringGenerator.addConnection(explicitWiring, sensorId, bridge.id, 'data', 5.0);
                    this.wiringGenerator.addConnection(explicitWiring, sensorId, bridge.id, 'power', 5.0);
                    
                    const sensorSymId = sensorId + '_sym';
                    if (components.find(c => c.id === sensorSymId)) {
                            this.wiringGenerator.addConnection(explicitWiring, sensorSymId, bridge.id, 'data', 5.0);
                            this.wiringGenerator.addConnection(explicitWiring, sensorSymId, bridge.id, 'power', 5.0);
                    }
                }

                const engineHeight = 2.0;
                // Move engine forward to be alongside the rear of the hull, not behind it
                const engineZ = -spineLength / 2 + engineHeight * 0.6; 
                
                // Fix for floating engines: Calculate X based on hull width at this Z
                let engineX = 1.5; // Default fallback
                if (getSurfacePoint) {
                    try {
                        // Raycast from outside (+X) towards center at the engine's Z
                        const rayOrigin = [20, 0, engineZ];
                        const rayDir = [-1, 0, 0];
                        const hit = getSurfacePoint(components, rayOrigin, rayDir, ['fuselage', 'hull', 'spine']);
                        if (hit) {
                            engineX = hit.x + 0.3; // Attach to surface + radius (approx 0.5) - overlap (0.2)
                        }
                    } catch (e) { /* Ignore */ }
                }
                attachComponent('engine', [engineX, 0, engineZ], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 0.4, radiusBottom: 0.6, height: engineHeight });
            } else if (hullType === 'STAR') {
                // Engines at ends of arms
                const armLen = spineLength;
                // Engines point down (Vertical)
                // Offset Y by -0.5 to ensure the wide bottom is below the hull and the top is embedded
                attachComponent('engine', [armLen, -0.5, 0], [0, 0, 0], 'cylinder', { radiusTop: 0.5, radiusBottom: 0.8, height: 2.0 });

                // Add Sensor Array on Hub (Bottom)
                const sensorId = attachComponent('sensor_array', [0, -1.5, 0], [Math.PI, 0, 0], 'cone', { radius: 0.5, height: 1.0 }, 'NONE');
                
                // Wire to bridge/hub
                const bridge = components.find(c => c.usage.includes('bridge') || c.usage.includes('cockpit') || c.usage.includes('hub'));
                if (bridge) {
                    this.wiringGenerator.addConnection(explicitWiring, sensorId, bridge.id, 'data', 2.0);
                }
            } else {
                // Default case, primarily for SPINE
                // Central engine for SPINE or other fallback types
                const engineHeight = 2.5;
                let engineZ = -spineLength / 2 - engineHeight / 2 + 1.0; // Default for SPINE
                let engineX = 0;
                let engineY = 0;

                // For non-SPINE hulls (MAZE, FRACTAL, etc), find the actual rear-most point
                if (hullType !== 'SPINE') {
                    let minZ = 0;
                    let rearComp = null;
                    components.forEach(c => {
                        if (c.usage.includes('fuselage') || c.usage.includes('hull') || c.usage.includes('maze') || c.usage.includes('fractal')) {
                            const z = c.pos[2];
                            const d = (c.dims.depth || c.dims.length || c.dims.radius || 1);
                            // For radius based shapes, extent is z - radius. For box/cyl, z - height/2 or depth/2
                            const rear = z - (c.dims.radius ? c.dims.radius : d/2);
                            if (rear < minZ) {
                                minZ = rear;
                                rearComp = c;
                            }
                        }
                    });
                    // Attach to the rear-most point found, with overlap
                    engineZ = minZ - engineHeight / 2 + 0.5;
                    
                    // For Maze/Fractal, align engine with the rear-most component's X/Y, not 0,0
                    if (rearComp) {
                        engineX = rearComp.pos[0];
                        engineY = rearComp.pos[1];
                    }
                } else {
                    // For SPINE, ensure we attach to the actual last segment
                    const lastZ = res.lastSegmentZ !== undefined ? res.lastSegmentZ : -(spineLength / 2);
                    const lastRad = res.lastSegmentRadius || 1.0;
                    // Engine Z: Last Segment Center Z - Half Height - Half Engine Height + Overlap
                    // Actually, lastSegmentZ is the center of the last segment.
                    // Back face is lastZ - (segmentHeight/2).
                    // We don't have segmentHeight easily here, but we can estimate or use a safe overlap.
                    // Let's just embed it deeper.
                    engineZ = lastZ - (spineLength / (res.lastSegmentSegments || 8)) / 2 - engineHeight / 2 + 1.5;
                }
                
                attachComponent('engine', [engineX, engineY, engineZ], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 0.6, radiusBottom: 0.9, height: engineHeight });
            }


        // Update context with determined hullType for sub-generators
        context.hullType = hullType;

        // Cockpit

        // Check if we already added a bridge/cockpit in the hull generation phase (e.g. Freighter)
        if (components.some(c => (c.usage && (c.usage.includes('bridge') || c.usage.includes('cockpit'))))) {
            cockpitPlaced = true;
        }

        // 1. Check for "Tower Bridge" (Star Destroyer style) - Restricted to larger ships
        if (spineLength > 5 && (hullType === 'SPINE' || hullType === 'Y_FORK') && random() > 0.4) {
            cockpitPlaced = true;
            const towerH = 1.5 + random();
            const towerZ = -(spineLength / 2) + 2.0;
            const towerWidth = 4.0 + random() * 2.0; // Wide T-bar

            // Tower Neck (Stem)
            attachComponent('bridge_neck', [0, towerH / 2, towerZ], [0, 0, 0], 'box', 
                { width: 1.0, height: towerH, depth: 1.5 }, 'NONE');

            // Tower Crossbar (Top) - The "T"
            attachComponent('bridge_crossbar', [0, towerH + 0.4, towerZ], [0, 0, 0], 'box', 
                { width: towerWidth, height: 0.8, depth: 1.2 }, 'NONE');

            // Supports (Angled Struts)
            const strutLen = Math.sqrt((towerWidth/2)**2 + towerH**2) * 0.95; // Slightly shorter to embed
            const angle = Math.atan2(towerWidth/2, towerH);
            
            // Left Support
            attachComponent('bridge_support_L', [-towerWidth/4, towerH/2, towerZ], [0, 0, angle], 'cylinder', 
                { radiusTop: 0.2, radiusBottom: 0.3, height: strutLen }, 'NONE');
            
            // Right Support
            attachComponent('bridge_support_R', [towerWidth/4, towerH/2, towerZ], [0, 0, -angle], 'cylinder', 
                { radiusTop: 0.2, radiusBottom: 0.3, height: strutLen }, 'NONE');
        }

        // 2. Fallback / Other Styles
        if (!cockpitPlaced) {
            if (hullType === 'MONOLITH') {
                // Monolith Cockpit: Ensure it's outside the hull
                // Use raycasting from front (+Z) towards center
                let hit = null;
                if (getSurfacePoint) {
                    try {
                        hit = getSurfacePoint(components, [0, 0, 50], [0, 0, -1], ['fuselage', 'monolith']);
                    } catch (e) { /* Ignore */ }
                }
                if (hit) {
                    // Embed 90% (Depth 2.0 -> 1.8 inside, 0.2 outside).
                    // Front face at hit.z + 0.2. Center at hit.z + 0.2 - 1.0 = hit.z - 0.8.
                    attachComponent('cockpit', [hit.x, hit.y, hit.z - 0.8], [0, 0, 0], 'box', { width: 2.5, height: 1.5, depth: 2.0 });
                } else {
                    // Fallback
                    attachComponent('cockpit', [0, 0, hullRadius - 0.8], [0, 0, 0], 'box', { width: 2.5, height: 1.5, depth: 2.0 });
                }
            } else if (hullType === 'HORSESHOE') {
                 // Horseshoe Cockpit: Place on the arc tip to avoid floating in the center void
                 const r = spineLength * 0.8; // Radius used in generation
                 const angle = 1.0; // Near tip (approx 57 degrees)
                 const cx = Math.cos(angle) * r;
                 const cz = Math.sin(angle) * r;
                 // Reduced size to ensure it fits within the arc tube (min diam ~2.5)
                 // Align rotation with the curve tangent (-angle) instead of radial (angle + PI/2)
                 attachComponent('cockpit', [cx, 0, cz], [0, -angle, 0], 'box', { width: 1.5, height: 1.2, depth: 2.0 });
            } else if (symmetryType === 'ASYMMETRICAL' || hullType === 'BLOB' || hullType === 'MAZE') {
                // Use the unified side cockpit generator
                const side = (hullType === 'BLOB') ? 'right' : 'random';
                const parentUsage = [
                    'fuselage', 'hull', 'spine', 'monolith', 'maze', 
                    'ring', 'rim', 'torus', 'bio', 'node', 'segment', 'fractal'
                ];
                
                // Estimate parent radius and height from the generic hullRadius
                const parentRadius = hullRadius;
                const parentHeight = hullRadius * 0.4;
                
                generateSideCockpit(context, parentUsage, side, parentRadius, parentHeight);
                cockpitPlaced = true;
            } else if (hullType === 'LIBERATOR') {
                // Liberator has integrated bridge in hub, do not add generic cockpit
            } else {
                if (hullType === 'STAR') {
                    // Cockpit centrally placed on hub
                    attachComponent('cockpit', [0, 1.2, 0], [0, 0, 0], 'ellipsoid', { width: 1.5, height: 1.0, length: 1.5 }, 'NONE');
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
                    
                    // Raycast to find top surface for cockpit to avoid burying it
                    let cockpitY = 0.6;
                    if (getSurfacePoint) {
                        try {
                            const rayOrigin = [0, 50, cockpitZ];
                            const rayDir = [0, -1, 0];
                            const hit = getSurfacePoint(components, rayOrigin, rayDir, ['fuselage', 'hull', 'spine']);
                            if (hit) {
                                // Embed deeply (approx 75% of height 0.8)
                                // Center at hit.y - 0.2. Top at hit.y + 0.2. Bottom at hit.y - 0.6.
                                cockpitY = hit.y - 0.2;
                            }
                        } catch (e) { /* Ignore */ }
                    }
                    attachComponent('cockpit', [0, cockpitY, cockpitZ], [0, 0, 0], 'ellipsoid', { width: 1.0, height: 0.8, length: 1.5 });
                }
            }
        }

        // Explicit Wiring for Catamaran / Enterprise Style to prevent jumping
        if (hullType === 'CATAMARAN') {
            const findId = (prefix) => components.find(c => c.usage === prefix)?.id;
            const saucerId = findId('fuselage_saucer_mid') || findId('bridge');
            const neckId = findId('fuselage_neck');
            const secId = findId('fuselage_secondary');
            
            if (saucerId && neckId) this.wiringGenerator.addConnection(explicitWiring, neckId, saucerId, 'structural', 5.0);
            if (neckId && secId) this.wiringGenerator.addConnection(explicitWiring, secId, neckId, 'structural', 5.0);

            // Wire Pylons to Secondary Hull
            const pylons = components.filter(c => c.usage === 'pylon');
            pylons.forEach(p => {
                if (secId) this.wiringGenerator.addConnection(explicitWiring, p.id, secId, 'structural', 3.0);
                // Wire Nacelle to Pylon
                // Find nacelle with closest position
                const nacelle = components.find(n => n.usage === 'warp_nacelle' && getDist(n.pos, p.pos) < 10.0 && Math.sign(n.pos[0]) === Math.sign(p.pos[0]));
                if (nacelle) this.wiringGenerator.addConnection(explicitWiring, nacelle.id, p.id, 'power', 3.0);
            });
        }

        // Essential Systems (Power, Shield, Vortex) - Distributed Placement
        // Scale internal components to fit inside the hull
        const internalScale = Math.min(1.0, hullRadius * 0.25);

        // Generator
        let genPos = [0, 0, 0];
        let genRot = [0, 0, 0];
        
        if (hullType === 'DISC' || hullType === 'BLOB') {
            const angle = random() * Math.PI * 2;
            const r = (hullType === 'BLOB' ? hullRadius : mainHullRadius) * 0.3;
            genPos = [Math.cos(angle) * r, 0, Math.sin(angle) * r];
            genRot = [0, -angle, 0];
        } else if (hullType === 'STAR') {
            genPos = [spineLength * 0.3, 0, 0];
        } else if (hullType === 'STATION_RING') {
            // Place on rim, random angle
            const r = spineLength * 1.5;
            const angle = random() * Math.PI * 2;
            if (radialAxis === 'z') {
                genPos = [Math.cos(angle) * r, Math.sin(angle) * r, 0];
                genRot = [0, 0, angle];
            } else {
                genPos = [Math.cos(angle) * r, 0, Math.sin(angle) * r];
                genRot = [0, -angle, 0];
            }
        } else if (hullType === 'STATION_WHEEL') {
            // Place on Hub
            genPos = [0, -1.5, 0];
        } else if (hullType === 'HORSESHOE') {
             const r = spineLength * 0.8;
             genPos = [r, -1.0, 0]; // Bottom of arc, back center
        } else {
            genPos = [0, -0.5, -(spineLength / 2) + 1.5];
        }
        
        // Use organic shape for Bio ships to avoid "cargo cube" look
        let genShape = 'box';
        let genDims = { width: 1.5 * internalScale, height: 1.0 * internalScale, depth: 1.5 * internalScale };
        if (hullType.startsWith('BIO_')) {
            genShape = 'dodecahedron';
            genDims = { radius: 0.8 * internalScale };
        }
        attachComponent('generator', genPos, genRot, genShape, genDims);

        // Shield Generator
        let shieldPos;
        let shieldDims = { radius: 0.8 * internalScale, tube: 0.2 * internalScale };
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
             // Ensure intersection by making it large and centered on the arc tube
             const r = spineLength * 0.8;
             shieldPos = [r, 0, 0]; // Centered on the arc tube
             shieldDims = { radius: 1.5, tube: 0.5 }; // Radius 1.5 intersects hull tube (approx rad 1.5)
        } else {
             // Place inside the hull
             shieldPos = hullType === 'DISC' ? [0, 0, 0] : [0, 0, 0];
        }
        
        attachComponent('shield', shieldPos, shieldRot, 'torus', shieldDims, 'NONE'); // Single shield

        // Calculate Shield Efficiency based on size and tech level
        const shieldComp = components[components.length - 1];
        const shieldSize = shieldDims.radius;
        shieldComp.stats.efficiency = (0.8 + (techLevel * 0.05)) * (1 + shieldSize * 0.1);
        shieldComp.stats.generatorType = "Harmonic Torus";

        // Vortex Generator
        let vortexPos = [0, 0, 0];
        let vortexRot = [0, 0, 0];
        
        if (hullType === 'STATION_RING') {
             const r = spineLength * 1.5;
             const angle = random() * Math.PI * 2;
             if (radialAxis === 'z') {
                 vortexPos = [Math.cos(angle) * r, Math.sin(angle) * r, 0];
             } else {
                 vortexPos = [Math.cos(angle) * r, 0, Math.sin(angle) * r];
             }
        } else if (hullType === 'HORSESHOE') {
             const r = spineLength * 0.8;
             vortexPos = [r - 1.5, 0, 0]; // Inner curve
        } else if (hullType === 'DISC') {
             const angle = random() * Math.PI * 2;
             const r = mainHullRadius * 0.6;
             vortexPos = [Math.cos(angle) * r, -0.5, Math.sin(angle) * r];
        } else {
             // Default placement: Front-ish, bottom
             // Use Raycast to find bottom surface to ensure attachment
             const searchZ = spineLength / 2 - 2.0; // Slightly back from tip
             let placeY = -0.5; // Fallback
             
             if (getSurfacePoint) {
                 try {
                     // Cast from below up
                     const hit = getSurfacePoint(components, [0, -20, searchZ], [0, 1, 0], ['fuselage', 'hull', 'spine']);
                     if (hit) {
                         // Embed by radius * 0.5
                         const r = 0.6 * internalScale;
                         placeY = hit.y - (r * 0.5);
                     } else {
                         placeY = 0; // Center it if no hull found (e.g. gap)
                     }
                 } catch (e) { /* Ignore */ }
             }
             vortexPos = [0, placeY, searchZ];
        }
        const vortexId = attachComponent('vortex', vortexPos, vortexRot, 'dodecahedron', { radius: 0.6 * internalScale });
        
        // Wire Vortex to Generator or Hull
        const powerSource = components.find(c => c.usage.includes('generator') || c.usage.includes('reactor')) || components.find(c => c.usage.includes('fuselage'));
        if (powerSource) {
            this.wiringGenerator.addConnection(explicitWiring, vortexId, powerSource.id, 'plasma_conduit', 5.0);
        }

        // Add Torus Ring for Radial Ships (Moved to end to check for wing connections)
        if (symmetryType === 'RADIAL' && random() > 0.7 && !hullType.startsWith('BIO_') && hullType !== 'BIO_CEPHALOPOD') { // Reduced probability, exclude BIO
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
                        sRot = [0, -angle, -Math.PI/2]; // Point outward
                    } else {
                        sPos = [Math.cos(angle) * spokeLen/2, Math.sin(angle) * spokeLen/2, 0];
                        sRot = [0, 0, angle - Math.PI/2]; // Point outward
                    }
                    attachComponent(`ring_spoke_${i}`, sPos, sRot, 'cylinder', { radiusTop: tubeRadius * 0.5, radiusBottom: tubeRadius * 0.5, height: spokeLen }, 'NONE');
                }
            }
        }

        } // End Legacy Block

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

        // Recenter ship on CoG so it rotates around its center of mass
        if (totalMass > 0) {
            components.forEach(c => {
                c.pos[0] -= cog.x;
                c.pos[1] -= cog.y;
                c.pos[2] -= cog.z;
            });
            // Reset CoG to 0,0,0 for subsequent calculations (like Shield placement)
            cog.set(0, 0, 0);
        }

        // --- 2b.1 Move Shield Generator to CoG (or near it) ---
        // We want it balanced, but maybe not exactly at 0,0,0 if the CoG is there.
        // Actually, centering it on CoG is good for a shield.
        // Exception: Station Rings/Wheels should keep shield at 0,0,0 (Geometric Center) to fit the ring
        const shieldComponent = components.find(c => c.usage === 'shield');
        if (shieldComponent && hullType !== 'STATION_RING' && hullType !== 'STATION_WHEEL') {
            if (hullType === 'CATAMARAN') {
                // Place in Neck
                const neck = components.find(c => c.usage === 'fuselage_neck');
                if (neck) {
                    shieldComponent.pos = [...neck.pos];
                } else {
                    shieldComponent.pos = [0, 0, 0];
                }
            } else {
                shieldComponent.pos = [cog.x, cog.y, cog.z];
            }
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
        this.wiringGenerator.enforceWiringSymmetry(wiringGraph, components);

        // Store the graph for harmonics calculation later
        // Note: In the refactored version, we return this data instead of setting it on 'this'
        // The caller (ShipFactory) will handle storing it.

        // Store symmetry info for greebling
        components.symmetryType = symmetryType;
        components.radialAxis = radialAxis;
        components.radialCount = radialCount;
        components.hullType = hullType;
        components.seed = seed;

        // Store style config for generation
        components.styleConfig = {
            method: selectedStyle,
            plating: random() > 0.5,
            blendStrength: selectedStyle === 'ORGANIC' ? 0.8 : 0.1, // Reduced from 1.5 to prevent bloating
            padding: padding
        };

        // Generate Livery (Seeded)
        // Use HSL to ensure we don't get black ships (military/stealth)
        // Bias towards industrial colors (low saturation, medium-high lightness)
        const hue = random();
        const saturation = 0.4 + random() * 0.6; // More vibrant: 40% to 100% saturation
        const lightness = 0.5 + random() * 0.3; // 50% to 80% lightness (avoid pure white/black)
        
        let baseColor = new THREE.Color().setHSL(hue, saturation, lightness);

        if (hullType === 'LIBERATOR') {
            baseColor = new THREE.Color(0xdddddd); // Bone White / Light Grey
            selectedStyle = 'INDUSTRIAL';
        }
        
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

        // --- Generate Ship Name ---
        // Influence the name generation by the component names as requested
        let nameSeedAccumulator = typeof seed === 'number' ? seed : 0;
        components.forEach(c => {
            if (c.name) {
                for (let i = 0; i < c.name.length; i++) {
                    nameSeedAccumulator = (nameSeedAccumulator + c.name.charCodeAt(i)) | 0;
                }
            }
        });
        const namePrng = ProcGen.createPRNG(nameSeedAccumulator);
        const nameRandom = () => namePrng.nextDouble();
        const prefix = SHIP_PREFIXES[Math.floor(nameRandom() * SHIP_PREFIXES.length)];
        const adjective = SHIP_ADJECTIVES[Math.floor(nameRandom() * SHIP_ADJECTIVES.length)];
        const noun = SHIP_NOUNS[Math.floor(nameRandom() * SHIP_NOUNS.length)];
        components.shipName = `${prefix} ${adjective} ${noun}`;

        // Generate Interiors (Corridors and Rooms for carving)
        
        // NOTE: generateInteriors and enforceWiringSymmetry no longer use 'this.'
        // They operate on the passed 'components' variable, which has accumulated
        // the various attached components.
        // If something relies on a 'this' instance variable from ShipGenerator,
        // it must be explicitly passed in the 'context' object.

        components.interior = generateInteriors(components);

        // Return the components array, but also attach the wiring graph to it so it can be retrieved
        components.wiringGraph = wiringGraph;

        return components;
    }

    /**
     * Hydrates a raw component from the Synthesizer with game-specific stats and names.
     * @private
     */
    _hydrateSynthesizedComponent(comp, techLevel, manufacturer, tech, quality, random) {
        // Generate ID if missing (Synthesizer usually provides one, but ensure uniqueness)
        if (!comp.id) comp.id = `${comp.usage}_${(random() * 1e9) | 0}`;
        
        // Generate Name
        const displayName = (comp.usage || 'part').replace(/[0-9]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (!comp.name && this.gameEngine && this.gameEngine.loreGenerator && this.gameEngine.loreGenerator.nameGenerator) {
            const ng = this.gameEngine.loreGenerator.nameGenerator;
            const context = { type: 'TECHNOLOGY', usage: displayName };
            if (typeof ng.generatePlaceholder === 'function') {
                comp.name = ng.generatePlaceholder(context, random());
                comp.namePromise = ng.generate(context, random());
            } else {
                comp.name = ng.generate(context, random());
            }
        }
        
        if (!comp.name) {
            comp.name = `${manufacturer} ${tech} ${displayName} ${quality}`;
        }

        // Generate Stats
        comp.stats = comp.stats || {};
        comp.stats.integrity = 100 * (techLevel * 0.2);
        comp.stats.mass = 50;
        comp.stats.techLevel = techLevel;
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
