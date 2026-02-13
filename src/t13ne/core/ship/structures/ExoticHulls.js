import * as THREE from 'three';

export const generateTree = (context) => {
    const { spineLength, symmetryType, random, attachComponent } = context;
    
    // Recursive Branching Structure
    const addBranch = (pos, rot, len, width, depth) => {
        if (depth > 3) return;
        
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
            const tipLocal = new THREE.Vector3(0, len / 2, 0);
            const tipWorld = tipLocal.clone().applyEuler(new THREE.Euler(...rot)).add(new THREE.Vector3(...pos));
            
            // Random rotation offset
            const rotOffset = [
                (random() - 0.5) * Math.PI / 4,
                (random() - 0.5) * Math.PI / 4,
                (random() - 0.5) * Math.PI / 4
            ];
            const newRot = [rot[0] + rotOffset[0], rot[1] + rotOffset[1], rot[2] + rotOffset[2]];
            
            // New position starts at tip
            const dir = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(...newRot));
            const newPos = tipWorld.clone().add(dir.clone().multiplyScalar(newLen / 2));
            
            addBranch([newPos.x, newPos.y, newPos.z], newRot, newLen, newWidth, depth + 1);
        }
    };
    
    // Start trunk
    addBranch([0,0,0], [Math.PI/2, 0, 0], spineLength/2, 2.0, 0);
};

export const generateMaze = (context) => {
    const { random, attachComponent, wiringGenerator, explicitWiring, components } = context;
    
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
            wiringGenerator.addConnection(explicitWiring, currentId, prevId, 'structural', boxSize);
        }
        prevId = currentId;

        // Pick random direction
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
};

export const generateBioCluster = (context) => {
    const { spineLength, random, attachComponent } = context;
    
    // Organic Cluster (Metaball-ish placement)
    const count = 6 + Math.floor(random() * 6);
    for(let i=0; i<count; i++) {
        const s = 1.5 + random() * 2.5;
        // Random position within a radius
        const d = random() * spineLength * 0.4;
        const pt = new THREE.Vector3(random()-0.5, random()-0.5, random()-0.5).normalize().multiplyScalar(d);
        attachComponent('bio_node', [pt.x, pt.y, pt.z], [random(), random(), random()], 'sphere', {radius: s}, 'NONE');
    }
};

export const generateMonolith = (context) => {
    const { size, random, attachComponent } = context;
    
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
    
    return { monoSize, shapeType, prismSegs };
};

export const generateFractal = (context) => {
    const { random, attachComponent } = context;
    
    // Iterative placement of shapes on faces
    const iterations = 3;
    const maxComponents = 50; // Hard limit to prevent performance issues
    let count = 0;

    const fractalShapes = ['box', 'dodecahedron', 'icosahedron', 'octahedron', 'sphere', 'tetrahedron'];
    const shapeType = fractalShapes[Math.floor(random() * fractalShapes.length)];

    // Use radius as the standard size metric
    const baseRadius = 2.5;
    let currentGen = [{pos: [0,0,0], radius: baseRadius}];
    
    // Base
    const baseDims = shapeType === 'box' ? {width: baseRadius*2, height: baseRadius*2, depth: baseRadius*2} : {radius: baseRadius};
    attachComponent('fractal_base', [0,0,0], [0,0,0], shapeType, baseDims, 'NONE');
    count++;

    for(let i=0; i<iterations; i++) {
        if (count >= maxComponents) break;
        const nextGen = [];
        for(const node of currentGen) {
            if (count >= maxComponents) break;
            
            const childRadius = node.radius * 0.6;
            
            // Calculate offset distance
            // For boxes, they touch at (r1 + r2).
            // For polyhedra, we need to embed them to ensure connection, as vertices stick out further than faces.
            // 0.65 factor ensures deep embedding for spiky shapes like tetrahedrons.
            const overlapFactor = shapeType === 'box' ? 1.0 : 0.65;
            const offset = (node.radius + childRadius) * overlapFactor;

            const dirs = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];
            
            for(const d of dirs) {
                if (count >= maxComponents) break;

                if (random() < (0.8 - i * 0.2)) {
                    const newPos = [node.pos[0] + d[0]*offset, node.pos[1] + d[1]*offset, node.pos[2] + d[2]*offset];
                    const childDims = shapeType === 'box' 
                        ? {width: childRadius*2, height: childRadius*2, depth: childRadius*2} 
                        : {radius: childRadius};
                    const childRot = shapeType === 'box' ? [0,0,0] : [random()*Math.PI, random()*Math.PI, random()*Math.PI];
                    attachComponent(`fractal_${i}_${count}`, newPos, childRot, shapeType, childDims, 'NONE');
                    count++;

                    nextGen.push({pos: newPos, radius: childRadius});
                }
            }
        }
        currentGen = nextGen;
    }
};

