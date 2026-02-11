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
    const maxComponents = 60; // Hard limit to prevent performance issues
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

                    // Add a connector strut for non-box shapes to ensure visual connectivity
                    if (shapeType !== 'box') {
                        const midPos = [
                            (node.pos[0] + newPos[0]) / 2,
                            (node.pos[1] + newPos[1]) / 2,
                            (node.pos[2] + newPos[2]) / 2
                        ];
                        
                        // Align strut with direction
                        let strutRot = [0,0,0];
                        if (d[0] !== 0) strutRot = [0, 0, Math.PI/2]; // X-axis
                        else if (d[2] !== 0) strutRot = [Math.PI/2, 0, 0]; // Z-axis
                        
                        attachComponent(`fractal_strut_${i}_${count}`, midPos, strutRot, 'cylinder', 
                            {radiusTop: childRadius * 0.4, radiusBottom: childRadius * 0.4, height: offset}, 'NONE');
                    }

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