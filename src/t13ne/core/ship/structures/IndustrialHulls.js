import * as THREE from 'three';

export const generateFreighter = (context) => {
    const { spineLength, random, attachComponent, wiringGenerator, explicitWiring, components } = context;
    
    // Freighter: Long central spine with cargo pods attached
    const trussLen = spineLength * 1.5;
    // Central Truss
    attachComponent('fuselage_spine', [0, 0, 0], [Math.PI/2, 0, 0], 'box', 
        {width: 1.5, height: trussLen, depth: 1.5}, 'NONE');
    
    // Engine Block at rear - Overlap by 0.5 to ensure solid connection
    attachComponent('engine_block', [0, 0, -trussLen/2 - 1.5 + 0.5], [0, 0, 0], 'box', 
        {width: 5, height: 4, depth: 3}, 'NONE');
    
    // Connect Engine to Spine
    const spineId = components[components.length - 2].id;
    const engineId = components[components.length - 1].id;
    wiringGenerator.addConnection(explicitWiring, engineId, spineId, 'power', 2.0);

    // Bridge Block at front (or top front)
    // Overhang the front: trussLen/2 is the end. Place center slightly past it.
    attachComponent('bridge_block', [0, 1.5, trussLen/2 + 1.0], [0, 0, 0], 'box', 
        {width: 3, height: 2, depth: 4}, 'NONE');
    
    // Connect Bridge to Spine
    const bridgeId = components[components.length - 1].id;
    wiringGenerator.addConnection(explicitWiring, bridgeId, spineId, 'data', 2.0);

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
};

export const generateHorseshoe = (context) => {
    const { spineLength, random, attachComponent, wiringGenerator, explicitWiring, components } = context;
    
    // Asymmetrical Curve (Alien Juggernaut style)
    const curveRadius = spineLength * 0.8;
    const segments = 6 + Math.floor(random() * 4);
    const angleSpan = Math.PI * 1.2; // > 180 degrees
    const angleStep = angleSpan / segments;
    
    let prevId = null;
    let currentWidth = 2.5 + random();

    for(let i=0; i<segments; i++) {
        // Calculate start and end points of the segment on the curve
        const angle0 = -angleSpan/2 + (i * angleStep);
        const angle1 = -angleSpan/2 + ((i + 1) * angleStep);
        
        const p0 = new THREE.Vector3(Math.cos(angle0) * curveRadius, 0, Math.sin(angle0) * curveRadius);
        const p1 = new THREE.Vector3(Math.cos(angle1) * curveRadius, 0, Math.sin(angle1) * curveRadius);
        
        const center = new THREE.Vector3().addVectors(p0, p1).multiplyScalar(0.5);
        const len = p0.distanceTo(p1);
        const nextWidth = 2.5 + random();

        // Orient cylinder to point from p0 to p1
        const dummy = new THREE.Object3D();
        dummy.position.copy(center);
        dummy.lookAt(p1);
        dummy.rotateX(Math.PI / 2); // Align Y-cylinder to Z-lookAt
        const rot = [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];

        attachComponent('fuselage_arc', [center.x, 0, center.z], rot, 'cylinder', 
            {radiusTop: nextWidth/2, radiusBottom: currentWidth/2, height: len, radialSegments: 8}, 'NONE');
        
        currentWidth = nextWidth;
        
        const currentId = components[components.length - 1].id;
        if (prevId) {
            wiringGenerator.addConnection(explicitWiring, currentId, prevId, 'structural', 2.0);
        }
        prevId = currentId;
    }
};