export const generateLiberator = (context) => {
    const { spineLength, attachComponent } = context;
    
    // Liberator (DSV2) - Tri-radial, Hex Hull, Rear Sphere, 3 Nacelles
    // Total Length: 100 units (scaled by spineLength)
    const unit = spineLength / 100;
    
    // Coordinate System: +Z is Forward (0), -Z is Rear (100)
    // Center of ship (50) is at Z=0.
    
    // 1. Main Body (Hexagonal Prism)
    // Length 45. Position: 27.5 to 72.5 (Brief).
    // Center: 50. Z = 0.
    const hullLen = 45 * unit;
    const hullRadius = 6 * unit; 
    
    attachComponent('fuselage_main', [0, 0, 0], [Math.PI/2, 0, 0], 'prism', 
        { radius: hullRadius, height: hullLen, segments: 6 }, 'NONE');

    // 2. Rear Sphere (Power Sphere)
    // Diameter 15. Center at 80 (Z = -30 * unit).
    const sphereRad = 7.5 * unit;
    const sphereZ = -30 * unit;
    
    attachComponent('reactor_sphere', [0, 0, sphereZ], [0, 0, 0], 'sphere', 
        { radius: sphereRad }, 'NONE');

    // 3. Rear Spire
    // Length 12. Extends from sphere (87.5) to 99.5.
    // Center Z: 93.5 -> Z = -43.5 * unit.
    const rearSpireLen = 12 * unit;
    const rearSpireZ = -43.5 * unit;
    
    attachComponent('sensor_spire_rear', [0, 0, rearSpireZ], [Math.PI/2, 0, 0], 'cone', 
        { radius: 1 * unit, height: rearSpireLen }, 'NONE');

    // 4. Flight Deck (Bridge)
    // Front of Hull (27.5 -> Z = +22.5 * unit).
    const bridgeLen = 5 * unit;
    const bridgeZ = 22.5 * unit + bridgeLen/2;
    
    attachComponent('bridge', [0, 0, bridgeZ], [Math.PI/2, 0, 0], 'prism', 
        { radiusTop: hullRadius * 0.6, radiusBottom: hullRadius, height: bridgeLen, segments: 6 }, 'NONE');

    // 5. Pylons & Nacelles (Tri-Radial)
    const nacelleRad = 30 * unit;
    const nacelleLen = 20 * unit;
    const nacelleZ = 28 * unit; // Center of nacelle in Z
    
    // Nacelle (Teardrop): Tip at +Z (Front), Base at -Z (Rear)
    attachComponent('engine_nacelle', [nacelleRad, 0, nacelleZ], [Math.PI/2, 0, 0], 'cone', 
        { radius: 4 * unit, height: nacelleLen, radialSegments: 16 }, 'RADIAL');

    // Forward Spire
    // Length 12. Extends from Nacelle Front (Z=38) to Z=50.
    const fwdSpireLen = 12 * unit;
    const fwdSpireZ = 44 * unit;
    
    attachComponent('sensor_spire_fwd', [nacelleRad, 0, fwdSpireZ], [Math.PI/2, 0, 0], 'cone', 
        { radius: 0.5 * unit, height: fwdSpireLen }, 'RADIAL');

    // Pylon
    const pylonStart = new THREE.Vector3(hullRadius * 0.8, 0, 0);
    const pylonEnd = new THREE.Vector3(nacelleRad * 0.8, 0, nacelleZ);
    const pylonVec = new THREE.Vector3().subVectors(pylonEnd, pylonStart);
    const pylonLen = pylonVec.length();
    const pylonMid = new THREE.Vector3().addVectors(pylonStart, pylonEnd).multiplyScalar(0.5);
    
    // Orientation
    const dummy = new THREE.Object3D();
    dummy.position.copy(pylonMid);
    dummy.lookAt(pylonEnd);
    dummy.rotateX(Math.PI/2);
    
    attachComponent('pylon', [pylonMid.x, pylonMid.y, pylonMid.z], [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z], 'box', 
        { width: 2 * unit, height: pylonLen, depth: 1 * unit }, 'RADIAL');
};

