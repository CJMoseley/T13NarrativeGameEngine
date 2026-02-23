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
    const iterations = 2;
    const maxComponents = 20; // Hard limit to prevent performance issues
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
    const { spineLength, attachComponent, radialCount } = context;
    
    // Liberator (DSV2) - Tri-radial, Hex Hull, Rear Sphere, 3 Nacelles
    // Scale factor: spineLength is roughly the total length.
    // User spec: Spine (Hub to Sphere) is 3.5x engine spread.
    // Let's normalize units so the ship looks proportional.
    // If Hub Width is 1.0 (S), Pod is 0.6S, Length 3.0S.
    // We define S based on spineLength to fit the 3.5x ratio.
    // If Spread is ~3S, Spine is ~10.5S. Total ~12S.
    const S = spineLength / 12; 

    // --- 4. Pylons & Pods Setup ---
    const numPods = radialCount || 3;

    // --- 1. Central Hub (The "Zen" Core) ---
    // Hexagonal (or Octagonal/Decagonal) Drum based on pod count.
    // Width 1.0 * S. Radius = 0.5 * S.
    const hubRad = 0.5 * S;
    const hubLen = 0.8 * S; // Depth
    const hubZ = 0;
    const hubSegs = numPods * 2;
    
    // Rotate so flat faces align with the radial angles (0, 120, 240 for 3 pods)
    // For a hexagon (6 segs), vertices are at 0, 60... Face centers at 30, 90...
    // We want a face at 0. Rotate -30 deg (-PI/6).
    const hubRot = [Math.PI/2, 0, -Math.PI/hubSegs];
    
    attachComponent('hull_hex_hub', [0, 0, hubZ], hubRot, 'prism', 
        { radius: hubRad, height: hubLen, segments: hubSegs }, 'NONE', false, null, { color: 0xdaa520 }); // Gold/Brass

    // Flight Deck Notch (Recessed slit on forward face)
    const bridgeRad = hubRad * 0.95;
    const bridgeZ = hubZ + hubLen/2 - 0.05 * S;
    attachComponent('bridge_slit_hex', [0, 0, bridgeZ], hubRot, 'prism',
        { radius: bridgeRad, height: 0.1 * S, segments: hubSegs }, 'NONE', false, null, { color: 0x111111 });

    // --- 2. The Spine ---
    // Tapered needle. Widest at Hub (100%), 40% at tip.
    // Thickness at Hub = S / 2.5 = 0.4 * S. Radius = 0.2 * S.
    const spineRadBase = 0.2 * S;
    const spineRadTip = spineRadBase * 0.4;
    const spineLen = 10.5 * S; // 3.5x Spread (approx 3S)
    const spineZ = -hubLen/2 - spineLen/2;
    
    attachComponent('fuselage_tapered_spine', [0, 0, spineZ], [Math.PI/2, 0, 0], 'cylinder', 
        { radiusTop: spineRadBase, radiusBottom: spineRadTip, height: spineLen }, 'NONE', false, null, { color: 0xffffff }); // White

    // Longitudinal Vanes (12 raised ribs)
    const numVanes = 12;
    const vaneLen = spineLen * 0.95;
    const vaneZ = spineZ;
    for(let i=0; i<numVanes; i++) {
        const angle = (Math.PI * 2 / numVanes) * i;
        const avgRad = (spineRadBase + spineRadTip) / 2;
        // Position on surface (approximate for tapered cylinder)
        const vx = Math.cos(angle) * avgRad;
        const vy = Math.sin(angle) * avgRad;
        // Rotate to align with radial
        attachComponent(`spine_vane_${i}`, [vx, vy, vaneZ], [0, 0, angle + Math.PI/2], 'box',
            { width: vaneLen, height: 0.02 * S, depth: avgRad * 0.4 }, 'NONE', false, null, { color: 0xffffff });
    }

    // --- 3. Aft Sphere (Power Source) ---
    const sphereRad = 0.6 * S; // Proportional to pod width
    const sphereZ = (spineZ - spineLen/2) - sphereRad * 0.8; // Overlap
    
    attachComponent('reactor_sphere', [0, 0, sphereZ], [0, 0, 0], 'sphere', 
        { radius: sphereRad }, 'NONE', false, null, { color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });

    // Cradle (3 tiny claw-like structures)
    for(let i=0; i<3; i++) {
        const angle = (Math.PI * 2 / 3) * i;
        const clawLen = sphereRad * 1.5;
        const clawOffset = sphereRad * 0.9;
        const cx = Math.cos(angle) * clawOffset;
        const cy = Math.sin(angle) * clawOffset;
        
        // Rotate to cup the sphere
        // Position relative to sphere center
        attachComponent(`sphere_cradle_${i}`, [cx, cy, sphereZ], [0.5, 0, angle - Math.PI/2], 'box',
            { width: 0.1 * S, height: clawLen, depth: 0.2 * S }, 'NONE', false, null, { color: 0xdaa520 });
    }

    // --- 4. Pylons & Pods ---
    const podYDist = 1.5 * S; // Radial distance
    const podZ = 1.0 * S; // Forward of Hub
    
    for(let i=0; i<numPods; i++) {
        const angle = (Math.PI * 2 / numPods) * i;
        
        // Pod Position
        const px = Math.cos(angle) * podYDist;
        const py = Math.sin(angle) * podYDist;
        
        // Pod Orientation: Parallel to Z
        const podRot = [Math.PI/2, 0, 0];
        
        // --- Pod Geometry ---
        // Dimensions: Width 0.6S (Radius 0.3S), Length 3.0S.
        const podRad = 0.3 * S;
        const podMainLen = 1.5 * S; // Main body length
        
        attachComponent(`nacelle_pod_main_${i}`, [px, py, pz], podRot, 'capsule', 
            { radius: podRad, length: podMainLen }, 'NONE', false, null, { color: 0xffffee });
            
        // Stage 1: Nose (Green Glass Frustum)
        const noseLen = 0.75 * S;
        const noseZ = podZ + 0.75 * S + noseLen/2; // Attach to front of main body
        attachComponent(`pod_nose_${i}`, [px, py, noseZ], podRot, 'cylinder', 
            { radiusTop: podRad * 0.5, radiusBottom: podRad, height: noseLen }, 'NONE', false, null, { color: 0x00ff00, opacity: 0.6, transparent: true });
            
        // Stage 3: Tail (Dark Taper)
        const tailLen = 0.75 * S;
        const tailZ = podZ - 0.75 * S - tailLen/2; // Attach to rear
        attachComponent(`nacelle_pod_tail_${i}`, [px, py, tailZ], [Math.PI/2, 0, 0], 'cylinder', 
            { radiusTop: podRad, radiusBottom: podRad * 0.3, height: tailLen }, 'NONE', false, null, { color: 0x222222 });

        // --- Pylon ---
        // Connects Hub Face to Pod. 
        // Pylon Base: Hub Face (Apothem).
        const pBaseRad = hubRad * Math.cos(Math.PI/hubSegs);
        const pBaseX = Math.cos(angle) * pBaseRad;
        const pBaseY = Math.sin(angle) * pBaseRad;
        const pBaseZ = hubZ;
        
        // Pylon Tip: "Straddles" the pod. "Melts" into pod 2/3rds back.
        // Pod Z range: TailEnd (-1.5S) to NoseTip (+2.25S). Total ~3.75S.
        // 2/3rds back from nose is roughly Z = 0.
        // "Pods sit inboard" -> Pylon tip is further out than pod center.
        const pTipDist = podYDist + 0.2 * S;
        const pTipX = Math.cos(angle) * pTipDist;
        const pTipY = Math.sin(angle) * pTipDist;
        const pTipZ = 0.5 * S; // Forward sweep target
        
        // Calculate Midpoint and Length
        const pMidX = (pBaseX + pTipX) / 2;
        const pMidY = (pBaseY + pTipY) / 2;
        const pMidZ = (pBaseZ + pTipZ) / 2;
        const pLen = Math.sqrt((pTipX-pBaseX)**2 + (pTipY-pBaseY)**2 + (pTipZ-pBaseZ)**2);
        
        // Orientation: Look from Base to Tip
        const dummy = new THREE.Object3D();
        dummy.position.set(pBaseX, pBaseY, pBaseZ);
        dummy.lookAt(pTipX, pTipY, pTipZ);
        
        // Create Pylon (Thin tapered blade)
        // We use a box, scaled to be thin in thickness (local Y) and wide in chord (local X/Z?)
        // Box default: Width=X, Height=Y, Depth=Z.
        // We want Length along Z (pLen). Thickness along local Y? Chord along local X?
        // "Thin, tapered blade".
        attachComponent(`pylon_swept_${i}`, [pMidX, pMidY, pMidZ], [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z], 'box', 
            { width: 0.1 * S, height: 0.4 * S, depth: pLen }, 'NONE', false, null, { color: 0xdaa520 });
    }
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