export const generateBlob = (context) => {
    const { spineLength, random, attachComponent } = context;
    
    // Millennium Falcon style: Main hull + Mandibles + Offset Cockpit
    const mainRadius = spineLength * 0.6;
    const mainHeight = 2.5;

    // Main Body
    attachComponent('fuselage_main', [0, 0, 0], [0, 0, 0], 'cylinder',
        { radiusTop: mainRadius, radiusBottom: mainRadius, height: mainHeight, radialSegments: 32 }, 'NONE');

    // Mandibles (Front) - Tapered
    const mandLen = mainRadius * 0.85; // Shorter than radius
    const mandWidth = mainRadius * 0.4;
    const mandOffset = mainRadius * 0.4; // Slightly wider stance
    const mandHeight = mainHeight; // Match saucer thickness

    // Tapered Mandibles (Prism) - 4 segments (Diamond profile)
    // Rotate X 90 to lay flat.
    // radiusTop is Front (narrower), radiusBottom is Back (wider).
    const mFrontW = mandWidth * 0.6;
    const mBackW = mandWidth;
    const zFront = mainRadius * 0.8; // Embed slightly

    // Add two mandibles manually since we might be in ASYMMETRICAL mode globally
    attachComponent('mandible_L', [-mandOffset, 0, zFront + mandLen / 2], [Math.PI / 2, 0, 0], 'prism',
        { radiusTop: mFrontW / 2, radiusBottom: mBackW / 2, height: mandLen, segments: 4 }, 'NONE');
    attachComponent('mandible_R', [mandOffset, 0, zFront + mandLen / 2], [Math.PI / 2, 0, 0], 'prism',
        { radiusTop: mFrontW / 2, radiusBottom: mBackW / 2, height: mandLen, segments: 4 }, 'NONE');

    // Engine Strip (Rear) - Carve and Thrusters
    // Carve out the back
    const carveDepth = mainRadius * 0.2;
    attachComponent('carve_engine_strip', [0, 0, -mainRadius], [0, 0, 0], 'box',
        { width: mainRadius * 1.5, height: mainHeight * 1.1, depth: carveDepth }, 'NONE');

    // Add Thrusters in the gap
    const numThrusters = 8;
    const stripW = mainRadius * 1.2;
    const step = stripW / (numThrusters - 1);
    const startX = -stripW / 2;

    for (let i = 0; i < numThrusters; i++) {
        const tx = startX + i * step;
        attachComponent(`thruster_strip_${i}`, [tx, 0, -mainRadius + carveDepth * 0.5], [Math.PI / 2, 0, 0], 'cylinder',
            { radiusTop: 0.25, radiusBottom: 0.4, height: 0.8 }, 'NONE');
    }

    // Cockpit (Side Offset) - Replaces generic cockpit logic
    const cockpitSide = random() > 0.5 ? 1 : -1;
    
    // Angle: 30 to 60 degrees forward from lateral (X axis)
    const angleDeg = 30 + random() * 30;
    const angleRad = angleDeg * (Math.PI / 180);
    
    const strutLen = mainRadius * 0.8;
    const strutRadius = mainHeight * 0.35;
    
    const dirX = Math.cos(angleRad) * cockpitSide;
    const dirZ = Math.sin(angleRad);
    
    const startX = dirX * mainRadius * 0.6;
    const startZ = dirZ * mainRadius * 0.6;
    const endX = startX + dirX * strutLen;
    const endZ = startZ + dirZ * strutLen;
    const strutPos = [(startX + endX)/2, 0, (startZ + endZ)/2];
    
    // Align strut cylinder to vector
    const rotY = Math.atan2(dirX, dirZ);
    attachComponent('cockpit_strut', strutPos, [Math.PI/2, rotY, 0], 'cylinder', 
        { radiusTop: strutRadius, radiusBottom: strutRadius, height: strutLen }, 'NONE');
    
    // Cockpit Capsule - Pointing Forward (+Z)
    attachComponent('cockpit', [endX, 0, endZ], [Math.PI/2, 0, 0], 'capsule', 
        { radius: strutRadius * 1.2, length: strutRadius * 4.0 }, 'NONE');

    return { cockpitPlaced: true };
};

