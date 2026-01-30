/* LEGACY CODE - MOVED TO src/t13ne/core/

// js/core/PhysicsEngine.js

/**
 * Abstract base class for all physics engines.
 * Defines the common interface for physics simulations, allowing different
 * implementations for various environments (space, wormhole, planet, hyperspace).
 */
class PhysicsEngine {
    constructor() {
        if (new.target === PhysicsEngine) {
            throw new TypeError("Cannot construct PhysicsEngine instances directly. Use a subclass.");
        }
        this.world = null; // Physics world object (e.g., Ammo.js world, custom implementation)
        this.physicsObjects = []; // Array to hold objects managed by this engine
        console.log("PhysicsEngine base constructor called.");
    }

    /**
     * Initializes the physics engine. Must be implemented by subclasses.
     * @abstract
     */
    init() {
        throw new Error("Method 'init()' must be implemented by subclasses.");
    }

    /**
     * Adds a physics object to the simulation. Must be implemented by subclasses.
     * A physics object should ideally have properties like mesh, body, position, velocity, etc.
     * @abstract
     * @param {object} physicsObject - The object to add to the physics simulation.
     */
    addPhysicsObject(physicsObject) {
        throw new Error("Method 'addPhysicsObject()' must be implemented by subclasses.");
    }

    /**
     * Removes a physics object from the simulation. Must be implemented by subclasses.
     * @abstract
     * @param {object} physicsObject - The object to remove from the physics simulation.
     */
    removePhysicsObject(physicsObject) {
        throw new Error("Method 'removePhysicsObject()' must be implemented by subclasses.");
    }

    /**
     * Updates the physics simulation by a given delta time. Must be implemented by subclasses.
     * @abstract
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    update(deltaTime) {
        throw new Error("Method 'update()' must be implemented by subclasses.");
    }

    /**
     * Cleans up the physics engine resources. Must be implemented by subclasses.
     * @abstract
     */
    dispose() {
        throw new Error("Method 'dispose()' must be implemented by subclasses.");
    }

    /**
     * Applies a force to a specific physics object.
     * @param {object} physicsObject - The object to apply force to.
     * @param {THREE.Vector3} force - The force vector to apply.
     * @param {THREE.Vector3} relativePoint - The point in the object's local space to apply the force.
     */
    applyForce(physicsObject, force, relativePoint = new THREE.Vector3(0, 0, 0)) {
        console.warn("applyForce not implemented in base PhysicsEngine. Subclass should override.");
        // This method will typically involve calling specific methods of the underlying physics library
        // (e.g., Ammo.js, PhysX) on the physicsObject's rigid body.
    }

    /**
     * Applies an impulse to a specific physics object.
     * @param {object} physicsObject - The object to apply impulse to.
     * @param {THREE.Vector3} impulse - The impulse vector to apply.
     * @param {THREE.Vector3} relativePoint - The point in the object's local space to apply the impulse.
     */
    applyImpulse(physicsObject, impulse, relativePoint = new THREE.Vector3(0, 0, 0)) {
        console.warn("applyImpulse not implemented in base PhysicsEngine. Subclass should override.");
    }
}

export default PhysicsEngine;

*/