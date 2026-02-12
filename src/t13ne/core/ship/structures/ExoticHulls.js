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
    const { spineLength, radialCount, random, attachComponent } = context;
    
    // Liberator / Gothic Cathedral: Rear Hub + Forward Spikes
    // 2, 3, or 4 way symmetry (Radial)
    
    const hubRadius = spineLength * 0.25;
    
    // 1. Rear Hub (Engine/Power section)
    attachComponent('hub_core', [0, 0, -spineLength * 0.4], [0, 0, 0], 'dodecahedron', 
        { radius: hubRadius }, 'NONE');
        
    // 2. Forward Spikes (The "Cathedral Spires")
    // These extend from the hub forward.
    const spikeLen = spineLength * 1.2;
    const spikeOffset = hubRadius * 0.8;
    
    const zStart = -spineLength * 0.3;
    const zEnd = spineLength * 0.7;
    const len = zEnd - zStart;
    
    // Segmented Spire for "Gothic" look (tapering, ridges)
    const segments = 6;
    const segLen = len / segments;
    
    for(let i=0; i<segments; i++) {
        const z = zStart + i * segLen + segLen/2;
        const progress = i / segments;
        
        // Tapering profile: Wide at base, thin at tip, maybe bulging in middle
        const r = (1 - progress) * 1.5 + 0.5; 
        
        // Gothic details: Use Prism with 4 or 8 sides for "blocky" look
        attachComponent(`spire_seg_${i}`, [spikeOffset, 0, z], [Math.PI/2, 0, 0], 'prism', 
            { radius: r, height: segLen, segments: 4 }, 'RADIAL');
            
        // "Flying Buttress" / Strut connecting to center axis?
        // Or spikes on the spire
        if (i % 2 === 0 && i < segments - 1) {
             attachComponent(`spire_detail_${i}`, [spikeOffset * 1.5, 0, z], [0, 0, 0], 'cone', 
                { radius: 0.3, height: 1.0 }, 'RADIAL');
        }
    }
    
    // 3. Central Spire (Optional, for Cathedral look)
    if (random() > 0.3) {
        attachComponent('central_spire', [0, 0, 0], [Math.PI/2, 0, 0], 'cylinder', 
            { radiusTop: 0.2, radiusBottom: 0.8, height: spineLength }, 'NONE');
    }
};

export const generateBioBird = (context) => {
    const { spineLength, random, attachComponent } = context;
    const bodyLen = spineLength;
    
    // Body
    attachComponent('bio_body', [0, 0, 0], [0, 0, 0], 'ellipsoid', 
        { width: bodyLen*0.4, height: bodyLen*0.3, length: bodyLen }, 'NONE');
    
    // Head
    attachComponent('bio_head', [0, bodyLen*0.1, bodyLen*0.55], [0, 0, 0], 'cone', 
        { radius: bodyLen*0.15, height: bodyLen*0.3 }, 'NONE');
        
    // Wings
    const wingSpan = bodyLen * 1.5;
    attachComponent('bio_wing', [bodyLen*0.25, 0, 0.1], [0, 0, -0.2], 'wedge', 
        { span: wingSpan/2, rootChord: bodyLen*0.5, tipChord: bodyLen*0.2, sweep: bodyLen*0.3, depth: 0.15, centered: false }, 'REFLECTIVE');
        
    // Tail
    attachComponent('bio_tail', [0, 0.1, -bodyLen*0.5], [0.2, 0, 0], 'wedge', 
        { span: bodyLen*0.4, rootChord: bodyLen*0.3, tipChord: bodyLen*0.6, sweep: -bodyLen*0.1, depth: 0.1, centered: true }, 'NONE');

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
        
    // Tail Fin (Caudal)
    attachComponent('bio_fin_tail', [0, 0, -bodyLen*0.55], [Math.PI/2, 0, 0], 'wedge', 
        { span: bodyLen*0.9, rootChord: bodyLen*0.15, tipChord: bodyLen*0.5, sweep: -bodyLen*0.1, depth: 0.2, centered: true }, 'NONE');
        
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