export const generateBioBird = (context) => {
    const { spineLength, random, attachComponent } = context;
    const bodyLen = spineLength;
    
    // Body
    // Ellipsoid dims are radii/scale. Use bodyLen*0.5 so total length is bodyLen.
    attachComponent('bio_body', [0, 0, 0], [0, 0, 0], 'ellipsoid', 
        { width: bodyLen*0.25, height: bodyLen*0.2, length: bodyLen*0.5 }, 'NONE');
    
    // Head
    // Move further forward to avoid being swallowed by body blend. 
    // Body ends at 0.5. Head center at 0.65 puts it clearly in front.
    attachComponent('bio_head', [0, 0, bodyLen*0.65], [Math.PI/2, 0, 0], 'cone', 
        { radius: bodyLen*0.12, height: bodyLen*0.3 }, 'NONE');

    // Beak
    // Head ends at 0.65 + 0.15 = 0.8. Place beak center at 0.85 for overlap.
    attachComponent('bio_beak', [0, 0, bodyLen*0.85], [Math.PI/2, 0, 0], 'cone',
        { radius: bodyLen*0.05, height: bodyLen*0.2 }, 'NONE');

    // Cockpit (Explicitly placed to prevent generic placement)
    attachComponent('cockpit', [0, bodyLen*0.15, bodyLen*0.4], [0, 0, 0], 'ellipsoid',
        { width: bodyLen*0.15, height: bodyLen*0.1, length: bodyLen*0.2 }, 'NONE');
        
    // Wings - Feathered Structure (Radial Pinions)
    const wingRootX = bodyLen * 0.25;
    const wingZ = 0.1;
    const featherDepth = 0.1;
    
    // Inner Feathers (Secondaries) - Attached to forearm, parallel
    const numSec = 4;
    const secWidth = (bodyLen * 0.6) / numSec;
    const secLen = bodyLen * 0.5;
    
    for(let i=0; i<numSec; i++) {
        const x = wingRootX + i * (secWidth * 0.8); // Overlap slightly
        attachComponent(`wing_feather_sec_${i}`, [x, 0, wingZ], [0, 0, -0.2], 'wedge', 
            { span: secWidth, rootChord: secLen, tipChord: secLen * 0.9, sweep: secLen * 0.1, depth: featherDepth, centered: false }, 'REFLECTIVE');
    }
    
    // Outer Feathers (Primaries/Pinions) - Attached to wrist, fanning out radially
    const wristX = wingRootX + (numSec - 1) * (secWidth * 0.8) + secWidth * 0.5;
    const numPrim = 6;
    const primLen = bodyLen * 0.7;
    
    for(let i=0; i<numPrim; i++) {
        const t = i / (numPrim - 1);
        // Fan angle: Start parallel to X, sweep back radially
        const angle = -Math.PI/2.5 * t; // 0 to ~72 degrees sweep
        
        // Position: Fan out from wrist area
        // Offset Z slightly to layer them and prevent z-fighting
        attachComponent(`wing_feather_prim_${i}`, [wristX + i*0.1, 0, wingZ - i*0.02], [0, angle, -0.2], 'wedge', 
            { span: primLen, rootChord: secLen * (0.8 - t*0.4), tipChord: secLen * 0.2, sweep: secLen * 0.4, depth: featherDepth, centered: false }, 'REFLECTIVE');
    }
        
    // Tail
    // Radial fan at rear. Rotate Y 180 to point backward (-Z). Fan out.
    const tailZ = -bodyLen * 0.5;
    const tailFanAngle = 0.15; // Tighter fan for more feathers
    const numTailFeathers = 7; // More feathers (Odd number for center)
    const tailOffset = Math.floor(numTailFeathers / 2);
    
    for(let i=-tailOffset; i<=tailOffset; i++) {
        attachComponent(`bio_tail_feather_${i}`, [0, 0, tailZ], [0, Math.PI + (i * tailFanAngle), 0], 'wedge', 
            { span: bodyLen*0.12, rootChord: bodyLen*0.9, tipChord: bodyLen*0.2, sweep: 0, depth: 0.05, centered: true }, 'NONE');
    }

    // Engines (Thighs) - Horizontal cylinders where upper legs would be
    const legX = bodyLen * 0.25;
    const legY = -bodyLen * 0.1;
    const legZ = -bodyLen * 0.15;
    
    attachComponent('engine_thigh', [legX, legY, legZ], [Math.PI/2, 0, 0], 'cylinder', 
        { radiusTop: bodyLen*0.12, radiusBottom: bodyLen*0.1, height: bodyLen*0.5 }, 'REFLECTIVE');

    // Landing Gear (Jointed Leg + Foot)
    attachComponent('gear_joint', [legX, legY - bodyLen*0.1, legZ], [0, 0, 0], 'sphere', { radius: bodyLen*0.06 }, 'REFLECTIVE');

    attachComponent('gear_shin', [legX, legY - bodyLen*0.3, legZ + bodyLen*0.1], [-0.4, 0, 0], 'cylinder', 
        { radiusTop: bodyLen*0.04, radiusBottom: bodyLen*0.03, height: bodyLen*0.4 }, 'REFLECTIVE');
        
    attachComponent('gear_foot', [legX, legY - bodyLen*0.5, legZ + bodyLen*0.2], [0, 0, 0], 'cone', 
        { radius: bodyLen*0.08, height: bodyLen*0.15, radialSegments: 3 }, 'REFLECTIVE');
};

