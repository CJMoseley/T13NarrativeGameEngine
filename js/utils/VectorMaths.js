/**
 * Wormhole Racers Vector Maths Utility
 * Source: [Documentation Sections: Physics Model, 3D Movement]
 * Purpose: Provides standard 3D vector operations required by the PhysicsEngine and Renderer 
 * to handle ship position, velocity, and forces in a three-dimensional space.
 * Requirement: All movement and force calculations must use 3D vectors (x, y, z).
 */

export const VectorMaths = {
    // Vector structure: { x: number, y: number, z: number }

    add: (v1, v2) => ({
        x: v1.x + v2.x,
        y: v1.y + v2.y,
        z: v1.z + v2.z,
    }),

    subtract: (v1, v2) => ({
        x: v1.x - v2.x,
        y: v1.y - v2.y,
        z: v1.z - v2.z,
    }),

    scale: (v, scalar) => ({
        x: v.x * scalar,
        y: v.y * scalar,
        z: v.z * scalar,
    }),

    magnitude: (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),

    normalize: (v) => {
        const mag = VectorMaths.magnitude(v);
        return mag === 0 ? { x: 0, y: 0, z: 0 } : VectorMaths.scale(v, 1 / mag);
    },

    dot: (v1, v2) => v1.x * v2.x + v1.y * v2.y + v1.z * v2.z,
    
    // PLACEHOLDER: Cross product is often needed for torque and rotation
    cross: (v1, v2) => ({
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x,
    })
};