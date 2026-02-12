import * as THREE from 'three';

export const generateFreighter = (context) => {
    const { spineLength, random, attachComponent, wiringGenerator, explicitWiring, components, getSurfacePoint } = context;
    
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
        
        // Raycast to find attachment point on spine to ensure pods don't float
        let podX = 2.05; // Default fallback: Spine Radius (0.75) + Pod HalfWidth (1.5) - Overlap (0.2)
        if (getSurfacePoint) {
             const hit = getSurfacePoint(components, [20, 0, z], [-1, 0, 0], 'fuselage_spine');
             if (hit) {
                 podX = hit.x + 1.5 - 0.2; // Width 3.0/2 = 1.5. Overlap 0.2.
             }
        }

        // Side containers (Reflective symmetry handles the other side)
        attachComponent('cargo_pod', [podX, 0, z], [0, 0, 0], 'box', 
            {width: 3.0, height: 2.5, depth: 2.8}, 'REFLECTIVE');
        
        // Occasional Vertical Container
        if (random() > 0.6) {
                // Spine top is at Y=0.75 (Depth 1.5 / 2). Pod Height 2.0.
                // Center should be 0.75 + 1.0 - 0.2 = 1.55 to ensure overlap
                attachComponent('cargo_pod_top', [0, 1.55, z], [0, 0, 0], 'box', 
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
    const { spineLength, random, attachComponent, components, getSurfacePoint } = context;
    
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
    
    // Angle: 30 to 60 degrees swept back from lateral (X axis) as requested
    const angleDeg = 30 + random() * 30; 
    const angleRad = angleDeg * (Math.PI / 180);
    
    const corridorLen = mainRadius * 0.8;
    const corridorRadius = mainHeight * 0.25;
    
    const dirX = Math.cos(angleRad) * cockpitSide;
    const dirZ = -Math.sin(angleRad); // Negative Z for swept back look (_/)
    
    let cockpitStartX = dirX * mainRadius * 0.6;
    let startZ = dirZ * mainRadius * 0.6;

    // Raycast for better attachment if available
    if (getSurfacePoint) {
        const rayOrigin = [dirX * 20, 0, dirZ * 20];
        const rayDir = [-dirX, 0, -dirZ];
        const hit = getSurfacePoint(components, rayOrigin, rayDir, 'fuselage_main');
        if (hit) {
             // Embed 0.5 units into the hull
             const embed = new THREE.Vector3(dirX, 0, dirZ).multiplyScalar(0.5);
             cockpitStartX = hit.x - embed.x;
             startZ = hit.z - embed.z;
        }
    }

    const endX = cockpitStartX + dirX * corridorLen;
    const endZ = startZ + dirZ * corridorLen;
    const corridorPos = [(cockpitStartX + endX)/2, 0, (startZ + endZ)/2];
    
    // Align corridor cylinder to vector
    const rotY = Math.atan2(dirX, dirZ);
    attachComponent('cockpit_corridor', corridorPos, [Math.PI/2, rotY, 0], 'cylinder', 
        { radiusTop: corridorRadius, radiusBottom: corridorRadius, height: corridorLen }, 'NONE');
    
    // Cockpit Capsule - Pointing Forward (+Z)
    attachComponent('cockpit', [endX, 0, endZ], [Math.PI/2, 0, 0], 'capsule', 
        { radius: corridorRadius * 1.2, length: corridorRadius * 3.0 }, 'NONE');

    return { cockpitPlaced: true };
};

export const generateCatamaran = (context) => {
    const { size, random, attachComponent } = context;

    // Star Trek Style Nacelle Ship (Constitution / Miranda / Voyager)
    // 1. Primary Hull (Saucer)
    const saucerRadius = (size === 'small' ? 4 : (size === 'medium' ? 6 : 9));
    const saucerHeight = Math.max(1.5, saucerRadius * 0.25); // Thicker to allow embedding

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
        const neckLen = saucerRadius * 0.5; // Shorter neck

        // Neck (Vertical or Angled)
        const neckPos = [0, -saucerHeight / 2 - neckLen / 2, -saucerRadius * 0.3];
        attachComponent('fuselage_neck', neckPos, [0.3, 0, 0], 'box', // Angled forward slightly
            { width: engRadius * 0.8, height: neckLen, depth: engRadius * 1.5 }, 'NONE');

        // Secondary (Engineering) Hull - position shifted back to connect neck at front
        // Extend hull ahead of neck: Neck is at -0.3R. Front of hull should be at -0.3R + 2.0.
        const engFrontZ = -saucerRadius * 0.3 + 2.0;
        const secondaryHullZ = engFrontZ - engLen / 2;
        engPos = [0, -saucerHeight / 2 - neckLen, secondaryHullZ];
        // Use non-tapered cylinder and rename to avoid engine greebles
        attachComponent('fuselage_secondary', engPos, [Math.PI / 2, 0, 0], 'cylinder',
            { radiusTop: engRadius, radiusBottom: engRadius, height: engLen, radialSegments: 12 }, 'NONE');

        // Deflector Dish
        attachComponent('deflector_dish', [engPos[0], engPos[1], engPos[2] + engLen / 2 + 0.1], [Math.PI / 2, 0, 0], 'cylinder',
            { radiusTop: engRadius * 0.8, radiusBottom: 0, height: 0.5 }, 'NONE');

        // Pylons and Nacelles
        const nacelleLen = engLen * 1.2;
        const nacelleRadius = engRadius * 0.25; // Thinner nacelles
        
        // Nacelle Position: Higher than saucer
        // Ensure Y clears the saucer top (saucerHeight/2) + nacelleRadius + buffer
        const minNacelleY = saucerHeight / 2 + nacelleRadius + 1.5;
        const nacelleY = Math.max(minNacelleY, saucerHeight * 1.2);
        const nacelleX = saucerRadius * 0.9;
        const nacelleZ = -saucerRadius * 1.5; // Moved further back to ensure pylons sweep back, not forward

        // Pylon attachment point on engineering hull
        // Moved back to avoid intersecting the saucer (was +0.2)
        // Safety Clamp: Ensure pylon Z is strictly within the hull cylinder (with 10% padding from ends)
        const hullRear = engPos[2] - engLen / 2;
        const hullFront = engPos[2] + engLen / 2;
        const targetZ = engPos[2] - engLen * 0.1;
        const clampedZ = Math.max(hullRear + engLen * 0.1, Math.min(hullFront - engLen * 0.1, targetZ));

        const pylonStart = new THREE.Vector3(engRadius, engPos[1], clampedZ);
        
        // Pylon End: Attach about 1/3 along the nacelle length from the front
        const attachZ = nacelleZ + nacelleLen/2 - (nacelleLen / 3);
        const pylonEnd = new THREE.Vector3(nacelleX, nacelleY, attachZ);
        
        const pylonCenter = new THREE.Vector3().addVectors(pylonStart, pylonEnd).multiplyScalar(0.5);
        const pylonActualLen = pylonStart.distanceTo(pylonEnd);
        
        // Orient Pylon: Z axis = Length (to target), Y axis = Chord (Forward), X axis = Thickness
        // Use lookAt with Up vector (0,0,1) to try and align local Y with Global Z (Forward)
        const m = new THREE.Matrix4();
        m.lookAt(pylonCenter, pylonEnd, new THREE.Vector3(0, 0, 1));
        const pylonRotEuler = new THREE.Euler().setFromRotationMatrix(m);
        const pylonRot = [pylonRotEuler.x, pylonRotEuler.y, pylonRotEuler.z];

        // Box: Width=Thickness, Height=Chord, Depth=Length
        attachComponent('pylon', [pylonCenter.x, pylonCenter.y, pylonCenter.z], pylonRot, 'box', 
            { width: 0.3, height: engRadius * 0.6, depth: pylonActualLen }, 'REFLECTIVE');

        // Nacelle - Renamed to warp_nacelle to avoid thrusters
        attachComponent('warp_nacelle', [nacelleX, nacelleY, nacelleZ], [Math.PI / 2, 0, 0], 'cylinder',
            { radiusTop: nacelleRadius, radiusBottom: nacelleRadius, height: nacelleLen }, 'REFLECTIVE');

        // Explicit Wiring for Structure
        // Saucer (bridge) -> Neck -> Secondary -> Pylon -> Nacelle
        // We need IDs. Since attachComponent pushes to array, we can grab last ID.
        // Note: attachComponent handles symmetry, so we need to be careful.
        // Assuming the last added components correspond to the order above.
        // This is tricky with symmetry. Better to rely on ShipGenerator's wiring logic 
        // or pass IDs if we refactor attachComponent to return them.
        // For now, we can use the fact that ShipGenerator passes `explicitWiring` object.
        // We need the IDs.
        const comps = context.components;
        const nacelleId = comps[comps.length - 1].id; // Right Nacelle
        const pylonId = comps[comps.length - 3].id; // Right Pylon (skip sym nacelle/pylon if any? No, REFLECTIVE adds immediately)
        // Actually, REFLECTIVE adds [Original, Mirror]. So last is Mirror Nacelle. -2 is Original Nacelle.
        // This is getting complex to guess IDs. 
        // Ideally attachComponent returns the ID. 
        // But we can rely on the fact that `ShipGenerator` enforces symmetry on wiring.
        // So we only need to wire the positive X side.
        // Right Nacelle (last added if X>0? No, attachComponent adds base then sym).
        // Base is usually positive X.
        // Let's assume base is Positive X.
        // Nacelle is last added (before symmetry).
        // Pylon is before that.
        // Secondary Hull is before that.
        // Neck is before that.
        // Bridge/Saucer is earlier.
        
        // We will implement explicit wiring in ShipGenerator by returning IDs from attachComponent if possible,
        // or by searching for them here.
        const findId = (prefix) => comps.find(c => c.usage === prefix)?.id;
        const secId = findId('fuselage_secondary');
        const neckId = findId('fuselage_neck');
        const saucerId = findId('fuselage_saucer_mid') || findId('bridge');
        
        // We can't easily get the specific pylon/nacelle IDs here without refactoring attachComponent return.
        // However, we can use the `wiringGenerator` to connect by proximity/type later if we tag them?
        // Or just trust the Prim algorithm in WiringGenerator? 
        // The user specifically complained about jumping.
        // We will add a post-pass in ShipGenerator to wire these specific structures.
    } else {
        // Miranda Style (No secondary hull, nacelles on pylons/rollbar)
        // Nacelles attached to the bottom of the saucer section
        const nacelleLen = saucerRadius * 1.2;
        const nacelleWidth = saucerRadius * 0.15;
        const nacelleHeight = saucerRadius * 0.2; // Rectangular/Rhomboid style
        
        const nacelleX = saucerRadius * 0.8;
        const nacelleY = -saucerHeight * 1.0; // Below saucer
        const nacelleZ = -saucerRadius * 0.2; // Slightly back
        
        // Pylon connecting saucer bottom to nacelle
        attachComponent('pylon', [nacelleX, nacelleY/2, nacelleZ], [0, 0, 0], 'box',
            { width: 0.5, height: Math.abs(nacelleY), depth: nacelleLen * 0.5 }, 'REFLECTIVE');

        // Nacelle (Boxy/Rhomboid)
        attachComponent('warp_nacelle', [nacelleX, nacelleY, nacelleZ], [0, 0, 0], 'box',
            { width: nacelleWidth, height: nacelleHeight, depth: nacelleLen }, 'REFLECTIVE');
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
    
    attachComponent('fuselage_prong', [x, 0, z], [Math.PI/2, Math.PI - spreadAngle, 0], 'cylinder', 
        {radiusTop: 1.2, radiusBottom: 0.8, height: prongLen}, symMode);
};

export const generateBattlestar = (context) => {
    const { spineLength, random, attachComponent, components } = context;

    // Battlestar Galactica (BSG-75) Style
    // Scale factor based on 100-unit blueprint relative to spineLength
    const unit = spineLength / 100;

    // 1. Engine Section (Rear)
    // Length 30, Width 22, Height 15
    // Position: Rear. Ship runs roughly Z=50 to Z=-50.
    // Engine Block Z range: -50 to -20. Center: -35.
    const engineL = 30 * unit;
    const engineW = 22 * unit;
    const engineH = 15 * unit;
    const engineZ = -35 * unit;
    
    attachComponent('engine_block', [0, 0, engineZ], [0, 0, 0], 'box', 
        { width: engineW, height: engineH, depth: engineL }, 'NONE');

    // Thrusters (Aft face)
    // 6 cylinders: Row of 2 top, Row of 4 bottom.
    const nozzleLen = 5 * unit;
    const nozzleRad = 2.5 * unit;
    const nozzleZ = -50 * unit - (nozzleLen / 2) + 1.0; // Embed slightly

    // Top Row (2)
    attachComponent('thruster_top_L', [-5 * unit, 3 * unit, nozzleZ], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: nozzleRad, radiusBottom: nozzleRad*0.8, height: nozzleLen }, 'NONE');
    attachComponent('thruster_top_R', [5 * unit, 3 * unit, nozzleZ], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: nozzleRad, radiusBottom: nozzleRad*0.8, height: nozzleLen }, 'NONE');
    
    // Bottom Row (4)
    const botY = -3 * unit;
    const botSpacing = 5 * unit;
    for(let i=0; i<4; i++) {
        const x = -7.5 * unit + i * botSpacing;
        attachComponent(`thruster_bot_${i}`, [x, botY, nozzleZ], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: nozzleRad*0.9, radiusBottom: nozzleRad*0.7, height: nozzleLen }, 'NONE');
    }

    // 2. The Mid-Section (Neck)
    // Length 45, Width 12, Height 10
    // Z range: -20 to +25. Center: +2.5.
    const neckL = 45 * unit;
    const neckW = 12 * unit;
    const neckH = 10 * unit;
    const neckZ = 2.5 * unit;

    attachComponent('fuselage_neck', [0, 0, neckZ], [0, 0, 0], 'box', 
        { width: neckW, height: neckH, depth: neckL }, 'NONE');

    // Ribs: Thin Box every 5 units
    const ribW = neckW + (1 * unit);
    const ribH = neckH + (1 * unit);
    const ribD = 5 * unit; // Increased thickness to prevent flat sheets
    const numRibs = Math.floor(45 / 5);
    
    for(let i=0; i<numRibs; i++) {
        const rZ = (-20 * unit) + (i * 5 * unit) + (2.5 * unit);
        attachComponent(`neck_rib_${i}`, [0, 0, rZ], [0, 0, 0], 'box', 
            { width: ribW, height: ribH, depth: ribD }, 'NONE');
    }

    // 3. The Bow (Head)
    // Length 25, Width 20, Height 8
    // Z range: +25 to +50. Center: +37.5.
    // Truncated Hexagonal Prism, flattened on Y.
    const headL = 25 * unit;
    const headZ = 37.5 * unit;
    
    // Prism rotated X 90 aligns along Z. 6 segments.
    // radiusTop (Front) < radiusBottom (Back) for taper.
    attachComponent('fuselage_head', [0, 0, headZ], [Math.PI/2, 0, 0], 'prism', 
        { radiusTop: 0.6, radiusBottom: 1.0, height: headL, segments: 6 }, 'NONE');
    
    // Scale to match Width 20 and Height 8.
    // Base Prism (Rad 1) has Width 2, Height ~1.732.
    // Scale X = 20/2 = 10. Scale Y = 8/1.732 = 4.6.
    components[components.length - 1].scale = [10 * unit, 4.6 * unit, 1]; 

    // 4. Flight Pods
    // Length 55, Width 6, Height 5.
    const podL = 55 * unit;
    const podW = 6 * unit;
    const podH = 5 * unit;
    const podZ = 0;
    
    // Pylons
    const pylonW = 14 * unit;
    const pylonD = 12 * unit;
    const pylonH = 4 * unit;
    
    attachComponent('pylon_L', [-13 * unit, 0, podZ], [0, 0, 0], 'box', 
        { width: pylonW, height: pylonH, depth: pylonD }, 'NONE');
    attachComponent('pylon_R', [13 * unit, 0, podZ], [0, 0, 0], 'box', 
        { width: pylonW, height: pylonH, depth: pylonD }, 'NONE');

    // Construct Pods (C-Shape: Top, Bottom, Inner Wall)
    const plateH = 1 * unit;
    const wallW = 1.5 * unit;
    const rPodX = 22 * unit;
    const lPodX = -22 * unit;

    // Right Pod
    attachComponent('pod_R_top', [rPodX, (podH-plateH)/2, podZ], [0, 0, 0], 'box', { width: podW, height: plateH, depth: podL }, 'NONE');
    attachComponent('pod_R_bot', [rPodX, -(podH-plateH)/2, podZ], [0, 0, 0], 'box', { width: podW, height: plateH, depth: podL }, 'NONE');
    attachComponent('pod_R_wall', [rPodX - podW/2 + wallW/2, 0, podZ], [0, 0, 0], 'box', { width: wallW, height: podH - 2*plateH, depth: podL }, 'NONE');

    // Left Pod
    attachComponent('pod_L_top', [lPodX, (podH-plateH)/2, podZ], [0, 0, 0], 'box', { width: podW, height: plateH, depth: podL }, 'NONE');
    attachComponent('pod_L_bot', [lPodX, -(podH-plateH)/2, podZ], [0, 0, 0], 'box', { width: podW, height: plateH, depth: podL }, 'NONE');
    attachComponent('pod_L_wall', [lPodX + podW/2 - wallW/2, 0, podZ], [0, 0, 0], 'box', { width: wallW, height: podH - 2*plateH, depth: podL }, 'NONE');
};
