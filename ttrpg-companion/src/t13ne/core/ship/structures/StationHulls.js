import * as THREE from 'three';

export const generateStation = (context, hullType) => {
    const { spineLength, size, radialAxis, radialCount, attachComponent, wiringGenerator, explicitWiring } = context;
    
    const r = spineLength * 1.5;
    const tubeR = size === 'large' ? 3 : 1.5;
    
    // Orientation based on radial axis
    const rot = radialAxis === 'y' ? [Math.PI/2, 0, 0] : [0, 0, 0];

    // Rim
    const rimId = attachComponent('rim', [0,0,0], rot, 'torus', {radius: r, tube: tubeR}, 'NONE');
    
    // Central Fuselage (Spine) - Treating these as "Stations with Rings"
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
    
    // Explicitly generate spokes to ensure correct orientation
    for (let i = 0; i < radialCount; i++) {
        const angle = (Math.PI * 2 / radialCount) * i;
        const dist = r / 2;
        
        let pos;
        if (radialAxis === 'z') {
            pos = [Math.cos(angle) * dist, Math.sin(angle) * dist, 0];
        } else {
            pos = [Math.cos(angle) * dist, 0, Math.sin(angle) * dist];
        }
        
        const dir = new THREE.Vector3(pos[0], pos[1], pos[2]).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
        const e = new THREE.Euler().setFromQuaternion(q);
        
        const sId = attachComponent(`spoke_${i}`, pos, [e.x, e.y, e.z], 'cylinder', 
            {radiusTop: tubeR/2, radiusBottom: tubeR/2, height: spokeLen}, 'NONE');
            
        if (wiringGenerator && explicitWiring) {
            wiringGenerator.addConnection(explicitWiring, spineId, sId, 'structural', r/2);
            wiringGenerator.addConnection(explicitWiring, sId, rimId, 'structural', r/2);
        }
    }
};