export const generateCatamaran = (context) => {
    const { size, random, attachComponent } = context;

    // Star Trek Style Nacelle Ship (Constitution / Miranda / Voyager)
    // 1. Primary Hull (Saucer)
    const saucerRadius = (size === 'small' ? 4 : (size === 'medium' ? 6 : 9));
    const saucerHeight = Math.max(1.0, saucerRadius * 0.2);

    // Smoother saucer shape with a central cylinder
    const midHeight = saucerHeight * (0.3 + random() * 0.3); // 30-60% of total height
    const taperHeight = (saucerHeight - midHeight) / 2;

    // Central Cylinder
    attachComponent('fuselage_saucer_mid', [0, 0, 0], [0, 0, 0], 'cylinder',
        { radiusTop: saucerRadius, radiusBottom: saucerRadius, height: midHeight, radialSegments: 32 }, 'NONE');
    // Top Taper
    attachComponent('fuselage_saucer_top', [0, midHeight / 2 + taperHeight / 2, 0], [0, 0, 0], 'cylinder',
        { radiusTop: saucerRadius * 0.4, radiusBottom: saucerRadius, height: taperHeight, radialSegments: 32 }, 'NONE');
    // Bottom Taper
    attachComponent('fuselage_saucer_bottom', [0, -midHeight / 2 - taperHeight / 2, 0], [0, 0, 0], 'cylinder',
        { radiusTop: saucerRadius, radiusBottom: saucerRadius * 0.4, height: taperHeight, radialSegments: 32 }, 'NONE');

    // Add a bridge so it gets a cockpit greeble
    attachComponent('bridge', [0, saucerHeight / 2, 0], [0, 0, 0], 'cylinder',
        { radiusTop: saucerRadius * 0.1, radiusBottom: saucerRadius * 0.2, height: saucerHeight * 0.4, radialSegments: 8 }, 'NONE');

    // 2. Configuration
    const configType = random(); // 0-0.3: Miranda-ish, 0.3-1.0: Constitution/Voyager-ish
    let hasEngineering = configType > 0.3;

    let engPos = [0, 0, 0];
    let engRadius = saucerRadius * 0.4;
    let engLen = saucerRadius * 1.5;

    if (hasEngineering) {
        const neckLen = saucerRadius * 1.0;

        // Neck (Vertical or Angled)
        const neckPos = [0, -saucerHeight / 2 - neckLen / 2, -saucerRadius * 0.3];
        attachComponent('fuselage_neck', neckPos, [0.3, 0, 0], 'box', // Angled forward slightly
            { width: engRadius * 0.8, height: neckLen, depth: engRadius * 1.5 }, 'NONE');

        // Secondary (Engineering) Hull - position shifted back to connect neck at front
        const secondaryHullZ = -saucerRadius * 0.3 - engLen / 2;
        engPos = [0, -saucerHeight / 2 - neckLen, secondaryHullZ];
        // Use non-tapered cylinder and rename to avoid engine greebles
        attachComponent('fuselage_secondary', engPos, [Math.PI / 2, 0, 0], 'cylinder',
            { radiusTop: engRadius, radiusBottom: engRadius, height: engLen, radialSegments: 12 }, 'NONE');

        // Deflector Dish
        attachComponent('deflector_dish', [engPos[0], engPos[1], engPos[2] + engLen / 2 + 0.1], [Math.PI / 2, 0, 0], 'cylinder',
            { radiusTop: engRadius * 0.8, radiusBottom: 0, height: 0.5 }, 'NONE');

        // Pylons and Nacelles
        const nacelleLen = engLen * 1.1;
        const nacelleRadius = engRadius * 0.5;
        
        // Nacelle Position: Higher than saucer
        const nacelleY = saucerHeight * 1.5;
        const nacelleX = saucerRadius * 0.9;
        const nacelleZ = -saucerRadius * 0.5;

        // Pylon attachment point on engineering hull
        const pylonStart = new THREE.Vector3(engRadius, engPos[1], engPos[2] + engLen * 0.2);
        
        // Pylon End: Attach about 1/3 along the nacelle length from the front
        const attachZ = nacelleZ + nacelleLen/2 - (nacelleLen / 3);
        const pylonEnd = new THREE.Vector3(nacelleX, nacelleY, attachZ);
        
        const pylonCenter = new THREE.Vector3().addVectors(pylonStart, pylonEnd).multiplyScalar(0.5);
        const pylonActualLen = pylonStart.distanceTo(pylonEnd);
        const pylonDummy = new THREE.Object3D();
        pylonDummy.position.copy(pylonCenter);
        pylonDummy.lookAt(pylonEnd);
        pylonDummy.rotateX(Math.PI / 2);
        const pylonRot = [pylonDummy.rotation.x, pylonDummy.rotation.y, pylonDummy.rotation.z];
        attachComponent('pylon', [pylonCenter.x, pylonCenter.y, pylonCenter.z], pylonRot, 'box', { width: 0.3, height: pylonActualLen, depth: engRadius * 0.6 }, 'REFLECTIVE');

        // Nacelle - Renamed to warp_nacelle to avoid thrusters
        attachComponent('warp_nacelle', [nacelleX, nacelleY, nacelleZ], [Math.PI / 2, 0, 0], 'cylinder',
            { radiusTop: nacelleRadius, radiusBottom: nacelleRadius, height: nacelleLen }, 'REFLECTIVE');
    }

    return { saucerRadius, saucerHeight, hasEngineering, engPos, engRadius, engLen };
};

