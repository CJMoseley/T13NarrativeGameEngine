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
                        rot: [Math.PI/2, 0, 0] // Align horizontal (Forward Z)
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
    const { spineLength, random, symmetryType, radialCount, attachComponent, wiringGenerator, explicitWiring, components, hullType, getSurfacePoint } = context;

    if (random() > 0.1 && (hullType === 'SPINE' || hullType === 'BIO_INSECT')) { 
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
            const mainHull = components.find(c => c.usage.includes('fuselage') || c.usage.includes('hull'));
            const mainHullRadius = mainHull ? (mainHull.dims.radius || 2.0) : 2.0;
            const circumference = 2 * Math.PI * mainHullRadius;
            maxSpan = Math.min(baseSpan, (circumference / radialCount) * 0.8);
        }

        // Position Z: Explicit separation
        const wingZ = 0; // Main wings centered
        const canardZ = spineLength / 2 - 1.0; // Front
        const tailZ = -spineLength / 2 + 1.0; // Back

        // Calculate attachment point using Raycasting to ensure surface contact
        let attachX = 0.5; // Default fallback: Center line (safest for connection)
        let attachY = 0;

        // Raycast from far right towards center to find the hull surface
        const rayOrigin = [50, 0, wingZ];
        const rayDir = [-1, 0, 0];
        const hit = getSurfacePoint(components, rayOrigin, rayDir, ['fuselage', 'hull', 'spine']);

        if (hit) {
            attachX = hit.x;
            attachY = hit.y;
            // Embed slightly to ensure connection (0.5 units)
            // Since we are attaching to the right side (+X), we subtract from X
            attachX -= 0.5;
        }

        // Helper to find attachment point at specific Y, Z to ensure wings connect to surface
        const getWingAttachPos = (targetY, targetZ) => {
            let pos = [attachX, targetY, targetZ]; // Default to the y=0 hit
            if (getSurfacePoint) {
                let hit = getSurfacePoint(components, [50, targetY, targetZ], [-1, 0, 0], ['fuselage', 'hull', 'spine']);
                if (!hit) {
                    const dirY = targetY >= 0 ? -1 : 1;
                    const startY = targetY >= 0 ? Math.max(targetY, 20) : Math.min(targetY, -20);
                    const vertHit = getSurfacePoint(components, [0, startY, targetZ], [0, dirY, 0], ['fuselage', 'hull', 'spine']);
                    if (vertHit) {
                        const newY = vertHit.y + (dirY * 0.5); 
                        hit = getSurfacePoint(components, [50, newY, targetZ], [-1, 0, 0], ['fuselage', 'hull', 'spine']);
                    }
                }
                if (hit) {
                    pos = [hit.x - 0.5, hit.y, targetZ];
                }
            }
            return pos;
        };

        const symOverride = symmetryType === 'ASYMMETRICAL' ? 'REFLECTIVE' : null;

        const processWing = (defs) => {
            let parentId = null;
            defs.forEach((def, i) => {
                const compId = attachComponent(def.usage, def.pos, def.rot, def.type, def.dims, symOverride);
                const currentId = components[components.length - 1].id;
                if (i > 0 && parentId) {
                    wiringGenerator.addConnection(explicitWiring, currentId, parentId, 'structural', 1.0);
                }
                parentId = currentId;
                if (i === 0) {
                    const fuselageId = components.find(c => c.usage.includes('fuselage') || c.usage.includes('spine'))?.id;
                    if (fuselageId) wiringGenerator.addConnection(explicitWiring, currentId, fuselageId, 'structural', 2.0);
                }
                if (i === 0 && random() > 0.3) {
                    const { span, rootChord, tipChord = rootChord * 0.5, sweep = 0 } = def.dims;
                    const spanFactor = 0.3 + random() * 0.3;
                    const engX = span * spanFactor;
                    const zRearRoot = -rootChord / 2;
                    const zRearTip = rootChord / 2 - sweep - tipChord;
                    const zRearAtX = zRearRoot * (1 - spanFactor) + zRearTip * spanFactor;
                    const engRadius = Math.min(rootChord * 0.1, 0.6);
                    const engLen = Math.min(rootChord * 0.5, 2.5);
                    const engZ = zRearAtX - engLen / 2;
                    const engPosLocal = new THREE.Vector3(engX, 0, engZ);
                    const wingRotEuler = new THREE.Euler(...def.rot);
                    const engPosWorld = engPosLocal.applyEuler(wingRotEuler).add(new THREE.Vector3(...def.pos));
                    attachComponent(`wing_engine_${i}`, [engPosWorld.x, engPosWorld.y, engPosWorld.z], [Math.PI/2, 0, 0], 'cylinder', { radiusTop: engRadius * 0.8, radiusBottom: engRadius, height: engLen }, symOverride);
                    const engId = components[components.length - 1].id;
                    wiringGenerator.addConnection(explicitWiring, engId, currentId, 'fuel_pipe', 1.0);
                }
            });
        };

        if (effectiveWingConfig === 'Monoplane') {
            const pos = getWingAttachPos(attachY, wingZ);
            processWing(createSingleWingStructure(pos, 0, baseRootChord, symmetryType === 'RADIAL', wingThickness, baseSpan, random));
        } else if (effectiveWingConfig === 'X-Wing') {
            const angle = (Math.PI / 6) + random() * (Math.PI / 6);
            const pos1 = getWingAttachPos(attachY + 0.2, wingZ);
            const pos2 = getWingAttachPos(attachY - 0.2, wingZ);
            processWing(createSingleWingStructure(pos1, angle, baseRootChord, false, wingThickness, maxSpan, random));
            processWing(createSingleWingStructure(pos2, -angle, baseRootChord, false, wingThickness, maxSpan, random));
        } else {
            const gap = 2.0 + random();
            const pos1 = getWingAttachPos(attachY + gap / 2, wingZ);
            const pos2 = getWingAttachPos(attachY - gap / 2, wingZ);
            processWing(createSingleWingStructure(pos1, 0, baseRootChord, symmetryType === 'RADIAL', wingThickness, maxSpan, random));
            processWing(createSingleWingStructure(pos2, 0, baseRootChord, symmetryType === 'RADIAL', wingThickness, maxSpan, random));
        }

        if (random() > 0.6) {
            const canardW = baseSpan * 0.4;
            const canardL = baseRootChord * 0.3;
            const cX = attachX * 0.8;
            const canardSweep = canardL * 0.4;
            attachComponent('fin_front', [cX, 0, canardZ], [0, 0, 0], 'wedge', { span: canardW, rootChord: canardL, sweep: canardSweep, depth: 0.15, centered: false }, symOverride);
        }

        if (random() > 0.4) {
            const tailH = 2 + random() * 2;
            const tailL = spineLength * (0.2 + random() * 0.3);
            const tailSweep = tailL * 0.5;
            const tY = 0.8;
            attachComponent('fin_tail_top', [0, tY, tailZ], [0, 0, Math.PI / 2], 'wedge', { span: tailH, rootChord: tailL, sweep: tailSweep, depth: 0.2, centered: false });
            if (random() > 0.7) {
                attachComponent('fin_tail_bottom', [0, -tY, tailZ], [0, 0, -Math.PI / 2], 'wedge', { span: tailH, rootChord: tailL, sweep: tailSweep, depth: 0.2, centered: false });
            }
        }
    }
};

export { getFuselageAt, createSingleWingStructure };