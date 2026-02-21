class SpaceMass {
    constructor(z, type = 'ship') {
        this.position = new THREE.Vector3(0, 0, z);
        this.velocity = new THREE.Vector3(0, 0, 1.0); // Moving through the wormhole
        
        // Custom "Vibration Signature" 
        // Ships might have high-freq engine hum, Asteroids have low-freq thumps
        this.frequencies = type === 'ship' ? [20.0, 45.0, 1.2] : [0.5, 2.0];
        this.isPlayer = type === 'ship';
    }

    applyPhysics(wormhole) {
        // Calculate current spine position at our Z
        const pRatio = (this.position.z + LENGTH/2) / LENGTH;
        const segmentIdx = Math.floor(pRatio * SEGMENTS) * 4;
        
        const spineX = wormhole.spineData[segmentIdx];
        const spineY = wormhole.spineData[segmentIdx + 1];

        // 1. DARK ENERGY REBULLION (Force outward from spine)
        const toMass = new THREE.Vector3(this.position.x - spineX, this.position.y - spineY, 0);
        const distFromSpine = toMass.length();
        
        // The Ribbon Force: Strongest near the center, pushing to the walls
        const repelForce = 0.5 / (distFromSpine + 1.0);
        this.velocity.add(toMass.normalize().multiplyScalar(repelForce));

        // 2. WALL COLLISION
        if (distFromSpine > RADIUS * 0.9) {
            // Bounce off the wall
            this.velocity.reflect(toMass.normalize().negate());
            this.velocity.multiplyScalar(0.8); // Friction
        }

        this.position.add(this.velocity);
    }
}