import * as THREE from 'three';
import { mulberry32, MANUFACTURERS, TECH_SPECS, QUALITIES } from './ShipUtils.js';

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
        const styleTypes = ['ORGANIC', 'INDUSTRIAL', 'SKELETON'];
        const selectedStyle = config.style || styleTypes[Math.floor(random() * styleTypes.length)];
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

            if (this.gameEngine && this.gameEngine.loreGenerator && this.gameEngine.loreGenerator.nameGenerator) {
                // Use the Lore Generator for procedural names
                const ng = this.gameEngine.loreGenerator.nameGenerator;
                const context = { type: 'TECHNOLOGY' };

                if (typeof ng.generatePlaceholder === 'function') {
                    name = ng.generatePlaceholder(context, random());
                    // Start the slow generation in background
                    namePromise = ng.generate(context, random());
                } else {
                    // Fallback for synchronous generators
                    name = ng.generate('TECHNOLOGY', random());
                }
            } else {
                name = `${MANUFACTURERS[Math.floor(random() * MANUFACTURERS.length)]} ${TECH_SPECS[Math.floor(random() * TECH_SPECS.length)]} ${usage} ${QUALITIES[Math.floor(random() * QUALITIES.length)]}`;
            }

            const id = `${usage}_${components.length}`;
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
                            rRot = preventRotationSymmetry ? baseRot : [baseRot[0], baseRot[1], baseRot[2] + angle];
                        } else {
                            // Rotate around Y (Saucer style)
                            rPos = [
                                basePos[0] * cos - basePos[2] * sin,
                                basePos[1],
                                basePos[0] * sin + basePos[2] * cos
                            ];
                            rRot = preventRotationSymmetry ? baseRot : [baseRot[0], baseRot[1] + angle, baseRot[2]];
                        }

                        const rId = id + `_rad_${i}`;
                        components.push({ usage, name, namePromise, type, dims, pos: rPos, rot: rRot, id: rId, stats });
                        radialIds.push({ id: rId, pos: rPos });

                        // Wire to center
                        if (id !== 'fuselage_0') {
                            this.wiringGenerator.addConnection(explicitWiring, id, `fuselage_0`, 'power', 5.0);
                        }
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
             else if (rHull < 0.8) hullType = 'BIO_CLUSTER';
             else hullType = 'TREE'; // Asymmetrical tree
        } else if (symmetryType === 'REFLECTIVE') {
             if (rHull < 0.2 && size !== 'small') hullType = 'FREIGHTER'; // Nostromo / Trucker
             else if (rHull < 0.35) hullType = 'CATAMARAN'; // Twin Hull
             else if (rHull < 0.55) hullType = 'Y_FORK';
             else if (rHull < 0.7) hullType = 'FRACTAL';
             else if (rHull < 0.85) hullType = 'TREE'; // Symmetrical Tree
             else hullType = 'SPINE';
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
            // Freighter: Long central spine with cargo pods attached
            const trussLen = spineLength * 1.5;
            // Central Truss
            attachComponent('fuselage_spine', [0, 0, 0], [Math.PI/2, 0, 0], 'box',
                {width: 1.5, height: trussLen, depth: 1.5}, 'NONE');

            // Engine Block at rear
            attachComponent('engine_block', [0, 0, -trussLen/2 - 1.5], [0, 0, 0], 'box',
                {width: 5, height: 4, depth: 3}, 'NONE');

            // Bridge Block at front (or top front)
            attachComponent('bridge_block', [0, 1.5, trussLen/2 - 2], [0, 0, 0], 'box',
                {width: 3, height: 2, depth: 4}, 'NONE');

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

            for(let i=0; i<segments; i++) {
                // Curve along X/Z plane
                const angle = -angleSpan/2 + (i * angleStep);
                const x = Math.cos(angle) * curveRadius;
                const z = Math.sin(angle) * curveRadius;

                // Rotate segment to follow curve tangent
                const rotY = -angle;
                const width = 2.5 + random();

                attachComponent('fuselage_arc', [x, 0, z], [Math.PI/2, 0, rotY], 'cylinder',
                    {radiusTop: width/2, radiusBottom: width/2, height: (curveRadius * angleStep) * 1.1, radialSegments: 8}, 'NONE');

                // Occasional vertical spike or bulb on the horseshoe
                if (random() > 0.7) {
                    attachComponent('structure', [x, 1.5, z], [0, 0, 0], 'cone', {radius: 1, height: 3}, 'NONE');
                }
            }
        } else if (hullType === 'BLOB') {
            // Millennium Falcon style: Main hull + Mandibles + Offset Cockpit
            const mainLen = spineLength * 0.8;
            const mainWidth = mainLen * 0.8;

            // Main Body
            attachComponent('fuselage_main', [0, 0, 0], [0, 0, 0], 'cylinder',
                {radiusTop: mainWidth/2, radiusBottom: mainWidth/2, height: 2.0, radialSegments: 16}, 'NONE');

            // Mandibles (Front)
            const mandLen = mainLen * 0.6;
            const mandWidth = mainWidth * 0.2;
            const mandOffset = mainWidth * 0.25;

            // Add two mandibles manually since we might be in ASYMMETRICAL mode globally
            attachComponent('mandible_L', [-mandOffset, 0, mainLen/2 + mandLen/2 - 1], [0, 0, 0], 'box',
                {width: mandWidth, height: 1.5, depth: mandLen}, 'NONE');
            attachComponent('mandible_R', [mandOffset, 0, mainLen/2 + mandLen/2 - 1], [0, 0, 0], 'box',
                {width: mandWidth, height: 1.5, depth: mandLen}, 'NONE');

            // Engine Strip (Rear)
            attachComponent('engine_strip', [0, 0, -mainLen/2], [0, 0, 0], 'box',
                {width: mainWidth * 0.9, height: 1.8, depth: 1.0}, 'NONE');

        } else if (hullType === 'CATAMARAN') {
            // Twin Hulls
            const hullOffset = 3.0 + random() * 2.0;
            const hullLen = spineLength;

            // Left Hull
            attachComponent('hull_L', [-hullOffset, 0, 0], [Math.PI/2, 0, 0], 'capsule',
                {radius: 1.5, length: hullLen}, 'NONE');
            // Right Hull
            attachComponent('hull_R', [hullOffset, 0, 0], [Math.PI/2, 0, 0], 'capsule',
                {radius: 1.5, length: hullLen}, 'NONE');

            // Connecting Wing/Body
            attachComponent('wing_connect', [0, 0, 0], [0, 0, 0], 'box',
                {width: hullOffset * 2, height: 0.8, depth: hullLen * 0.6}, 'NONE');

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

            for(let i=0; i<steps; i++) {
                attachComponent('maze_segment', curr, [0,0,0], 'box', {width: boxSize, height: boxSize, depth: boxSize}, 'NONE');

                // Pick random direction
                const axis = Math.floor(random() * 3);
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

        } else if (hullType === 'FRACTAL') {
             // Iterative placement of boxes on faces
             const iterations = 3;
             let currentGen = [{pos: [0,0,0], size: 4.0}];

             // Base
             attachComponent('fractal_base', [0,0,0], [0,0,0], 'box', {width: 4, height: 4, depth: 4}, 'NONE');

             for(let i=0; i<iterations; i++) {
                 const nextGen = [];
                 for(const node of currentGen) {
                     const childSize = node.size / 2.2;
                     const offset = (node.size + childSize) / 2;

                     // 6 faces directions
                     const dirs = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];

                     for(const d of dirs) {
                         // Random chance to spawn child, higher chance for lower iterations
                         if (random() > (0.3 + i * 0.15)) {
                             const newPos = [
                                 node.pos[0] + d[0]*offset,
                                 node.pos[1] + d[1]*offset,
                                 node.pos[2] + d[2]*offset
                             ];

                             // Only add if we haven't generated here (simple check)
                             // For true fractal we just place.
                             attachComponent(`fractal_${i}`, newPos, [0,0,0], 'box',
                                {width: childSize, height: childSize, depth: childSize}, 'NONE');

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
                    // If Radial Z, rotate Y to align faces
                    let yRot = 0;

                    if (symmetryType === 'REFLECTIVE' && segs % 2 !== 0) {
                        // For reflective symmetry, odd-sided prisms must have a flat top/bottom
                        // Default cylinder has vertex at +X. Rotating 90 deg puts vertex at +Y (Up), flat at -Y (Down).
                        yRot = Math.PI / 2;
                    } else if (isRadialZ) {
                        yRot = -Math.PI / segs;
                    }

                    rot = [Math.PI / 2, yRot, 0];

                    if (i === spineSegments - 1) {
                        lastSegmentRadius = radius;
                        lastSegmentZ = zPos + (segmentHeight / 2);
                    }
                }

                attachComponent('fuselage', pos, rot, 'prism',
                    { radius: radius, height: segmentHeight, segments: segs },
                    effectiveSymmetry
                );
            }

            // Add Nose Cone (Only for Z-Spine)
            if (hullType === 'SPINE') {
                const noseLength = 2 + random() * 3;
                const noseZ = lastSegmentZ + (noseLength / 2) - 0.1;
                const noseRadius = lastSegmentRadius * 0.9;
                const noseSegments = (symmetryType === 'RADIAL' && radialAxis === 'z') ? radialCount : Math.floor(4 + random() * 4);

                attachComponent('nose', [0, 0, noseZ],
                    [Math.PI / 2, (symmetryType === 'RADIAL' && radialAxis === 'z') ? -Math.PI / noseSegments : 0, 0],
                    'cone',
                    { radius: noseRadius, height: noseLength, radialSegments: noseSegments },
                    'NONE'
                );
            } else if (hullType === 'STAR') {
                // Central Hub for Star
                attachComponent('hub', [0, 0, 0], [0, 0, 0], 'cylinder', { radiusTop: 2, radiusBottom: 2, height: 2, radialSegments: radialCount * 2 }, 'NONE');
            }
        }

        // Add Torus Ring for Radial Ships
        if (symmetryType === 'RADIAL' && random() > 0.3) {
            const ringRadius = (size === 'small' ? 3 : (size === 'medium' ? 6 : 10)) * (0.5 + random() * 0.5);
            const tubeRadius = ringRadius * 0.15 * (0.8 + random() * 0.4);

            let ringRot = [0, 0, 0];
            // If radialAxis is 'y' (Saucer), torus needs to be in XZ plane. Default Torus is XY. Rotate X 90.
            if (radialAxis === 'y') {
                ringRot = [Math.PI / 2, 0, 0];
            }

            // Center the ring at 0,0,0
            attachComponent('fuselage_ring', [0, 0, 0], ringRot, 'torus', { radius: ringRadius, tube: tubeRadius }, 'NONE');
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

        // Engines
        const engineCount = size === 'small' ? 1 : (size === 'medium' ? 2 : 4);
        const engineZ = -(spineLength / 2) - 1;
        if (hullType === 'DISC') {
            // Saucer engines on rim
            const engR = mainHullRadius || 4;
            attachComponent('engine', [engR, 0, 0], [0, 0, -Math.PI / 2], 'cylinder', { radiusTop: 0.4, radiusBottom: 0.6, height: 1.5 });
            // Add Strut to center
            attachComponent('mount', [engR / 2, 0, 0], [0, 0, -Math.PI / 2], 'box', { width: 0.5, height: 0.5, depth: engR });
        } else {
            if (symmetryType === 'REFLECTIVE') {
                attachComponent('engine', [1.5, 0, engineZ], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 0.4, radiusBottom: 0.6, height: 2.0 });
                // Add Strut to fuselage
                attachComponent('mount', [0.75, 0, engineZ], [0, 0, 0], 'box', { width: 1.5, height: 0.4, depth: 0.8 });
            } else if (hullType === 'STAR') {
                // Engines at ends of arms
                const armLen = spineLength;
                attachComponent('engine', [armLen, 0, 0], [0, 0, -Math.PI / 2], 'cylinder', { radiusTop: 0.5, radiusBottom: 0.8, height: 2.0 });
            } else {
                // Central engine
                attachComponent('engine', [0, 0, engineZ], [Math.PI / 2, 0, 0], 'cylinder', { radiusTop: 0.6, radiusBottom: 0.9, height: 2.5 });
            }
        }

        // Wings & Fins Generation
        if (random() > 0.1 && hullType === 'SPINE') { // 90% chance of wings, but not for saucers/stars
            const wingConfig = random(); // 0-0.4: Mono, 0.4-0.7: X-Wing, 0.7-1.0: Bi-Wing

            // Dimensions - Allow larger wings relative to fuselage
            const baseRootChord = spineLength * (0.5 + random() * 0.5); // 50% to 100% of fuselage length
            const baseSpan = baseRootChord * (0.25 + random() * 0.75); // 25% to 100% of root chord
            const wingThickness = 0.2 + random() * 0.1;

            // Position Z: Centered or slightly offset
            const wingZ = (random() - 0.5) * (spineLength * 0.2);

            // Calculate attachment point based on fuselage radius
            const fuselageRadius = getFuselageRadiusAt(wingZ);
            const attachmentX = fuselageRadius * 0.95; // Slight overlap to ensure connection

            // Force reflective symmetry for wings if the ship is asymmetrical, to ensure balance
            const symOverride = symmetryType === 'ASYMMETRICAL' ? 'REFLECTIVE' : null;

            // Recursive Wing Segment Generator
            const addWingSegment = (parentPos, parentRotZ, currentRootChord, depth) => {
                if (depth > 2) return; // Max recursion depth

                const isFin = depth > 0 && random() > 0.5;

                // Dimensions for this segment
                const span = baseSpan / (depth + 1) * (0.8 + random() * 0.4);
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

            if (wingConfig < 0.4) {
                // Monoplane (Standard) - Variable height
                const yPos = (random() - 0.5) * 2.0;
                addWingSegment([attachmentX, yPos, wingZ], 0, baseRootChord, 0);
            } else if (wingConfig < 0.7) {
                // X-Wing (Angled)
                const angle = (Math.PI / 6) + random() * (Math.PI / 6); // 30-60 degrees
                addWingSegment([attachmentX, 0.2, wingZ], angle, baseRootChord, 0);
                addWingSegment([attachmentX, -0.2, wingZ], -angle, baseRootChord, 0);
            } else {
                // Bi-Wing (Stacked)
                const gap = 2.0 + random();
                addWingSegment([attachmentX, gap / 2, wingZ], 0, baseRootChord, 0);
                addWingSegment([attachmentX, -gap / 2, wingZ], 0, baseRootChord, 0);
            }

            // Fins (Canards / Tail)
            // Front Canards
            if (random() > 0.6) {
                const canardZ = spineLength / 2 - 1.5;
                const canardW = baseSpan * 0.4;
                const canardL = baseRootChord * 0.3;
                const cX = 0.6;
                const canardSweep = canardL * 0.4;
                attachComponent('fin_front', [cX, 0, canardZ], [0, 0, 0], 'wedge', { span: canardW, rootChord: canardL, sweep: canardSweep, depth: 0.15, centered: false }, symOverride);
            }

            // Rear Fins / Vertical Stabilizers
            if (random() > 0.4) {
                const tailZ = -spineLength / 2 + 1;
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

                // Cockpit
                attachComponent('cockpit', [sideX, 0, sideZ], [0, 0, 0], 'cylinder', { radiusTop: 0.8, radiusBottom: 0.8, height: 1.5, radialSegments: 16 });
                // Connecting strut/corridor to fuselage
                attachComponent('cockpit_strut', [sideX / 2, 0, sideZ], [0, 0, Math.PI / 2], 'cylinder', { radiusTop: 0.5, radiusBottom: 0.5, height: sideX, radialSegments: 8 });
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

        // 3. Generate Wiring Graph (Logical connections)
        // Use the WiringGenerator to create the full graph
        const wiringGraph = this.wiringGenerator.generateLogicalGraph(components, explicitWiring);

        // Store the graph for harmonics calculation later
        // Note: In the refactored version, we return this data instead of setting it on 'this'
        // The caller (ShipFactory) will handle storing it.

        // Store symmetry info for greebling
        components.symmetryType = symmetryType;
        components.radialAxis = radialAxis;
        components.radialCount = radialCount;

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