export const generateBioFish = (context) => {
    const { spineLength, random, attachComponent } = context;
    const bodyLen = spineLength;
    
    // Body
    attachComponent('bio_body', [0, 0, 0], [0, 0, 0], 'ellipsoid', 
        { width: bodyLen*0.25, height: bodyLen*0.4, length: bodyLen }, 'NONE');
        
    // Tail Fin (Caudal) - Split into Top and Bottom lobes with Engines
    const tailZ = -bodyLen * 0.5;
    const lobeSpan = bodyLen * 0.4;
    const lobeRoot = bodyLen * 0.15;
    
    // Top Lobe
    attachComponent('bio_fin_tail_top', [0, bodyLen*0.1, tailZ], [0, 0, Math.PI/2], 'wedge', 
        { span: lobeSpan, rootChord: lobeRoot, tipChord: bodyLen*0.1, sweep: bodyLen*0.2, depth: 0.15, centered: false }, 'NONE');

    // Bottom Lobe
    attachComponent('bio_fin_tail_bottom', [0, -bodyLen*0.1, tailZ], [0, 0, -Math.PI/2], 'wedge', 
        { span: lobeSpan, rootChord: lobeRoot, tipChord: bodyLen*0.1, sweep: bodyLen*0.2, depth: 0.15, centered: false }, 'NONE');

    // Vertical Engines at Tail Base
    attachComponent('bio_engine_top', [0, bodyLen*0.15, tailZ + bodyLen*0.1], [Math.PI/2, 0, 0], 'cone',
        { radius: bodyLen*0.08, height: bodyLen*0.3 }, 'NONE');
    attachComponent('bio_engine_bottom', [0, -bodyLen*0.15, tailZ + bodyLen*0.1], [Math.PI/2, 0, 0], 'cone',
        { radius: bodyLen*0.08, height: bodyLen*0.3 }, 'NONE');
        
    // Dorsal Fin
    attachComponent('bio_fin_dorsal', [0, bodyLen*0.2, 0], [0, 0, Math.PI/2], 'wedge', 
        { span: bodyLen*0.7, rootChord: bodyLen*0.4, tipChord: bodyLen*0.1, sweep: bodyLen*0.3, depth: 0.2, centered: false }, 'NONE');
        
    // Pectoral Fins
    attachComponent('bio_fin_pectoral', [bodyLen*0.15, -bodyLen*0.1, bodyLen*0.2], [0, 0.5, -0.5], 'wedge', 
        { span: bodyLen*0.6, rootChord: bodyLen*0.25, tipChord: bodyLen*0.1, sweep: bodyLen*0.15, depth: 0.2, centered: false }, 'REFLECTIVE');
};

export const generateBioInsect = (context) => {
    const { spineLength, random, attachComponent } = context;
    const segLen = spineLength / 3;
    
    // Abdomen
    attachComponent('bio_abdomen', [0, 0, -segLen], [0, 0, 0], 'ellipsoid', 
        { width: segLen*0.9, height: segLen*0.7, length: segLen*1.5 }, 'NONE');
        
    // Thorax
    attachComponent('bio_thorax', [0, 0, segLen*0.5], [0, 0, 0], 'box', 
        { width: segLen*0.8, height: segLen*0.6, depth: segLen*0.9 }, 'NONE');
        
    // Head
    attachComponent('bio_head', [0, 0, segLen*1.3], [0, 0, 0], 'dodecahedron', 
        { radius: segLen*0.4 }, 'NONE');
    
    // Legs (3 pairs)
    for(let i=0; i<3; i++) {
        const z = segLen*0.2 + (i * 0.4);
        // Angled legs
        const angle = -0.5 + (i * 0.2); // Fan out slightly
        attachComponent(`bio_leg_${i}`, [segLen*0.5, -0.2, z], [0, angle, -0.8], 'cylinder', 
            { radiusTop: 0.1, radiusBottom: 0.05, height: segLen*1.5 }, 'REFLECTIVE');
    }
    
    // Wings (Beetle shell style or transparent)
    if (random() > 0.5) {
        // Elytra (Shell)
        attachComponent('bio_elytra', [segLen*0.3, 0.4, -segLen*0.2], [0.1, 0, -0.1], 'ellipsoid', 
            { width: segLen*0.5, height: 0.1, length: segLen*1.4 }, 'REFLECTIVE');
    } else {
        // Membranous Wings
        attachComponent('bio_wing', [segLen*0.4, 0.4, segLen*0.5], [0, 0.3, -0.1], 'wedge', 
            { span: segLen*1.5, rootChord: segLen*0.5, tipChord: segLen*0.2, sweep: segLen*0.2, depth: 0.05, centered: false }, 'REFLECTIVE');
    }
};

