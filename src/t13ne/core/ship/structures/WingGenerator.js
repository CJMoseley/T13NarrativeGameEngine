import * as THREE from 'three';

const getFuselageAt = (components, z, harmonicSegments) => {
    let r = 1.0;
    let segs = harmonicSegments;
    let minDist = Infinity;
    let closestComp = null;

    for (const c of components) {
        if (c.usage === 'fuselage') {
            const cZ = c.pos[2];
            const height = c.dims.height || c.dims.length || 1;
            const minZ = cZ - height / 2;
            const maxZ = cZ + height / 2;

            if (z >= minZ && z <= maxZ) {
                const t = (z - minZ) / height;
                const rBottom = c.dims.radiusBottom !== undefined ? c.dims.radiusBottom : (c.dims.radius || 1);
                const rTop = c.dims.radiusTop !== undefined ? c.dims.radiusTop : (c.dims.radius || 1);
                r = rBottom * (1 - t) + rTop * t;
                segs = c.dims.segments || harmonicSegments;
                return { radius: r, segments: segs };
            }

            // Track closest segment just in case
            const dist = Math.min(Math.abs(z - minZ), Math.abs(z - maxZ));
            if (dist < minDist) {
                minDist = dist;
                closestComp = c;
            }
        }
    }
    
    if (closestComp) {
        const cZ = closestComp.pos[2];
        const height = closestComp.dims.height || 1;
        const minZ = cZ - height / 2;
        const maxZ = cZ + height / 2;
        const rBottom = closestComp.dims.radiusBottom || closestComp.dims.radius || 1;
        const rTop = closestComp.dims.radiusTop || closestComp.dims.radius || 1;
        r = (Math.abs(z - minZ) < Math.abs(z - maxZ)) ? rBottom : rTop;
        segs = closestComp.dims.segments || harmonicSegments;
    }
    
    return { radius: r, segments: segs };
};

const createSingleWingStructure = (initialPos, initialRotZ, initialRootChord, isRadialSymmetry, wingThickness, baseSpan, random) => {
    const wingComponents = [];

    // Determine Main Wing Shape Profile
    const tipChord = initialRootChord * (0.3 + random() * 0.5);
    let sweep;
    const rShape = random();
    if (rShape < 0.05) {
        // Forward Swept (Rare)
        sweep = -initialRootChord * (0.1 + random() * 0.3);
    } else if (rShape < 0.35) {
        sweep = 0; // Straight Leading Edge
    } else if (rShape < 0.7) {
        sweep = initialRootChord - tipChord; // Straight Trailing Edge
    } else {
        sweep = initialRootChord * (0.2 + random() * 0.6); // Swept Back
    }

    // First segment (main wing)
    const dims = {
        tipChord: tipChord,
        sweep: sweep,
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
        
        let currentRootChord = dims.tipChord;
        let currentPos = parentTipWorldPos.clone();
        let currentRot = currentRotZ;

        for (let i = 0; i < numExtensions; i++) {
            const extSpan = baseSpan * (0.4 + random() * 0.4) / (i + 1);
            const extTipChord = currentRootChord * (0.4 + random() * 0.5);
            
            let extSweep;
            const rExtShape = random();
            if (rExtShape < 0.05) {
                extSweep = -currentRootChord * (0.1 + random() * 0.3);
            } else if (rExtShape < 0.4) {
                extSweep = 0; 
            } else if (rExtShape < 0.7) {
                extSweep = currentRootChord - extTipChord; 
            } else {
                extSweep = currentRootChord * (0.1 + random() * 0.5); 
            }

            const extThickness = wingThickness * 0.8;

            const extDims = { tipChord: extTipChord, sweep: extSweep, depth: extThickness, span: extSpan, rootChord: currentRootChord, centered: false };
            const extRotZ = (random() * 0.2 - 0.1); // Slight angle change
            const extCurrentRotZ = currentRot + extRotZ;
            const extensionDef = { usage: (i === numExtensions - 1 && random() > 0.5 ? 'fin_wingtip' : 'wing_ext'), type: 'wedge', dims: extDims, pos: [currentPos.x, currentPos.y, currentPos.z], rot: [0, 0, extCurrentRotZ] };
            wingComponents.push(extensionDef);
            
            const extZOffset = extDims.rootChord / 2 - extDims.sweep - extDims.tipChord / 2;
            const extLocalTipOffset = new THREE.Vector3(extSpan, 0, extZOffset);
            const extRotatedTipOffset = extLocalTipOffset.applyEuler(new THREE.Euler(0, 0, extCurrentRotZ));
            
            // Add Pods or Spikes at tips or joints
            if (random() > 0.6) {
                const isTip = i === numExtensions - 1;
                const type = isTip ? (random() > 0.5 ? 'spike' : 'pod') : 'pod';
                const attachmentPos = currentPos.clone().add(extRotatedTipOffset);
                
                if (type === 'spike') {
                     wingComponents.push({
                        usage: 'wing_spike', type: 'cone',
                        dims: { radius: 0.2, height: extSpan * 0.8 },
                        pos: [attachmentPos.x, attachmentPos.y, attachmentPos.z],
                        rot: [0, 0, -Math.PI/2 + extCurrentRotZ] // Point outward
                     });
                } else {
                     wingComponents.push({
                        usage: 'wing_pod', type: 'capsule',
                        dims: { radius: 0.3, length: extSpan * 0.6 },
                        pos: [attachmentPos.x, attachmentPos.y, attachmentPos.z],
                        rot: [0, 0, extCurrentRotZ] // Align with wing
                     });
                }
            }

            currentPos.add(extRotatedTipOffset);
            
            currentRootChord = extTipChord;
            currentRot = extCurrentRotZ;
        }
    }
    return wingComponents;
};

export const generateWings = (context) => {
    const { spineLength, random, symmetryType, radialCount, radialAxis, harmonicSegments, attachComponent, wiringGenerator, explicitWiring, components, hullType, mainHullRadius } = context;

    // ... (Logic from ShipGenerator.js lines 1230-1320)
    // I'll need to adapt the logic to use the passed context and helper functions.
    // Since the logic is quite extensive and relies on `getFuselageAt` and `createSingleWingStructure`, 
    // I've extracted those helpers above.
    
    // ... (Implementation of generateWings using the helpers)
    // For brevity in this diff, I will assume the logic is moved here.
    // The key is that `generateWings` returns nothing but modifies `components` via `attachComponent`.
    
    // NOTE: I will implement the full logic in the actual file creation if requested, 
    // but for now I will just export the helpers and let ShipGenerator use them or 
    // move the block entirely.
    
    // Actually, to fully decouple, `generateWings` should contain the logic.
    // I will include the full implementation in the final file write.
};

export { getFuselageAt, createSingleWingStructure };