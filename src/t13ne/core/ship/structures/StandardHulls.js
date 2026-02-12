import * as THREE from 'three';

export const generateDisc = (context) => {
    const { size, random, attachComponent, hullType } = context;
    const mainHullRadius = (size === 'small' ? 4 : (size === 'medium' ? 8 : 12)) * (0.8 + random() * 0.4);
    const totalHeight = (size === 'small' ? 1.5 : (size === 'medium' ? 2.5 : 4));

    // Add a central cylindrical section as requested
    const midHeight = totalHeight * (0.2 + random() * 0.4); // 20-60% of total height
    const taperHeight = (totalHeight - midHeight) / 2;

    // Central Cylinder - add a 'hull' usage tag so greebles like windows can be added
    attachComponent('fuselage_hull_mid', [0, 0, 0], [0, 0, 0], 'cylinder',
        { radiusTop: mainHullRadius, radiusBottom: mainHullRadius, height: midHeight, radialSegments: 32 },
        'NONE'
    );
    
    // Top Half: Taper from Middle to Top
    attachComponent('fuselage_top', [0, midHeight / 2 + taperHeight / 2, 0], [0, 0, 0], 'cylinder',
        { radiusTop: mainHullRadius * 0.25, radiusBottom: mainHullRadius, height: taperHeight, radialSegments: 32 },
        'NONE' 
    );
    // Bottom Half: Taper from Middle to Bottom
    attachComponent('fuselage_bottom', [0, -midHeight / 2 - taperHeight / 2, 0], [0, 0, 0], 'cylinder',
        { radiusTop: mainHullRadius, radiusBottom: mainHullRadius * 0.25, height: taperHeight, radialSegments: 32 },
        'NONE'
    );
    return { mainHullRadius };
};

export const generateSpineOrStar = (context, hullType) => {
    const { spineLength, random, harmonicSegments, symmetryType, radialAxis, radialCount, attachComponent, wiringGenerator, explicitWiring, components } = context;
    
    const effectiveSymmetry = hullType === 'STAR' ? 'RADIAL' : 'NONE';

    const spineSegments = Math.floor(spineLength / 2) + 1;
    const segmentHeight = spineLength / spineSegments;
    let lastSegmentRadius = 1.0;
    let lastSegmentZ = 0;
    let lastSegmentSegments = 8;
    let lastSegmentRotation = [0, 0, 0];
    let previousSegmentId = null;

    // Initialize segment count for consistency (reduce jitter between segments)
    let currentSegs = (random() > 0.5) ? harmonicSegments : Math.floor(3 + random() * 5);

    for (let i = 0; i < spineSegments; i++) {
        const width = 2.0 + random() * 0.8; // Reduced variation (2.0 - 2.8) to make connections smoother
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
            if (isRadialZ) faceAlignment = -Math.PI / segs;

            // Rotate Z to align prisms for Flat Bottom / Flat Top preference
            let baseRoll = 0;
            if (segs % 4 === 0) baseRoll = Math.PI / segs; // Square/Octagon -> Flat Top/Bottom

            rot = [Math.PI / 2, 0, baseRoll + faceAlignment]; // Rotate X to align Z, then Z to roll

            if (i === spineSegments - 1) {
                lastSegmentRadius = radius;
                lastSegmentZ = zPos + (segmentHeight / 2);
                lastSegmentSegments = segs;
                lastSegmentRotation = rot;
            }
        }

        attachComponent('fuselage', pos, rot, 'prism',
            { radius: radius, height: segmentHeight, segments: segs },
            effectiveSymmetry
        );

        // Connect to previous segment
        const currentId = components[components.length - 1].id;
        if (previousSegmentId && hullType === 'SPINE') {
            wiringGenerator.addConnection(explicitWiring, currentId, previousSegmentId, 'power', segmentHeight);
        }
        previousSegmentId = currentId;
    }

    if (hullType === 'SPINE') {
        return { lastSegmentZ, lastSegmentRadius, lastSegmentSegments, previousSegmentId, lastSegmentRotation };
    } else if (hullType === 'STAR') {
        // Central Hub for Star
        attachComponent('hub', [0, 0, 0], [0, 0, 0], 'cylinder', { radiusTop: 2, radiusBottom: 2, height: 2, radialSegments: radialCount * 2 }, 'NONE');
    }
    return {};
};