export const generateBioCephalopod = (context) => {
    const { spineLength, random, attachComponent } = context;
    const headLen = spineLength * 0.5;
    
    // Orientation: Mantle First (Flying towards +Z)
    // Mantle (Body) - At the front
    // Slimmed down: width 0.5, height 0.4
    attachComponent('bio_mantle', [0, 0, headLen*0.5], [0, 0, 0], 'ellipsoid', 
        { width: headLen*0.5, height: headLen*0.4, length: headLen }, 'NONE');
    
    // Head (Connection point for tentacles/eyes) - At the rear of the mantle
    // Positioned slightly behind the center of the ship (which is roughly 0)
    const headPos = -headLen * 0.1;
    attachComponent('bio_head', [0, 0, headPos], [0, 0, 0], 'sphere', 
        { radius: headLen*0.3 }, 'NONE');

    // Eyes - On the Head
    attachComponent('bio_eye', [headLen*0.2, 0, headPos + headLen*0.1], [0, 0, 0], 'sphere', 
        { radius: headLen*0.12 }, 'REFLECTIVE');

    // Cockpit - Between Eyes (on the Head)
    // Since it flies Mantle first, this is a rear-view or top-view cockpit
    attachComponent('cockpit', [0, headLen*0.25, headPos + headLen*0.1], [0, 0, 0], 'ellipsoid', 
        { width: headLen*0.2, height: headLen*0.2, length: headLen*0.25 }, 'NONE');

    // Fins (Wings) on Mantle - Stabilizers
    const finSpan = headLen * 0.6;
    const finZ = headLen * 0.5; // On the mantle
    attachComponent('bio_fin', [headLen*0.25, 0, finZ], [0, 0, -0.3], 'wedge', 
        { span: finSpan, rootChord: headLen*0.5, tipChord: headLen*0.1, sweep: headLen*0.3, depth: 0.1, centered: false }, 'REFLECTIVE');

    // Tentacles - Trailing behind (Pointing -Z)
    const numTentacles = 8;
    const tentacleLen = spineLength * 0.8;
    const segments = 5;
    const segLen = tentacleLen / segments;
    
    for(let i=0; i<numTentacles; i++) {
        const angle = (i / numTentacles) * Math.PI * 2;
        const startR = headLen * 0.15;
        // Start at the back of the head
        let currPos = new THREE.Vector3(Math.cos(angle)*startR, Math.sin(angle)*startR, headPos - headLen*0.15);
        
        // Initial direction: Backward (-Z) and splayed
        let dir = new THREE.Vector3(Math.cos(angle)*0.5, Math.sin(angle)*0.5, -1.5).normalize();
        let r = headLen * 0.08;
        
        for(let s=0; s<segments; s++) {
            // Curve: Spiral slightly and wave
            const curveAngle = angle + s * 0.3;
            const curveDir = new THREE.Vector3(Math.cos(curveAngle), Math.sin(curveAngle), 0).multiplyScalar(0.3);
            dir.add(curveDir).normalize();
            
            const nextPos = currPos.clone().add(dir.clone().multiplyScalar(segLen));
            const midPos = currPos.clone().add(nextPos).multiplyScalar(0.5);
            
            // Orient cylinder to follow the curve
            const dummy = new THREE.Object3D();
            dummy.position.copy(midPos);
            dummy.lookAt(nextPos);
            dummy.rotateX(Math.PI/2);
            
            attachComponent(`bio_tentacle_${i}_seg_${s}`, [midPos.x, midPos.y, midPos.z], [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z], 'cylinder', 
                { radiusTop: r, radiusBottom: r*0.8, height: segLen }, 'NONE');
            
            currPos = nextPos;
            r *= 0.85;
        }
    }
};