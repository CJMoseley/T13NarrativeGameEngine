import * as THREE from 'three';

export const generateInteriors = (components) => {
    const interior = [];
    
    // Identify habitable components to connect
    const habitable = components.filter(c => 
        c.usage && (c.usage.includes('cockpit') || c.usage.includes('bridge') || c.usage.includes('fuselage') || c.usage.includes('hull') || c.usage.includes('quarters'))
    );
    
    if (habitable.length < 2) return interior;

    // Sort by Z to create a spine-like connection sequence
    habitable.sort((a, b) => b.pos[2] - a.pos[2]);

    // Create corridors connecting sorted components
    for (let i = 0; i < habitable.length - 1; i++) {
        const c1 = habitable[i];
        const c2 = habitable[i+1];
        
        const p1 = new THREE.Vector3(...c1.pos);
        const p2 = new THREE.Vector3(...c2.pos);
        const dist = p1.distanceTo(p2);
        
        // Only connect if reasonably close but not identical
        if (dist > 0.5 && dist < 50.0) {
            const mid = p1.clone().add(p2).multiplyScalar(0.5);
            const dir = p2.clone().sub(p1).normalize();
            const up = new THREE.Vector3(0, 1, 0);
            
            // Calculate rotation to align cylinder Y with direction
            const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
            const e = new THREE.Euler().setFromQuaternion(q);
            
            interior.push({
                usage: 'interior_corridor',
                type: 'cylinder',
                dims: { radiusTop: 0.8, radiusBottom: 0.8, height: dist },
                pos: [mid.x, mid.y, mid.z],
                rot: [e.x, e.y, e.z]
            });
        }
    }
    
    // Add an airlock (Exterior Door) to the largest fuselage component
    const mainHull = habitable.find(c => c.usage.includes('fuselage'));
    if (mainHull) {
        let width = (mainHull.dims.width || mainHull.dims.radius || mainHull.dims.radiusTop || 2);
        if (mainHull.type === 'box') width /= 2;
        
        const airlockPos = new THREE.Vector3(...mainHull.pos);
        airlockPos.x += width;
        
        interior.push({
            usage: 'interior_airlock',
            type: 'box',
            dims: { width: 1.5, height: 2.0, depth: 1.5 },
            pos: [airlockPos.x, airlockPos.y, airlockPos.z],
            rot: [0, 0, 0]
        });
    }

    return interior;
};