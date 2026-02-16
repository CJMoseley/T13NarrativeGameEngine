import * as THREE from 'three';

export const generateStation = (context, hullType) => {
    const { spineLength, size, radialAxis, radialCount, attachComponent, wiringGenerator, explicitWiring } = context;
    
    const r = spineLength * 1.5;
    const tubeR = size === 'large' ? 3 : 1.5;
    
    // Orientation based on radial axis
    const rot = radialAxis === 'y' ? [Math.PI/2, 0, 0] : [0, 0, 0];

    // Rim
    const rimId = attachComponent('rim', [0,0,0], rot, 'torus', {radius: r, tube: tubeR}, 'NONE');
    
    // Central Fuselage (Spine) - Treating these as "Ships with Rings"
    // Length proportional to ring radius to look like a ship flying through a ring
    const fuselageLen = r * 1.2; 
    const fuselageRadius = tubeR * 1.5;
    
    let spineRot;
    if (radialAxis === 'y') {
        spineRot = [0, 0, 0]; // Vertical spine for horizontal ring
    } else {
        spineRot = [Math.PI/2, 0, 0]; // Horizontal spine for vertical ring
    }
    
    const spineId = attachComponent('fuselage_spine', [0,0,0], spineRot, 'cylinder', 
        {radiusTop: fuselageRadius, radiusBottom: fuselageRadius, height: fuselageLen}, 'NONE');

    // Spokes - Connect Spine to Rim
    const spokeLen = r;
    const centreX = r / 2;
    const spokePos = [centreX, 0, 0];
    const spokeRot = [0, 0, Math.PI/2];
    
    const spokeId = attachComponent('spoke', spokePos, spokeRot, 'cylinder', {radiusTop: tubeR/2, radiusBottom: tubeR/2, height: spokeLen}, 'RADIAL');

    // Explicitly wire Spine -> Spoke -> Rim
    if (wiringGenerator && explicitWiring) {
        wiringGenerator.addConnection(explicitWiring, spineId, spokeId, 'structural', r/2);
        wiringGenerator.addConnection(explicitWiring, spokeId, rimId, 'structural', r/2);

        // Wire radial duplicates
        for(let i=1; i<radialCount; i++) {
            const radSpokeId = `${spokeId}_rad_${i}`;
            wiringGenerator.addConnection(explicitWiring, spineId, radSpokeId, 'structural', r/2);
            wiringGenerator.addConnection(explicitWiring, radSpokeId, rimId, 'structural', r/2);
        }
    }
};