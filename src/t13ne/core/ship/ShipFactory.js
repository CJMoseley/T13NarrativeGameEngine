import * as THREE from 'three';
import ModelLoader from '/src/t13ne/core/ModelLoader.js';
import WiringHarmonicsCalculator from '/src/t13ne/core/ship/WiringHarmonicsCalculator.js';
import { UniversalPipeline } from '/src/t13ne/procgen/uhpp/UniversalPipeline.js';
import { NoiseHeuristic } from '/src/t13ne/procgen/uhpp/NoiseHeuristic.js';
import { LSystemBridge } from '/src/t13ne/procgen/uhpp/LSystemBridge.js';
import { WFCManager } from '/src/t13ne/procgen/uhpp/WFCManager.js';
import { CellularAutomata } from '/src/t13ne/procgen/uhpp/CellularAutomata.js';
import { SurfaceSynth } from '/src/t13ne/procgen/uhpp/SurfaceSynth.js';
import { RenderBridge } from '/src/t13ne/procgen/uhpp/RenderBridge.js';
import { ComponentFactory } from '/src/t13ne/core/ship/ComponentFactory.js';
import { HullGenerator } from '/src/t13ne/core/ship/HullGenerator.js';
import { GreebleGenerator } from '/src/t13ne/core/ship/GreebleGenerator.js';
import { WiringGenerator } from '/src/t13ne/core/ship/WiringGenerator.js';
import { ShipGenerator } from '/src/t13ne/core/ship/ShipGenerator.js';
import { ShipAssembler } from '/src/t13ne/core/ship/ShipAssembler.js';
import { COMPONENT_COLORS } from '/src/t13ne/core/ship/ShipUtils.js';

export { COMPONENT_COLORS };

/**
 * The ShipFactory is responsible for assembling ship components into a complete ship design.
 * It manages the placement of components, their connections, and calculates derived properties like wiring harmonics.
 * This acts as the backend for a "shipyard" UI, allowing players or procedural scripts to build ships.
 */
export class ShipFactory {
    constructor(gameEngine, physxProvider) {
        this.gameEngine = gameEngine;
        this.physxProvider = physxProvider;
        this.modelLoader = new ModelLoader();
        this.harmonicsCalculator = new WiringHarmonicsCalculator();
        this.componentFactory = new ComponentFactory(this.gameEngine);
        this.hullGenerator = new HullGenerator(this.physxProvider);
        this.greebleGenerator = new GreebleGenerator(this.modelLoader);
        this.wiringGenerator = new WiringGenerator();

        this.shipGenerator = new ShipGenerator(this.wiringGenerator, this.gameEngine);
        this.shipAssembler = new ShipAssembler(this.componentFactory, this.hullGenerator, this.greebleGenerator, this.wiringGenerator, this.gameEngine);

        // Initialize UHPP Pipeline for advanced generation
        this.uhpp = new UniversalPipeline();
        this.uhpp
            .addStage(new NoiseHeuristic())
            .addStage(new LSystemBridge())
            .addStage(new WFCManager())
            .addStage(new CellularAutomata())
            .addStage(new SurfaceSynth());

        this.renderBridge = null; // Lazy init or remove if unused

        this.shipCache = new Map();

        this.currentShipAssembly = {
            hull: null,
            components: new Map(), // Stores assembled components: { id: { model, config, connections } }
            wiringGraph: {}, // Adjacency list for wiring connections
            totalWiringLength: 0,
            harmonics: {} // Calculated harmonics
        };

        console.log("ShipFactory initialized.");
    }

    /**
     * Generates a random ship layout based on a seed or parameters.
     * This creates a procedural ship with symmetry, varied components, and wiring.
     * @param {number|string} seed - Seed for random generation.
     * @param {object} config - Configuration options (size, techLevel, style).
     * @returns {Array<object>} List of component definitions ready for generation.
     */
    async createRandomShip(seed, config = {}) {
        return await this.shipGenerator.createRandomShip(seed, config);
    }

    /**
     * Generates a ship procedurally from a component layout and style.
     * @param {Array<object>} components - An array of component definitions (type, dims, pos, rot).
     * @param {object} styleConfig - Configuration for the hull generation (e.g., { method: 'INDUSTRIAL', plating: true }).
     * @returns {THREE.Group} A group containing the generated ship.
     */
    generateProceduralShip(components, styleConfig, interior) {
        return this.shipAssembler.generateProceduralShip(components, styleConfig, interior);
    }

    async generateProceduralShipAsync(components, styleConfig, interior) {
        return this.shipAssembler.generateProceduralShipAsync(components, styleConfig, interior);
    }

