import Logger from '../../core/Logger.js';

/**
 * Ship Class
 *
 * Represents the player's ship as a transferable set of assembly instructions.
 * It primarily consists of a list of components, each with a unique ID,
 * a 3D position, and a 3D rotation (as a quaternion).
 * This object is the canonical state of the ship, which scenes use to render
 * and simulate the ship.
 */
export class Ship {
    constructor(name) {
        const funcName = 'Ship.constructor';
        Logger.start(funcName, { name });

        this.name = name;
        this.layout = null;
        this.mesh = null;

        /**
         * A list of all components that make up this ship.
         * @type {Array<{component: object, position: {x: number, y: number, z: number}, rotation: {x: number, y: number, z: number, w: number}}>}
         */
        this.components = [];

        // Other ship properties can be added here as needed (e.g., cargo, crew)
        this.cargo = [];
        this.crew = {};

        // Physics state, to be managed by the physics engine in the active scene
        this.physics = {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 }, // Quaternion
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 },
        };

        Logger.end(funcName);
    }

    setLayout(layout) {
        this.layout = layout;
    }

    generateMesh(shipFactory, styleConfig) {
        if (!this.layout) {
            console.error("Cannot generate mesh without a layout.");
            return;
        }

        const shipFactoryComponents = this.components.map((c, i) => ({
            type: c.component.proxyShape,
            dims: c.component.dims,
            pos: this.layout.components[i].pos,
            rot: this.layout.components[i].rot,
        }));

        this.mesh = shipFactory.generateProceduralShip(shipFactoryComponents, styleConfig, this.layout.interior);
        this.mesh.name = this.name;
    }

    /**
     * Adds a component to the ship's component list.
     * The Shipyard scene will be responsible for providing the position and rotation.
     * @param {object} component - The full component object.
     * @param {{x: number, y: number, z: number}} position - The 3D position of the component.
     * @param {{x: number, y: number, z: number, w: number}} rotation - The quaternion rotation.
     */
    addComponent(component, position, rotation) {
        const funcName = 'Ship.addComponent';
        Logger.start(funcName, { component, position, rotation });

        const newComponent = {
            component: component,
            position: position,
            rotation: rotation,
        };

        this.components.push(newComponent);
        Logger.message(`Added component ${component.name} to ship.`);
        Logger.end(funcName);
    }

    /**
     * Removes a component from the ship by its instance in the array.
     * In the shipyard, the user would click on the component mesh, and the scene
     * would find the corresponding object in this array to remove it.
     * @param {object} componentInstance - The specific component instance to remove.
     */
    removeComponent(componentInstance) {
        const funcName = 'Ship.removeComponent';
        Logger.start(funcName, { componentInstance });

        const index = this.components.indexOf(componentInstance);
        if (index > -1) {
            this.components.splice(index, 1);
            Logger.message(`Removed component ${componentInstance.component.name}.`);
            Logger.end(funcName, true);
            return true;
        }

        Logger.warn(`Could not find component to remove.`);
        Logger.end(funcName, false);
        return false;
    }

    /**
     * Recalculates ship-wide properties based on its components.
     * This is a placeholder for future logic (e.g., total mass, power, etc.).
     */
    recalculateStats() {
        const funcName = 'Ship.recalculateStats';
        Logger.start(funcName);
        // TODO: Iterate through this.components, fetch component definitions
        // from a central registry, and calculate total mass, power, etc.
        Logger.end(funcName);
    }
}
