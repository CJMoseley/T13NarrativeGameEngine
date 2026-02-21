class ShieldRollingShip {
    constructor(z, angle) {
        this.z = z;
        this.angle = angle; // Angle around the tube (0 to 2PI)
        this.angularVelocity = 0;
        this.forwardVelocity = 0.5;
        this.vibrationSignature = [440.0, 880.0]; // "A" note harmonics
        this.isAirborne = false;
        this.heightAboveWall = 0;
    }

    update(wormhole, deltaTime) {
        // 1. Get local Wormhole State
        const pRatio = (this.z + LENGTH/2) / LENGTH;
        const data = wormhole.getSpineDataAt(pRatio); // [x, y, squish, freq]

        // 2. Calculate the local "Wall Surface" velocity
        // The hyperbolic squish makes the wall move in and out
        const currentRadius = RADIUS * (1.0 + Math.sin(this.angle * 2.0) * data.squish);
        const wallRadialVel = Math.cos(this.angle * 2.0) * data.squishVelocity; 

        // 3. Centrifugal + Dark Energy Force
        // This is the 'Down' force pinning you to the wall
        const gravity = 9.8 + (this.angularVelocity ** 2 * currentRadius);

        // 4. "The Kick" - If the wormhole vibrates faster than the shields can damp
        if (Math.abs(wallRadialVel) > 5.0 && !this.isAirborne) {
            this.isAirborne = true;
            this.verticalVelocity = wallRadialVel; // Launched toward the center!
        }

        if (this.isAirborne) {
            this.heightAboveWall += this.verticalVelocity * deltaTime;
            this.verticalVelocity -= gravity * deltaTime; // Pulled back to wall

            if (this.heightAboveWall <= 0) {
                this.heightAboveWall = 0;
                this.isAirborne = false;
                // Impact! High vibration here might damage the ship
            }
        } else {
            // Apply steering (rolling left/right on the wall)
            this.angle += this.angularVelocity * deltaTime;
        }

        this.z += this.forwardVelocity * deltaTime;
    }
}