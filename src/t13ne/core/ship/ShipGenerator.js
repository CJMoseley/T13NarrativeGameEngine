import * as THREE from 'three';
import { mulberry32, TECH_SPECS, QUALITIES, FALLBACK_MANUFACTURERS } from './ShipUtils.js';
import { GalacticHistory } from '@/src/t13ne/procgen/galaxy/GalacticHistory.js';

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
        const styleTypes = ['ORGANIC', 'INDUSTRIAL', 'SKELETON', 'BOXY'];
        let selectedStyle = config.style || styleTypes[Math.floor(random() * styleTypes.length)];
        const padding = 0.05 + random() * 0.15; // Procedural padding variation

        // Determine Harmonic Number (Segments for prisms)
        const harmonicOptions = [3, 4, 5, 6, 8];
        const harmonicSegments = harmonicOptions[Math.floor(random() * harmonicOptions.length)];

        // Determine Radial Count (3, 4, 5, 6, 8) - Ensure 3x or more for radial
        const radialCounts = [3, 4, 5, 6, 8];
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
                                basePos[0] * cos - basePos[2] * sin,
                                basePos[1],
                                basePos[0] * sin + basePos[2] * cos
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
        let mainHullRadius = 0;
        
        // Determine Hull Layout Strategy
        let hullType = 'SPINE';
        const rHull = random();

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
             else hullType = random() > 0.6 ? 'Y_FORK' : 'SPINE'; 
        } else if (symmetryType === 'ASYMMETRICAL') {
             if (rHull < 0.2) hullType = 'HORSESHOE'; // C-shape / Alien Juggernaut
             else if (rHull < 0.4) hullType = 'BLOB'; // Falcon-ish / Asymmetrical Wedge
             else if (rHull < 0.6) hullType = 'MAZE';
             else if (rHull < 0.75) hullType = 'BIO_CLUSTER';
             else if (rHull < 0.9) hullType = 'MONOLITH'; // Borg / Monolith style
             else hullType = 'TREE'; // Asymmetrical tree
        } else if (symmetryType === 'REFLECTIVE') {
             if (rHull < 0.2 && size !== 'small') hullType = 'FREIGHTER'; // Nostromo / Trucker
             else if (rHull < 0.35) hullType = 'CATAMARAN'; // Twin Hull
             else if (rHull < 0.55) hullType = 'Y_FORK';
             else if (rHull < 0.7) hullType = 'FRACTAL';
             else if (rHull < 0.85) hullType = 'TREE'; // Symmetrical Tree
             else hullType = 'SPINE';
        }

        // Inject Biological Types if Organic style
        if (selectedStyle === 'ORGANIC' && random() > 0.4) {
            const bioTypes = ['BIO_BIRD', 'BIO_FISH', 'BIO_CEPHALOPOD', 'BIO_INSECT'];
            hullType = bioTypes[Math.floor(random() * bioTypes.length)];
        }

        if (hullType === 'DISC') {
            // Saucer Body: Single large flat cylinder/prism
            mainHullRadius = (size === 'small' ? 4 : (size === 'medium' ? 8 : 12)) * (0.8 + random() * 0.4);
            const height = (size === 'small' ? 1 : (size === 'medium' ? 2 : 3));

            attachComponent('fuselage', [0, 0, 0], [0, 0, 0], 'cylinder',
                { radiusTop: mainHullRadius * 0.9, radiusBottom: mainHullRadius * 0.5, height: height, radialSegments: 16 },
                'NONE' // No symmetry for the central disc itself
            );
        } else if (hullType === 'FREIGHTER') {
            // Freighters should look boxy/industrial, not skeletal
            selectedStyle = 'BOXY';
            
            // Freighter: Long central spine with cargo pods attached
            const trussLen = spineLength * 1.5;
            // Central Truss
            attachComponent('fuselage_spine', [0, 0, 0], [Math.PI/2, 0, 0], 'box', 
                {width: 1.5, height: trussLen, depth: 1.5}, 'NONE');
            
            // Engine Block at rear - Offset by 1 unit to avoid Z-fighting with spine end
            attachComponent('engine_block', [0, 0, -trussLen/2 - 1.5 - 1.0], [0, 0, 0], 'box', 
                {width: 5, height: 4, depth: 3}, 'NONE');
            
            // Connect Engine to Spine
            const spineId = components[components.length - 2].id;
            const engineId = components[components.length - 1].id;
            this.wiringGenerator.addConnection(explicitWiring, engineId, spineId, 'power', 2.0);

            // Bridge Block at front (or top front)
            // Overhang the front: trussLen/2 is the end. Place center slightly past it.
            attachComponent('bridge_block', [0, 1.5, trussLen/2 + 1.0], [0, 0, 0], 'box', 
                {width: 3, height: 2, depth: 4}, 'NONE');
            
            // Connect Bridge to Spine
            const bridgeId = components[components.length - 1].id;
            this.wiringGenerator.addConnection(explicitWiring, bridgeId, spineId, 'data', 2.0);

            // Cargo Containers
            const containers = Math.floor(trussLen / 3.0);
            for(let i=0; i<containers; i++) {
                const z = -trussLen/2 + 3.0 * i + 2.0;
                // Side containers (Reflective symmetry handles the other side)
                attachComponent('cargo_pod', [2.5, 0, z], [0, 0, 0], 'box', 
                    {width: 3.0, height: 2.5, depth: 2.8}, 'REFLECTIVE');
                
                // Occasional Vertical Container
                if (random() > 0.6) {
                     attachComponent('cargo_pod_top', [0, 2.5, z], [0, 0, 0], 'box', 
                        {width: 2.0, height: 2.0, depth: 2.8}, 'NONE');
                }
            }
        } else if (hullType === 'HORSESHOE') {
            // Asymmetrical Curve (Alien Juggernaut style)
            const curveRadius = spineLength * 0.8;
            const segments = 6 + Math.floor(random() * 4);
            const angleSpan = Math.PI * 1.2; // > 180 degrees
            const angleStep = angleSpan / segments;
            
            let prevId = null;
            for(let i=0; i<segments; i++) {
                // Curve along X/Z plane
                const angle = -angleSpan/2 + (i * angleStep);
                const x = Math.cos(angle) * curveRadius;
                const z = Math.sin(angle) * curveRadius;
                
                // Rotate segment to follow curve tangent
                const rotY = -angle; 
                const width = 2.5 + random();
                
                // FIX: Rotate around Z (Yaw) to follow curve. 
                // X(90) aligns Y-axis to Z. Z-rotation then rotates around the vertical (World Y).
                attachComponent('fuselage_arc', [x, 0, z], [Math.PI/2, 0, rotY], 'cylinder', 
                    {radiusTop: width/2, radiusBottom: width/2, height: (curveRadius * angleStep) * 1.1, radialSegments: 8}, 'NONE');
                
                const currentId = components[components.length - 1].id;
                if (prevId) {
                    this.wiringGenerator.addConnection(explicitWiring, currentId, prevId, 'structural', 2.0);
                }
                prevId = currentId;
            }
        } else if (hullType === 'BLOB') {
            // Millennium Falcon style: Main hull + Mandibles + Offset Cockpit
            const mainLen = spineLength * 0.8;
            const mainWidth = mainLen * 0.8;
            
            // Main Body
            attachComponent('fuselage_main', [0, 0, 0], [0, 0, 0], 'cylinder', 
                {radiusTop: mainWidth/2, radiusBottom: mainWidth/2, height: 2.0, radialSegments: 32}, 'NONE');
            
            // Mandibles (Front) - Tapered
            const mandLen = mainLen * 0.6;
            const mandWidth = mainWidth * 0.2; // Reduced width relative to hull
            const mandOffset = mainWidth * 0.18;
            
            // Tapered Mandibles (Prism)
            // Rotate X 90 to lay flat. Rotate Z 45 to align 4-sided prism as box.
            // radiusTop is Front (narrower), radiusBottom is Back (wider)
            const mFrontW = mandWidth * 0.6;
            const mBackW = mandWidth;
            
            // Add two mandibles manually since we might be in ASYMMETRICAL mode globally
            attachComponent('mandible_L', [-mandOffset, 0, mainLen/2 + mandLen/2 - 1], [Math.PI/2, 0, Math.PI/4], 'prism', 
                {radiusTop: mFrontW/2, radiusBottom: mBackW/2, height: mandLen, segments: 4}, 'NONE');
            attachComponent('mandible_R', [mandOffset, 0, mainLen/2 + mandLen/2 - 1], [Math.PI/2, 0, Math.PI/4], 'prism', 
                {radiusTop: mFrontW/2, radiusBottom: mBackW/2, height: mandLen, segments: 4}, 'NONE');
                
            // Engine Strip (Rear) - Carve and Thrusters
            // Carve out the back
            const carveDepth = 1.5;
            attachComponent('carve_engine_strip', [0, 0, -mainLen/2], [0, 0, 0], 'box', 
                {width: mainWidth * 0.8, height: 2.2, depth: carveDepth}, 'NONE');
            
            // Add Thrusters in the gap
            const numThrusters = 8;
            const stripW = mainWidth * 0.6;
            const step = stripW / (numThrusters - 1);
            const startX = -stripW/2;
            
            for(let i=0; i<numThrusters; i++) {
                const tx = startX + i*step;
                attachComponent(`thruster_strip_${i}`, [tx, 0, -mainLen/2 + 0.2], [Math.PI/2, 0, 0], 'cylinder', 
                    {radiusTop: 0.25, radiusBottom: 0.4, height: 0.8}, 'NONE');
            }

            // Cockpit - Offset
            // Strut (Cylinder) - Angled forward
            const strutAngle = Math.PI/6; // 30 degrees forward
            const strutLen = mainWidth * 0.4;
            
            // Start from side of hull
            const strutStartX = (mainWidth/2) * 0.8;
            const strutStartZ = mainLen * 0.2; // Slightly forward of center
            
            // Direction vector for strut (X+, Z+)
            const dirX = Math.cos(strutAngle);
            const dirZ = Math.sin(strutAngle);
            
            const strutCenter = [
                strutStartX + dirX * strutLen/2, 
                0, 
                strutStartZ + dirZ * strutLen/2
            ];
            
            // Rotate cylinder to match direction
            attachComponent('cockpit_strut', strutCenter, [0, -strutAngle, -Math.PI/2], 'cylinder', 
                {radiusTop: 0.6, radiusBottom: 0.6, height: strutLen}, 'NONE');
                
            // Cockpit Head (Capsule) - Attached at rear
            const capLen = 2.5;
            // Position at end of strut, then shift forward by half length so strut hits the back
            const headPos = [
                strutStartX + dirX * strutLen + (capLen/2) * 0.2, // Slight X shift
                0, 
                strutStartZ + dirZ * strutLen + (capLen/2) // Shift Z forward
            ];
            // Aligned Z (forward/backward). Capsule default is Y-up. Rotate X 90.
            attachComponent('cockpit_head', headPos, [Math.PI/2, 0, 0], 'capsule', 
                {radius: 0.9, length: capLen}, 'NONE');

        } else if (hullType === 'CATAMARAN') {
            // Star Trek Style Nacelle Ship (Constitution / Miranda / Voyager)
            // 1. Primary Hull (Saucer)
            const saucerRadius = (size === 'small' ? 3 : (size === 'medium' ? 5 : 8));
            const saucerHeight = Math.max(0.5, saucerRadius * 0.15);
            
            attachComponent('fuselage_saucer', [0, 0, 0], [0, 0, 0], 'cylinder', 
                {radiusTop: saucerRadius, radiusBottom: saucerRadius * 0.7, height: saucerHeight, radialSegments: 16}, 'NONE');

            // 2. Configuration
            const configType = random(); // 0-0.3: Miranda-ish, 0.3-1.0: Constitution/Voyager-ish
            let hasEngineering = configType > 0.3;
            
            let engPos = [0, 0, 0];
            
            if (hasEngineering) {
                const neckLen = saucerRadius * 0.8;
                const engLen = saucerRadius * 1.2;
                const engRadius = saucerRadius * 0.3;
                
                // Neck (Vertical or Angled)
                const neckPos = [0, -saucerHeight/2 - neckLen/2, -saucerRadius * 0.3];
                attachComponent('fuselage_neck', neckPos, [0.2, 0, 0], 'box', 
                    {width: engRadius * 0.8, height: neckLen, depth: engRadius * 1.5}, 'NONE');
                
                // Engineering Hull
                engPos = [0, -saucerHeight/2 - neckLen, -saucerRadius * 0.3];
                attachComponent('fuselage_engineering', engPos, [Math.PI/2, 0, 0], 'cylinder', 
                    {radiusTop: engRadius, radiusBottom: engRadius * 0.7, height: engLen, radialSegments: 12}, 'NONE');
                    
                // Deflector
                attachComponent('deflector', [0, engPos[1], engPos[2] + engLen/2], [Math.PI/2, 0, 0], 'cylinder', 
                    {radiusTop: engRadius * 0.8, radiusBottom: 0, height: 0.5}, 'NONE');
            }
            
            // 3. Nacelles & Pylons
            const nacelleLen = saucerRadius * 1.5;
            const nacelleRadius = nacelleLen * 0.12; // Thinner
            const pylonSpan = saucerRadius * (1.2 + random() * 0.5);
            
            // Pylon attachment point
            const attachY = hasEngineering ? engPos[1] + engRadius * 0.5 : -saucerHeight/2;
            const attachZ = hasEngineering ? engPos[2] - engLen * 0.2 : -saucerRadius * 0.2;
            
            // Nacelle Position (Up or Down relative to attachment)
            const nacelleY = attachY + (hasEngineering ? nacelleRadius * 4 : -nacelleRadius * 3);
            const nacelleZ = attachZ + (random() * 2 - 1); // Slight Z variation relative to attachment
            
            // Calculate Pylon Vector (from Hull to Nacelle)
            const dy = nacelleY - attachY;
            const dx = pylonSpan; // Horizontal distance to one side
            const dz = nacelleZ - attachZ;
            
            const pylonLen = Math.sqrt(dx*dx + dy*dy); // 2D length in XY plane for rotation
            const angle = Math.atan2(dy, dx); // Angle in XY plane
            
            // Left Pylon (Rotated to point Up/Left or Down/Left)
            // We position it at the midpoint between attachment and nacelle
            const pylonL_Pos = [-dx/2, attachY + dy/2, attachZ + dz/2];
            attachComponent('pylon_L', pylonL_Pos, [0, 0, Math.PI - angle], 'box', 
                {width: pylonLen, height: nacelleRadius * 0.2, depth: nacelleLen * 0.4}, 'NONE');
                
            // Right Pylon
            const pylonR_Pos = [dx/2, attachY + dy/2, attachZ + dz/2];
            attachComponent('pylon_R', pylonR_Pos, [0, 0, angle], 'box', 
                {width: pylonLen, height: nacelleRadius * 0.2, depth: nacelleLen * 0.4}, 'NONE');
            
            // Left Nacelle
            attachComponent('nacelle_L', [-pylonSpan, nacelleY, nacelleZ], [Math.PI/2, 0, 0], 'capsule', 
                {radius: nacelleRadius, length: nacelleLen}, 'NONE');
            
            // Right Nacelle
            attachComponent('nacelle_R', [pylonSpan, nacelleY, nacelleZ], [Math.PI/2, 0, 0], 'capsule', 
                {radius: nacelleRadius, length: nacelleLen}, 'NONE');
                
            // Thrusters on Pylons (Rear)
            const thrusterZ = attachZ - (nacelleLen * 0.5)/2 - 0.5;
            attachComponent('thruster_L', [-dx/2, attachY + dy/2, thrusterZ], [Math.PI/2, 0, 0], 'cone', 
                {radius: nacelleRadius * 0.5, height: 0.8}, 'NONE');
            attachComponent('thruster_R', [dx/2, attachY + dy/2, thrusterZ], [Math.PI/2, 0, 0], 'cone', 
                {radius: nacelleRadius * 0.5, height: 0.8}, 'NONE');

        } else if (hullType === 'Y_FORK') {
            // Y-Type: Single front, splitting into prongs
            const frontLen = spineLength * 0.4;
            // Front Fuselage
            attachComponent('fuselage_nose', [0, 0, frontLen/2], [Math.PI/2, 0, 0], 'cone', 
                {radius: 1.5, height: frontLen}, 'NONE');
            
            // Central Hub
            attachComponent('fuselage_hub', [0, 0, 0], [0, 0, 0], 'sphere', {radius: 2.0}, 'NONE');

            // Prongs
            const prongLen = spineLength * 0.8;
            const spreadAngle = Math.PI / 6; // 30 degrees
            
            // Calculate position for the prong based on angle
            const x = Math.sin(spreadAngle) * prongLen/2;
            const z = -Math.cos(spreadAngle) * prongLen/2;
            
            // We use the symmetry system to generate the other prong(s)
            // If Reflective, this generates Left/Right. If Radial, it generates the star pattern.
            const symMode = symmetryType === 'ASYMMETRICAL' ? 'REFLECTIVE' : symmetryType;
            
            attachComponent('fuselage_prong', [x, 0, z], [Math.PI/2, 0, -spreadAngle], 'cylinder', 
                {radiusTop: 1.2, radiusBottom: 0.8, height: prongLen}, symMode);

        } else if (hullType === 'TREE') {
            // Recursive Branching Structure
            const addBranch = (pos, rot, len, width, depth) => {
                if (depth > 3) return;
                
                // Use 'NONE' symmetry for internal recursion to avoid exponential explosion of mirrored parts
                // We rely on the initial call to set symmetry if needed, or just build a chaotic tree.
                // However, if we want a symmetrical tree, we should build the trunk central, and branches mirrored.
                
                const isTrunk = depth === 0;
                const effectiveSym = isTrunk ? 'NONE' : (symmetryType === 'REFLECTIVE' ? 'REFLECTIVE' : 'NONE');
                
                // If Reflective, we only generate branches on one side (positive X) and let symmetry handle the rest
                if (symmetryType === 'REFLECTIVE' && !isTrunk && pos[0] < 0) return;

                attachComponent(`branch_${depth}`, pos, rot, 'cylinder', 
                    {radiusTop: width, radiusBottom: width * 0.7, height: len}, effectiveSym);
                
                const numBranches = Math.floor(random() * 2) + 2;
                for(let i=0; i<numBranches; i++) {
                    const newLen = len * 0.7;
                    const newWidth = width * 0.7;
                    
                    // Calculate tip position of current branch
                    // Cylinder is Y-up local. 
                    const tipLocal = new THREE.Vector3(0, len/2, 0);
                    const tipWorld = tipLocal.applyEuler(new THREE.Euler(...rot)).add(new THREE.Vector3(...pos));
                    
                    // Random rotation offset
                    const rotOffset = [
                        (random() - 0.5),
                        (random() - 0.5),
                        (random() - 0.5)
                    ];
                    const newRot = [rot[0]+rotOffset[0], rot[1]+rotOffset[1], rot[2]+rotOffset[2]];
                    
                    // New position starts at tip
                    const dir = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(...newRot));
                    const newPos = tipWorld.clone().add(dir.multiplyScalar(newLen/2));
                    
                    addBranch([newPos.x, newPos.y, newPos.z], newRot, newLen, newWidth, depth + 1);
                }
            };
            
            // Start trunk
            addBranch([0,0,0], [Math.PI/2, 0, 0], spineLength/2, 2.0, 0);

        } else if (hullType === 'MAZE') {
            // 3D Grid Walk / Maze
            const steps = 12 + Math.floor(random() * 10);
            let curr = [0,0,0];
            const visited = new Set(['0,0,0']);
            const boxSize = 2.0;
            
            let prevId = null;
            for(let i=0; i<steps; i++) {
                // Randomize dimensions slightly for variety
                const dimVar = () => boxSize + (random() * 0.8 - 0.2);
                
                attachComponent('maze_segment', curr, [0,0,0], 'box', {width: dimVar(), height: dimVar(), depth: dimVar()}, 'NONE');
                
                const currentId = components[components.length - 1].id;
                if (prevId) {
                    this.wiringGenerator.addConnection(explicitWiring, currentId, prevId, 'structural', boxSize);
                }
                prevId = currentId;

                // Pick random direction
                // Bias towards Z axis (length of ship)
                const rDir = random();
                let axis = 0;
                if (rDir < 0.5) axis = 2; // 50% chance of Z
                else if (rDir < 0.75) axis = 0; // 25% X
                else axis = 1; // 25% Y

                const dir = random() > 0.5 ? 1 : -1;
                const next = [...curr];
                next[axis] += dir * boxSize;
                
                if (!visited.has(next.join(','))) {
                    curr = next;
                    visited.add(next.join(','));
                }
            }

        } else if (hullType === 'STATION_WHEEL' || hullType === 'STATION_RING') {
            const r = spineLength * 1.5;
            const tubeR = size === 'large' ? 3 : 1.5;
            
            // Orientation based on radial axis
            const rot = radialAxis === 'y' ? [Math.PI/2, 0, 0] : [0, 0, 0];

            // Rim
            attachComponent('rim', [0,0,0], rot, 'torus', {radius: r, tube: tubeR}, 'NONE');
            
            if (hullType === 'STATION_WHEEL') {
                // Hub
                attachComponent('hub', [0,0,0], [0,0,0], 'cylinder', {radiusTop: tubeR*2, radiusBottom: tubeR*2, height: tubeR*3}, 'NONE');
                // Spokes
                const spokes = radialCount < 3 ? 4 : radialCount;
                // Use Radial symmetry to generate spokes
                // Place one spoke
                const spokeLen = r - (tubeR * 2);
                // Position: halfway out along X (if Z axis) or X (if Y axis)
                // If Z axis: Spoke lies on X axis. Rot Z 90 to align cylinder Y with World X.
                const spokePos = [r/2, 0, 0];
                const spokeRot = [0, 0, Math.PI/2];
                
                // Adjust for Y axis orientation if needed, but attachComponent handles radial rotation
                attachComponent('spoke', spokePos, spokeRot, 'cylinder', {radiusTop: tubeR/2, radiusBottom: tubeR/2, height: spokeLen}, 'RADIAL');
            }

        } else if (hullType === 'BIO_CLUSTER') {
            // Organic Cluster (Metaball-ish placement)
            const count = 6 + Math.floor(random() * 6);
            for(let i=0; i<count; i++) {
                const s = 1.5 + random() * 2.5;
                // Random position within a radius
                const d = random() * spineLength * 0.4;
                const pt = new THREE.Vector3(random()-0.5, random()-0.5, random()-0.5).normalize().multiplyScalar(d);
                attachComponent('bio_node', [pt.x, pt.y, pt.z], [random(), random(), random()], 'sphere', {radius: s}, 'NONE');
            }

        } else if (hullType === 'MONOLITH') {
            // Monolith: Single massive primitive with surface detail
            const monoSize = (size === 'small' ? 5 : (size === 'medium' ? 10 : 18)) * (0.8 + random() * 0.4);
            // Shape: Box or Prism (4-6 sides)
            const shapeRoll = random();
            let shapeType = 'box';
            let prismSegs = 4;
            
            if (shapeRoll > 0.6) {
                shapeType = 'prism';
                prismSegs = Math.floor(random() * 3) + 4; // 4, 5, 6 sides
                attachComponent('fuselage_monolith', [0, 0, 0], [Math.PI/2, 0, 0], 'prism', 
                    {radius: monoSize * 0.6, height: monoSize * 1.2, segments: prismSegs}, 'NONE');
            } else if (shapeRoll > 0.3) {
                // Tetrahedron
                shapeType = 'tetrahedron';
                attachComponent('fuselage_monolith', [0, 0, 0], [random()*Math.PI, random()*Math.PI, 0], 'tetrahedron', 
                    {radius: monoSize * 0.8}, 'NONE');
            } else {
                // Box
                attachComponent('fuselage_monolith', [0, 0, 0], [0, 0, 0], 'box', 
                    {width: monoSize * 0.8, height: monoSize * 0.8, depth: monoSize * 1.2}, 'NONE');
            }

            // Carve-outs (Negative Space)
            // These components will be subtracted from the hull by ShipAssembler
            const numCarves = Math.floor(6 + random() * 8);
            for(let i=0; i<numCarves; i++) {
                const cSize = monoSize * (0.15 + random() * 0.15);
                
                // Random position roughly on surface
                const dir = new THREE.Vector3(random()-0.5, random()-0.5, random()-0.5).normalize();
                const dist = monoSize * 0.5; 
                const pos = dir.multiplyScalar(dist);
                
                attachComponent(`carve_void_${i}`, [pos.x, pos.y, pos.z], [random()*Math.PI, random()*Math.PI, 0], 'box', 
                    {width: cSize, height: cSize, depth: cSize}, 'NONE');
            }

            // External Spars/Pipes (Greebles)
            const numSpars = Math.floor(5 + random() * 5);
            const sparThick = monoSize * 0.02;

            if (shapeType === 'box') {
                // Box: Place on faces aligned with axes
                const dims = [monoSize * 0.8, monoSize * 0.8, monoSize * 1.2]; // Width, Height, Depth
                for(let i=0; i<numSpars; i++) {
                    const axis = Math.floor(random() * 3); // 0:X, 1:Y, 2:Z (Face Normal Axis)
                    const side = random() > 0.5 ? 1 : -1;
                    
                    // Position on face
                    const pos = [0, 0, 0];
                    pos[axis] = (dims[axis] / 2 + sparThick * 2) * side; // Slightly off surface
                    
                    // Random position on the other two axes
                    const u = (axis + 1) % 3;
                    const v = (axis + 2) % 3;
                    pos[u] = (random() - 0.5) * dims[u] * 0.8;
                    pos[v] = (random() - 0.5) * dims[v] * 0.8;
                    
                    // Orientation: Align with one of the other axes (u or v)
                    const alignAxis = random() > 0.5 ? u : v;
                    const sparLen = dims[alignAxis] * (0.4 + random() * 0.4);
                    
                    const rot = [0, 0, 0];
                    // Cylinder is Y-aligned. Rotate to match alignAxis.
                    if (alignAxis === 0) rot[2] = Math.PI / 2; // Align X
                    else if (alignAxis === 2) rot[0] = Math.PI / 2; // Align Z
                    
                    attachComponent(`structure_spar_${i}`, pos, rot, 'cylinder', 
                        {radiusTop: sparThick, radiusBottom: sparThick, height: sparLen}, 'NONE');
                }
            } else if (shapeType === 'prism') {
                // Prism: Vertical spars along the length
                const radius = monoSize * 0.6;
                const height = monoSize * 1.2;
                for(let i=0; i<numSpars; i++) {
                    const angle = (Math.floor(random() * prismSegs) / prismSegs) * Math.PI * 2; // Snap to face centers approx
                    const r = radius + sparThick * 2;
                    const len = height * (0.4 + random() * 0.4);
                    attachComponent(`structure_spar_${i}`, [Math.cos(angle)*r, (random()-0.5)*height*0.5, Math.sin(angle)*r], [0, 0, 0], 'cylinder', 
                        {radiusTop: sparThick, radiusBottom: sparThick, height: len}, 'NONE');
                }
            }
            
            // Engines are usually embedded or rear-mounted on monoliths
            attachComponent('engine_main', [0, 0, -monoSize * 0.6], [Math.PI/2, 0, 0], 'cylinder', {radiusTop: monoSize*0.1, radiusBottom: monoSize*0.15, height: monoSize*0.2}, 'NONE');

        } else if (hullType === 'FRACTAL') {
             // Iterative placement of shapes on faces
             const iterations = 3;
             // Randomize shape for this ship to avoid "samey" cubes
             const fractalShapes = ['box', 'dodecahedron', 'icosahedron', 'octahedron', 'sphere', 'tetrahedron'];
             const shapeType = fractalShapes[Math.floor(random() * fractalShapes.length)];

             let currentGen = [{pos: [0,0,0], size: 4.0}];
             
             // Base
             const baseDims = shapeType === 'box' ? {width: 4, height: 4, depth: 4} : {radius: 2.5};
             attachComponent('fractal_base', [0,0,0], [0,0,0], shapeType, baseDims, 'NONE');

             for(let i=0; i<iterations; i++) {
                 const nextGen = [];
                 for(const node of currentGen) {
                     const childSize = node.size / 2.2;
                     const offset = (node.size + childSize) / 2;
                     
                     // 6 faces directions (Cardinal)
                     const dirs = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];
                     
                     for(const d of dirs) {
                         // Random chance to spawn child, higher chance for lower iterations
                         // Increased decay (0.4 + i*0.2) to reduce component count and speed up generation
                         if (random() > (0.4 + i * 0.2)) { 
                             const newPos = [
                                 node.pos[0] + d[0]*offset, 
                                 node.pos[1] + d[1]*offset, 
                                 node.pos[2] + d[2]*offset
                             ];
                             
                             const childDims = shapeType === 'box' ? 
                                {width: childSize, height: childSize, depth: childSize} : 
                                {radius: childSize * 0.6};
                             
                             // Random rotation for non-box shapes adds variety
                             const childRot = shapeType === 'box' ? [0,0,0] : [random()*Math.PI, random()*Math.PI, random()*Math.PI];

                             attachComponent(`fractal_${i}`, newPos, childRot, shapeType, childDims, 'NONE');
                             
                             nextGen.push({pos: newPos, size: childSize});
                         }
                     }
                 }
                 currentGen = nextGen;
             }

        } else {
            // SPINE / STAR (Default)
            // Spine or Star Body
            // If STAR, we generate one arm and let Radial symmetry duplicate it
            const effectiveSymmetry = hullType === 'STAR' ? 'RADIAL' : 'NONE';

            const spineSegments = Math.floor(spineLength / 2) + 1;
            const segmentHeight = spineLength / spineSegments;
            let lastSegmentRadius = 1.0;
            let lastSegmentZ = 0;
            let previousSegmentId = null;

            // Initialize segment count for consistency (reduce jitter between segments)
            let currentSegs = (random() > 0.5) ? harmonicSegments : Math.floor(3 + random() * 5);

            for (let i = 0; i < spineSegments; i++) {
                const width = 2.0 + random() * 1.5; // Increased width (2.0 - 3.5) to avoid "narrow" look
                const isRadialZ = (symmetryType === 'RADIAL' && radialAxis === 'z');

                // 20% chance to change segment count, otherwise keep same as last to create cleaner lines
                if (i > 0 && random() < 0.2) {
                    currentSegs = Math.floor(3 + random() * 5);
                }

                const segs = isRadialZ ? radialCount : currentSegs;

                const radius = width / 2;
                let pos, rot;

                if (hullType === 'STAR') {
                    // Radiating outwards along X
                    const xPos = (i * segmentHeight) + (segmentHeight / 2); // Start from center out
                    pos = [xPos, 0, 0];
                    rot = [0, 0, Math.PI / 2]; // Rotate cylinder to point along X
                } else {
                    // Standard Spine along Z
                    // Fix: Center the segment properly so the spine goes from -L/2 to +L/2
                    const zPos = -(spineLength / 2) + (i * segmentHeight) + (segmentHeight / 2);
                    pos = [0, 0, zPos];
                    // Rotate 90deg X to align Prism Y-axis with Ship Z-axis
                    // If Radial Z, rotate Z to align faces (since axis is now Z)
                    let faceAlignment = 0;
                    if (isRadialZ) {
                        faceAlignment = -Math.PI / segs;
                    }

                    // Rotate Z to align odd-sided prisms (flat top/bottom)
                    // Default cylinder (prism) has vertex at +X. 
                    // RotX(90) puts vertex at +X (Side). We want vertex at +Y (Top) or -Y (Bottom) for symmetry.
                    // FIX: Apply Roll rotation to Y axis (which is the longitudinal axis after X-rotation [90,0,0])
                    const baseRoll = (segs % 2 !== 0) ? Math.PI / 2 : Math.PI / segs;

                    rot = [Math.PI / 2, baseRoll + faceAlignment, 0]; // [Pitch, Roll, Yaw] effectively due to order

                    if (i === spineSegments - 1) {
                        lastSegmentRadius = radius;
                        lastSegmentZ = zPos + (segmentHeight / 2);
                    }
                }

                attachComponent('fuselage', pos, rot, 'prism',
                    { radius: radius, height: segmentHeight, segments: segs },
                    effectiveSymmetry
                );

                // Connect to previous segment
                const currentId = components[components.length - 1].id;
                if (previousSegmentId && hullType === 'SPINE') {
                    this.wiringGenerator.addConnection(explicitWiring, currentId, previousSegmentId, 'power', segmentHeight);
                }
                previousSegmentId = currentId;
            }

            // Add Nose Cone (Only for Z-Spine)
            if (hullType === 'SPINE') {
                const noseLength = 2 + random() * 3;
                const noseZ = lastSegmentZ + (noseLength / 2) - 0.1;
                const noseRadius = lastSegmentRadius; // Match radius for cleaner look
                const noseSegments = (symmetryType === 'RADIAL' && radialAxis === 'z') ? radialCount : Math.floor(4 + random() * 4);
                const noseRotZ = (noseSegments % 2 !== 0) ? 0 : Math.PI / noseSegments;
                
                attachComponent('nose', [0, 0, noseZ],
                    [Math.PI / 2, (symmetryType === 'RADIAL' && radialAxis === 'z') ? -Math.PI / noseSegments : noseRotZ, 0],
                    'cone',
                    { radius: noseRadius, height: noseLength, radialSegments: noseSegments },
                    'NONE'
                );
                
                // Connect nose to last segment
                const noseId = components[components.length - 1].id;
                if (previousSegmentId) {
                    this.wiringGenerator.addConnection(explicitWiring, noseId, previousSegmentId, 'power', noseLength);
                }
            } else if (hullType === 'STAR') {
                // Central Hub for Star
                attachComponent('hub', [0, 0, 0], [0, 0, 0], 'cylinder', { radiusTop: 2, radiusBottom: 2, height: 2, radialSegments: radialCount * 2 }, 'NONE');
            }
        }

        // Helper to find fuselage radius at a specific Z position for wing attachment.
        // Falls back to the nearest segment if exact Z is not found (e.g. gaps or precision).
        const getFuselageRadiusAt = (z) => {
            let r = 1.0;
            let minDist = Infinity;
            let closestR = 1.0;

            for (const c of components) {
                if (c.usage === 'fuselage') {
                    // Check bounds (assuming prism/cylinder aligned along Z)
                    // Note: Fuselage segments are rotated [Math.PI/2, ...] so their local Y is World Z
                    const cZ = c.pos[2];
                    const height = c.dims.height || c.dims.length || 1;
                    const minZ = cZ - height / 2;
                    const maxZ = cZ + height / 2;

                    const rBottom = c.dims.radiusBottom !== undefined ? c.dims.radiusBottom : (c.dims.radius || 1);
                    const rTop = c.dims.radiusTop !== undefined ? c.dims.radiusTop : (c.dims.radius || 1);

                    if (z >= minZ && z <= maxZ) {
                        // Interpolate radius
                        const t = (z - minZ) / height;
                        r = rBottom * (1 - t) + rTop * t;
                        return r;
                    }

                    // Track closest segment just in case
                    const dist = Math.min(Math.abs(z - minZ), Math.abs(z - maxZ));
                    if (dist < minDist) {
                        minDist = dist;
                        // Use the radius of the end closest to Z
                        closestR = (Math.abs(z - minZ) < Math.abs(z - maxZ)) ? rBottom : rTop;
                    }
                }
            }
            return minDist < Infinity ? closestR : r;
        };

        // Helper to create a single wing structure (potentially multi-segment)
        // This function will now return an array of component definitions for one wing.
        const createSingleWingStructure = (initialPos, initialRotZ, initialRootChord, isRadialSymmetry, wingThickness, baseSpan) => {
            const wingComponents = [];

            // First segment (main wing)
            const dims = {
                tipChord: initialRootChord * (0.3 + random() * 0.5),
                sweep: (random() * 0.9 - 0.1) * initialRootChord,
                depth: wingThickness,
                span: baseSpan,
                rootChord: initialRootChord,
                centered: false
            };

            const rotZ = (random() * 0.5 - 0.25); // Dihedral/anhedral
            const currentRotZ = initialRotZ + rotZ;

            const mainWingDef = {
                usage: 'wing_main',
                type: 'wedge',
                dims: dims,
                pos: initialPos,
                rot: [0, 0, currentRotZ] // Rotation around Z axis (Roll/Dihedral)
            };
            wingComponents.push(mainWingDef);

            // Recursive addition of extensions/fins
            let parentTipWorldPos = new THREE.Vector3(...initialPos);
            
            // Calculate tip position including geometric sweep (Z-offset)
            const zOffset = dims.rootChord / 2 - dims.sweep - dims.tipChord / 2;
            const localTipOffset = new THREE.Vector3(dims.span, 0, zOffset);
            const rotatedTipOffset = localTipOffset.applyEuler(new THREE.Euler(0, 0, currentRotZ));
            parentTipWorldPos.add(rotatedTipOffset);

            // Add extensions/fins
            if (random() > 0.3 && !isRadialSymmetry) { // Limit recursion for radial to avoid complexity
                const numExtensions = Math.floor(random() * 2) + 1;
                for (let i = 0; i < numExtensions; i++) {
                    const extSpan = dims.span * (0.3 + random() * 0.4);
                    const extTipChord = dims.tipChord * (0.5 + random() * 0.5);
                    const extSweep = (random() * 0.5 - 0.2) * extTipChord;
                    const extThickness = wingThickness * (0.5 + random() * 0.5);

                    const extDims = { tipChord: extTipChord, sweep: extSweep, depth: extThickness, span: extSpan, rootChord: dims.tipChord, centered: false };
                    const extRotZ = (random() * 0.8 - 0.4); // Slight angle change
                    const extCurrentRotZ = currentRotZ + extRotZ;
                    const extensionDef = { usage: (random() > 0.7 ? 'fin_wingtip' : 'wing_ext'), type: 'wedge', dims: extDims, pos: [parentTipWorldPos.x, parentTipWorldPos.y, parentTipWorldPos.z], rot: [0, 0, extCurrentRotZ] };
                    wingComponents.push(extensionDef);
                    const extZOffset = extDims.rootChord / 2 - extDims.sweep - extDims.tipChord / 2;
                    const extLocalTipOffset = new THREE.Vector3(extSpan, 0, extZOffset);
                    const extRotatedTipOffset = extLocalTipOffset.applyEuler(new THREE.Euler(0, 0, extCurrentRotZ));
                    parentTipWorldPos.add(extRotatedTipOffset);
                }
            }
            return wingComponents;
        };

        // Engines
        const engineCount = size === 'small' ? 1 : (size === 'medium' ? 2 : 4);
        if (hullType === 'DISC') {
            // Saucer engines on rim (logic unchanged)
            const engR = mainHullRadius * 0.6;
            const height = (size === 'small' ? 1 : (size === 'medium' ? 2 : 3));
            
            // Engines on bottom, pointing down (No rotation, wider at bottom)
            attachComponent('engine', [engR, -height / 2 - 1.0, 0], [0, 0, 0], 'cylinder', 
                { radiusTop: 0.5, radiusBottom: 1.0, height: 2.0 }, 'RADIAL');
        } else if (hullType === 'FREIGHTER') {
            // Freighter engines are attached to the engine block at the rear
            const trussLen = spineLength * 1.5;
            const engineZ = -trussLen/2 - 4.0; // Behind the engine block (which is at -trussLen/2 - 2.5)
            
            // Main Engine
            attachComponent('engine_main', [0, 0, engineZ], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 1.0, radiusBottom: 1.5, height: 3.0 });
            // Side Engines
            attachComponent('engine_side', [2.5, 0, engineZ + 0.5], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 0.6, radiusBottom: 0.9, height: 2.5 }, 'REFLECTIVE');
        } else {
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

            // Calculate attachment point based on fuselage radius
            const fuselageRadius = getFuselageRadiusAt(wingZ);
            const attachmentX = fuselageRadius * 0.9; // Overlap to ensure connection

            // Force reflective symmetry for wings if the ship is asymmetrical, to ensure balance
            const symOverride = symmetryType === 'ASYMMETRICAL' ? 'REFLECTIVE' : null;

            // Recursive Wing Segment Generator - This was replaced by createSingleWingStructure in the previous diff, which is a better approach. Assuming that change is kept.
            const addWingSegment = (parentPos, parentRotZ, currentRootChord, depth) => {
                if (depth > 2) return; // Max recursion depth

                const isFin = depth > 0 && random() > 0.5;

                // Dimensions for this segment
                const span = (maxSpan / (depth + 1)) * (0.8 + random() * 0.4);
                const tipChord = currentRootChord * (0.3 + random() * 0.5); // Taper
                const sweep = (random() * 0.9 - 0.1) * currentRootChord; // Mostly rear swept (-0.1 to 0.8)

                const dims = {
                    tipChord: tipChord,
                    sweep: sweep,
                    depth: wingThickness * (1.0 - depth * 0.2), // Thinner towards tip
                    centered: false // Important: Align to Root, don't center
                };
                // Store original props for recursion logic if needed, though dims has them now
                dims.span = span; dims.rootChord = currentRootChord;

                // Rotation
                let rotZ = 0;
                if (depth === 0) {
                    // Main wing dihedral/anhedral
                    rotZ = (random() * 0.5 - 0.25);
                } else {
                    // Fin or extension
                    if (isFin) {
                        // Angle up or down significantly
                        if (symmetryType === 'RADIAL') {
                            // Avoid 90 degrees for radial to prevent swastika shapes
                            rotZ = (Math.PI / 4) * (random() > 0.5 ? 1 : -1) + (random() * 0.2 - 0.1);
                        } else {
                            rotZ = (Math.PI / 2) * (random() > 0.5 ? 1 : -1) + (random() * 0.4 - 0.2);
                        }
                    } else {
                        // Extension, slight angle change
                        rotZ = (random() * 0.4 - 0.2);
                    }
                }

                const totalRotZ = parentRotZ + rotZ;

                // Name
                const name = depth === 0 ? 'wing_main' : (isFin ? 'fin_wingtip' : 'wing_ext');
                const id = `${name}_${depth}_${random().toFixed(3)}`;

                // With centered: false, the mesh origin is at the Root Center.
                // We can place it directly at parentPos.
                // Rotation is around the Root, which is exactly what we want for wings/fins.

                const placeX = parentPos[0];
                const placeY = parentPos[1];
                const placeZ = parentPos[2];

                // Attach
                attachComponent(name, [placeX, placeY, placeZ], [0, 0, totalRotZ], 'wedge', dims, symOverride);

                // Calculate Tip Position for next segment
                // Tip Center relative to Root Center in World Space (Shape Y -> World Z via RotateX(90))
                // Tip Center Y in Shape = l/2 - sweep - tipChord/2.
                // Root Center Y in Shape = 0.
                const nextSegmentOffsetZ = currentRootChord / 2 - sweep - tipChord / 2;

                // Apply Z rotation (Dihedral) to the X/Y plane
                const nextX = parentPos[0] + span * Math.cos(totalRotZ);
                const nextY = parentPos[1] + span * Math.sin(totalRotZ);
                const nextZ = parentPos[2] + nextSegmentOffsetZ;

                // Recursion
                if (random() > 0.3) {
                    addWingSegment([nextX, nextY, nextZ], totalRotZ, tipChord, depth + 1);
                }
            };

            if (effectiveWingConfig === 'Monoplane') {
                // Monoplane (Standard) - Variable height
                const yPos = (random() - 0.5) * 2.0;
                const wingDefs = createSingleWingStructure([attachmentX, yPos, wingZ], 0, baseRootChord, symmetryType === 'RADIAL', wingThickness, baseSpan);
                
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

                processWing(createSingleWingStructure([attachmentX, 0.2, wingZ], angle, baseRootChord, false, wingThickness, maxSpan));
                processWing(createSingleWingStructure([attachmentX, -0.2, wingZ], -angle, baseRootChord, false, wingThickness, maxSpan));
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

                processWing(createSingleWingStructure([attachmentX, gap / 2, wingZ], 0, baseRootChord, symmetryType === 'RADIAL', wingThickness, maxSpan));
                processWing(createSingleWingStructure([attachmentX, -gap / 2, wingZ], 0, baseRootChord, symmetryType === 'RADIAL', wingThickness, maxSpan));
            }

            // Fins (Canards / Tail)
            // Front Canards
            if (random() > 0.6) {
                const canardW = baseSpan * 0.4;
                const canardL = baseRootChord * 0.3;
                const cX = fuselageRadius * 0.8;
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
            if (symmetryType === 'ASYMMETRICAL' || hullType === 'BLOB' || hullType === 'MAZE') {
                // Side Offset (Falcon style)
                const sideX = 2.5 + random() * 1.5;
                const sideZ = (random() - 0.5) * (spineLength * 0.4);
                
                // Fix for Radial Symmetry Cockpits:
                // If Radial, place central or ensure rotation aligns with radial segment
                if (symmetryType === 'RADIAL') {
                    attachComponent('cockpit', [0, 0, spineLength/2], [0, 0, 0], 'ellipsoid', { width: 1.5, height: 1.0, length: 2.0 });
                } else {
                // Cockpit
                attachComponent('cockpit', [sideX, 0, sideZ], [0, 0, 0], 'cylinder', { radiusTop: 0.8, radiusBottom: 0.8, height: 1.5, radialSegments: 16 });
                // Connecting strut/corridor to fuselage
                attachComponent('cockpit_strut', [sideX / 2, 0, sideZ], [0, 0, Math.PI / 2], 'cylinder', { radiusTop: 0.5, radiusBottom: 0.5, height: sideX, radialSegments: 8 });
                }
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
        const genPos = hullType === 'DISC' ? [mainHullRadius * 0.4, 0, 0] :
            hullType === 'STAR' ? [spineLength * 0.3, 0, 0] :
                [0, -0.5, -(spineLength / 2) + 1.5];
        attachComponent('generator', genPos, [0, 0, 0], 'box', { width: 1.5, height: 1.0, depth: 1.5 });

        // Shield Generator
        const shieldPos = hullType === 'DISC' ? [0, 0.5, 0] : [0, 0.8, 0]; // Center is fine for shield
        attachComponent('shield', shieldPos, [Math.PI / 2, 0, 0], 'torus', { radius: 0.8, tube: 0.2 }, 'NONE'); // Single shield

        // Vortex Generator
        const vortexPos = hullType === 'DISC' ? [mainHullRadius * 0.6, -0.5, 0] : [0, -0.8, spineLength / 2 - 1];
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
        components.livery = {
            noiseSeed: random() * 100,
            patternType: Math.floor(random() * 3),
            color1: Math.floor(random() * 0xffffff),
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