export const generateYFork = (context) => {
    const { spineLength, symmetryType, attachComponent } = context;
    
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
    const symMode = symmetryType === 'ASYMMETRICAL' ? 'REFLECTIVE' : symmetryType;
    
    attachComponent('fuselage_prong', [x, 0, z], [Math.PI/2, 0, -spreadAngle], 'cylinder', 
        {radiusTop: 1.2, radiusBottom: 0.8, height: prongLen}, symMode);
};

export const generateBattlestar = (context) => {
    const { spineLength, random, attachComponent } = context;

    // Battlestar: Nose + Engine Block + Parallel Spines (Ribs) + Outriggers (Flight Pods)
    const totalLen = spineLength * 1.8;
    const noseLen = totalLen * 0.25;
    const engineLen = totalLen * 0.25;
    const spineSectionLen = totalLen * 0.5;
    
    // 1. Nose Section
    const noseZ = spineSectionLen / 2 + noseLen / 2 - 0.5; // Embed
    attachComponent('nose_block', [0, 0, noseZ], [0, 0, 0], 'wedge', 
        { span: 4, rootChord: noseLen, tipChord: 1, depth: 2, centered: true }, 'NONE');
    
    // 2. Engine Section
    const engineZ = -spineSectionLen / 2 - engineLen / 2 + 0.5; // Embed
    attachComponent('engine_block', [0, 0, engineZ], [0, 0, 0], 'box', 
        { width: 6, height: 3, depth: engineLen }, 'NONE');

    // 3. Parallel Spines
    const numSpines = 2 + Math.floor(random() * 3) * 2; // 2, 4, 6 (always pairs for symmetry)
    const spineOffset = 1.5 + random(); // Distance from center X
    
    const sideSpines = numSpines / 2;
    
    for (let s = 0; s < sideSpines; s++) {
        const yOffset = (s - (sideSpines - 1) / 2) * 1.5; // Stack vertically if multiple
        const xPos = spineOffset;
        
        // Segmented Spine
        const segments = 5 + Math.floor(random() * 5);
        const segLen = spineSectionLen / segments;
        
        for (let i = 0; i < segments; i++) {
            const z = -spineSectionLen / 2 + segLen * i + segLen / 2;
            
            // Vary shape
            const shapeType = random() > 0.5 ? 'prism' : 'box';
            const width = 1.0 + random() * 0.8;
            const height = 1.0 + random() * 0.8;
            
            // Prisms change segments often
            const prismSegs = 3 + Math.floor(random() * 4);
            
            const id = `spine_${s}_seg_${i}`;
            
            if (shapeType === 'prism') {
                attachComponent(id, [xPos, yOffset, z], [Math.PI/2, 0, 0], 'prism', 
                    { radius: width/2, height: segLen, segments: prismSegs }, 'REFLECTIVE');
            } else {
                attachComponent(id, [xPos, yOffset, z], [0, 0, 0], 'box', 
                    { width: width, height: height, depth: segLen }, 'REFLECTIVE');
            }
        }
    }
    
    // 4. Outriggers (Flight Pods)
    // Attached to the spines on the outside
    const podLen = spineSectionLen * 0.8;
    const podWidth = 2.0;
    const podDepth = 1.0;
    const podX = spineOffset + 2.5;
    
    attachComponent('flight_pod', [podX, 0, 0], [0, 0, 0], 'box', 
        { width: podWidth, height: podDepth, depth: podLen }, 'REFLECTIVE');
        
    // Struts connecting Pod to Spine
    const numStruts = 3;
    for(let i=0; i<numStruts; i++) {
        const z = -podLen/2 + (podLen/(numStruts-1)) * i;
        attachComponent(`pod_strut_${i}`, [spineOffset + 1.0, 0, z], [0, 0, Math.PI/2], 'cylinder', 
            { radiusTop: 0.4, radiusBottom: 0.4, height: 2.0 }, 'REFLECTIVE');
    }
};
