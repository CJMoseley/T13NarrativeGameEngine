import * as THREE from 'three';

export const generateStation = (context, hullType) => {
    const { spineLength, size, radialAxis, radialCount, attachComponent } = context;
    
    const r = spineLength * 1.5;
    const tubeR = size === 'large' ? 3 : 1.5;
    
    // Orientation based on radial axis
    const rot = radialAxis === 'y' ? [Math.PI/2, 0, 0] : [0, 0, 0];

    // Rim
    attachComponent('rim', [0,0,0], rot, 'torus', {radius: r, tube: tubeR}, 'NONE');
    
    if (hullType === 'STATION_WHEEL') {
        // Hub
        const hubRot = radialAxis === 'y' ? [0, 0, 0] : [Math.PI/2, 0, 0];
        attachComponent('hub', [0,0,0], hubRot, 'cylinder', {radiusTop: tubeR*2, radiusBottom: tubeR*2, height: tubeR*3}, 'NONE');
        // Spokes
        const spokes = radialCount < 3 ? 4 : radialCount;
        
        // Calculate overlap to ensure connection to Torus Rim
        // Rim inner surface is at (r - tubeR).
        // We want to extend past this surface into the tube to handle curvature.
        const startX = tubeR * 1.5; // Start inside hub (Hub radius is tubeR*2)
        const endX = r - (tubeR * 0.5); // End inside rim (Tube radius is tubeR)
        
        const spokeLen = endX - startX;
        const centreX = startX + spokeLen / 2;
        
        const spokePos = [centreX, 0, 0];
        const spokeRot = [0, 0, Math.PI/2];
        
        // Adjust for Y axis orientation if needed, but attachComponent handles radial rotation
        attachComponent('spoke', spokePos, spokeRot, 'cylinder', {radiusTop: tubeR/2, radiusBottom: tubeR/2, height: spokeLen}, 'RADIAL');
    }
};