    /**
     * Loads a ship assembly blueprint (e.g., from ship.json) and constructs the ship.
     * @param {string} assemblyUrl - URL to the ship assembly JSON file.
     * @returns {Promise<object>} A promise that resolves with the assembled ship object.
     */
    async buildShipFromAssembly(assemblyUrl) {
        const assemblyBlueprint = await this.modelLoader.loadJSONModel(assemblyUrl);
        if (!assemblyBlueprint || !assemblyBlueprint.components) {
            throw new Error("Invalid ship assembly blueprint provided.");
        }

        this.resetAssembly();

        // Load hull first
        const hullConfig = assemblyBlueprint.components.find(c => c.id === 'hull');
        if (hullConfig) {
            await this.addComponent('hull', hullConfig.modelUrl, hullConfig);
            this.currentShipAssembly.hull = this.currentShipAssembly.components.get('hull');
            console.log(`Ship hull loaded: ${hullConfig.modelUrl}`);
        } else {
            console.warn("No hull defined in assembly blueprint.");
        }

        // Load other components
        for (const compConfig of assemblyBlueprint.components) {
            if (compConfig.id === 'hull') continue; // Already handled
            await this.addComponent(compConfig.id, compConfig.modelUrl, compConfig);
            console.log(`Component loaded: ${compConfig.id} - ${compConfig.modelUrl}`);
        }

        this.calculateShipHarmonics();
        console.log("Ship assembly complete.");
        return this.currentShipAssembly;
    }

    /**
     * Resets the current ship assembly, clearing all components and wiring.
     */
    resetAssembly() {
        this.currentShipAssembly.components.forEach((comp, id) => {
            if (comp.model) {
                this.gameEngine.scene.removeObject(id); // Remove from scene if it was added
            }
        });
        this.currentShipAssembly = {
            hull: null,
            components: new Map(),
            wiringGraph: {},
            totalWiringLength: 0,
            harmonics: {}
        };
        console.log("Ship assembly reset.");
    }

    /**
     * Adds a component to the ship assembly.
     * @param {string} id - Unique identifier for the component.
     * @param {string} modelUrl - URL to the component's model file.
     * @param {object} config - Configuration for the component (position, rotation, physics, etc.).
     * @returns {Promise<object>} The added component object.
     */
    async addComponent(id, modelUrl, config) {
        if (this.currentShipAssembly.components.has(id)) {
            console.warn(`Component '${id}' already exists. Overwriting.`);
            this.removeComponent(id); // Remove existing before adding new
        }

        const componentConfig = { ...config, modelUrl };
        let model = null;
        try {
            // Use Scene's addObject to handle loading and adding to Three.js group
            const addedObject = await this.gameEngine.scene.addObject(id, componentConfig);
            model = addedObject.model;
        } catch (error) {
            console.error(`Error adding component '${id}' to scene:`, error);
        }

        const component = {
            id: id,
            model: model, // The loaded Three.js object or parsed JSON data
            config: componentConfig,
            connections: new Map() // Stores wiring connections from this component
        };
        this.currentShipAssembly.components.set(id, component);
        return component;
    }

    /**
     * Removes a component from the ship assembly.
     * @param {string} id - Unique identifier of the component to remove.
     */
    removeComponent(id) {
        if (this.currentShipAssembly.components.has(id)) {
            this.gameEngine.scene.removeObject(id); // Remove visual and physics object from scene

            // Remove all wiring connections to/from this component
            delete this.currentShipAssembly.wiringGraph[id];
            this.currentShipAssembly.components.forEach(comp => {
                if (comp.connections.has(id)) {
                    comp.connections.delete(id);
                    this.currentShipAssembly.wiringGraph[comp.id] = this.currentShipAssembly.wiringGraph[comp.id].filter(target => target !== id);
                }
            });

            this.currentShipAssembly.components.delete(id);
            this.calculateShipHarmonics(); // Recalculate harmonics
            console.log(`Component '${id}' removed.`);
        } else {
            console.warn(`Attempted to remove non-existent component: '${id}'.`);
        }
    }

    /**
     * Connects two components with wiring.
     * @param {string} componentAId - ID of the first component.
     * @param {string} componentBId - ID of the second component.
     * @param {number} length - The physical length of the wiring between the components.
     * @param {string} wiringType - The type of wiring (e.g., "electrical", "plasma_conduit").
     */
    connectComponents(componentAId, componentBId, length, wiringType) {
        const compA = this.currentShipAssembly.components.get(componentAId);
        const compB = this.currentShipAssembly.components.get(componentBId);

        if (!compA || !compB) {
            console.error(`Cannot connect: One or both components not found ('${componentAId}', '${componentBId}').`);
            return;
        }

        // Use WiringGenerator to add connection
        this.wiringGenerator.addConnection(this.currentShipAssembly.wiringGraph, componentAId, componentBId, wiringType, length);

        this.calculateShipHarmonics(); // Recalculate harmonics
        console.log(`Components '${componentAId}' and '${componentBId}' connected with wiring length ${length} (${wiringType}).`);
    }

    /**
     * Calculates the total wiring length and harmonics for the current ship assembly.
     */
    calculateShipHarmonics() {
        this.currentShipAssembly.harmonics = this.harmonicsCalculator.calculate(this.currentShipAssembly.wiringGraph, this.currentShipAssembly.components);
        console.log(`Ship harmonics recalculated.`);
    }

    /**
     * Gets the current assembled ship object.
     * @returns {object} The current ship assembly data.
     */
    getCurrentShipAssembly() {
        return this.currentShipAssembly;
    }
}
