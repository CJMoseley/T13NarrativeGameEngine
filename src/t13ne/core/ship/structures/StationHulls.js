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
        const spokeLen = r - (tubeR * 2);
        // Position: halfway out along X (if Z axis) or X (if Y axis)
        const spokePos = [r/2, 0, 0];
        const spokeRot = [0, 0, Math.PI/2];
        
        // Adjust for Y axis orientation if needed, but attachComponent handles radial rotation
        attachComponent('spoke', spokePos, spokeRot, 'cylinder', {radiusTop: tubeR/2, radiusBottom: tubeR/2, height: spokeLen}, 'RADIAL');
    }
};