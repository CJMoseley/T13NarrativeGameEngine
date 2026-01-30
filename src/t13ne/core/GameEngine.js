/**
 * @module Core/GameEngine
 * @description
 * Manages the core game state, player data, and simulation updates.
 * This class is NOT responsible for UI or scene management.
 */

import { ShipFactory } from './ship/ShipFactory.js';
import { GalaxyGenerator } from '@/js/procgen/galaxy/GalaxyGenerator.js';
import { LoreData } from '@/js/procgen/lore/LoreData.js';
import { PluginManager } from './PluginManager.js';
import { GalacticHistory } from '@/js/procgen/galaxy/GalacticHistory.js';
import { Ship } from '@/js/procgen/ships/Ship.js';
import { ShipLayouts } from '@/js/procgen/ships/ShipLayouts.js';
import { ProceduralComponentGenerator } from '@/js/procgen/ships/components/ProceduralComponentGenerator.js';
import { AdvancedPhysicsEngine } from './AdvancedPhysicsEngine.js';
import { HyperphysicsEngine } from './HyperphysicsEngine.js';
import { LoreMaster } from '@/js/procgen/lore/LoreMaster.js';
import { SoundEngine } from './SoundEngine.js';
import { EngineSoundGenerator } from '@/js/sounds/EngineSoundGenerator.js';
import { WormholeAmbiance } from '@/js/sounds/WormholeAmbiance.js';
import { WebRTCManager } from '@/js/net/WebRTCManager.js';
import { VOIPManager } from './VOIPManager.js';
import { EventBus } from './EventBus.js';
import Logger from './Logger.js';

/**
 * @class GameEngine
 * @description
 * Manages the core game state, player data, and simulation updates.
 * This class is NOT responsible for UI or scene management.
 */
export class GameEngine {
    /**
     * @constructor
     */
    constructor(engine) {
        const funcName = 'GameEngine.constructor';
        Logger.start(funcName);

        this.engine = engine; // Reference to T13NE Engine Core

        // Core Systems
        this.physicsEngine = new AdvancedPhysicsEngine(this);
        this.pluginManager = this.engine ? this.engine.pluginManager : new PluginManager(this);
        this.soundEngine = this.engine ? this.engine.soundEngine : new SoundEngine();
        this.hyperphysicsEngine = new HyperphysicsEngine(this.physicsEngine);
        this.componentGenerator = new ProceduralComponentGenerator();
        this.shipFactory = new ShipFactory(this, this.physicsEngine.physx);
        this.loreMaster = null;

        // Sound Generators (to be managed by scenes)
        this.engineSound = null;
        this.wormholeAmbiance = null;

        // Networking
        this.webRTCManager = null;
        this.voipManager = null;
        this.signaling = null;

        // Data Generators (initialized after data is loaded)
        this.galaxyGenerator = null;
        this.galaxy = null; // To hold the canonical Galaxy object

        // Player State
        this.playerShip = null;
        this.playerStartSystem = null;
        this.playerSpecies = null;
        this.nearbyStartSystems = [];
        this.playerCharacter = null;
        this.crew = [];
        this.galacticPlot = null;
        this.availablePlayerSpecies = [];
        this.database = { ships: [] }; // Mock database

        Logger.message("GameEngine: Instantiated.");
        Logger.end(funcName);
    }

    /**
     * Initializes the data-dependent components of the game engine.
     * This must be called after core data (LoreData, GalacticHistory) has been loaded.
     * @async
     */
    async initializeDataDependents() {
        const funcName = 'GameEngine.initializeDataDependents';
        Logger.start(funcName);

        try {
            // Instantiate LoreMaster
            this.loreMaster = new LoreMaster(this.pluginManager);
            await this.loreMaster.initialize();
            Logger.message('GameEngine: LoreMaster instantiated and initialized.');

            this.galaxyGenerator = new GalaxyGenerator(this.loreMaster);
            Logger.message('GameEngine: GalaxyGenerator instantiated.');
            this.galaxy = this.galaxyGenerator.generateGalaxy();

            if (!this.galaxy || !this.galaxy.stars || this.galaxy.stars.length === 0) {
                throw new Error("Galaxy generation failed or produced no stars.");
            }
            Logger.message('GameEngine: Galaxy instance created.');

            const startPosPromise = this._determineRandomStartPosition();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Start position determination timed out")), 15000));

            await Promise.race([startPosPromise, timeoutPromise]);

            // --- T13 Character & Plot Generation ---
            if (this.loreMaster && this.loreMaster.characterGenerator) {
                // 1. Generate Player Character (Detailed)
                this.playerCharacter = await this.loreMaster.characterGenerator.generateCharacter('Detailed');
                this.playerCharacter.name = "Player"; // Placeholder, usually set by UI
                Logger.message("GameEngine: Player Character generated with T13 Tapestry.");

                // 2. Generate Crew (Cast/Archetype Extras)
                const crewRoles = ['Navigator', 'Engineer', 'Gunner', 'Comms'];
                for (const role of crewRoles) {
                    const crewMember = await this.loreMaster.characterGenerator.generateCharacter('Archetype');
                    crewMember.role = role;
                    this.crew.push(crewMember);
                }
                Logger.message(`GameEngine: Generated ${this.crew.length} crew members.`);
            }

            this.galacticPlot = this.generateGalacticCycle();
            Logger.message("GameEngine: Data-dependent initialization complete.");
            EventBus.emit('engine:initialized', this);
        } catch (error) {
            Logger.error("GameEngine: Critical error during data initialization.", error);
            EventBus.emit('engine:initialization_failed', error);
            throw error; // Re-throw to let LoaderManager handle it
        } finally {
            Logger.end(funcName);
        }
    }

    /**
     * Generates the overarching Galactic History Cycle Plot using T13NE structures.
     * This defines the current era's major conflict.
     */
    generateGalacticCycle() {
        Logger.message("GameEngine: Generating Galactic Cycle Plot...");
        // A Cycle Plot is Rank 13.
        // We define a central conflict that drives the Wormhole Racing League context.
        return {
            rank: "Cycle",
            name: "The Velocity Era",
            description: "A galactic era defined by the rush for wormhole technology and the prestige of the Racing Leagues.",
            conflict: {
                dominant: "Liberty", // Freedom of movement/speed
                pressed: "Dominion", // Control/Regulation/Corporate Monopolies
                facets: ["Liberty", "Dominion", "Craft", "Wealth"]
            },
            tension: 3, // Aware - The conflict is known but not yet in open war
            yarn: 13, // Initial Yarn pool for the plot
            embodiments: {
                dominant: "The Racing Leagues",
                pressed: "Galactic Trade Federation",
                external: "The Increated (Wormhole Entities)"
            },
            subplots: [] // Will be populated as the game progresses
        };
    }

    /**
     * Finds a random starting star for the player.
     * @private
     */
    async _determineRandomStartPosition() {
        const allStars = this.galaxy.stars;
        if (allStars.length === 0) {
            Logger.error("Cannot determine start position: No stars have been generated.");
            return;
        }

        const discStars = allStars.filter(star => {
            const rNorm = star.r;
            return rNorm > LoreData.galacticDefinition.coreRadius && rNorm < 0.9;
        });

        const startPool = discStars.length > 0 ? discStars : allStars;
        this.playerStartSystem = startPool[Math.floor(Math.random() * startPool.length)];

        this.nearbyStartSystems = this._findClosestSystems(this.playerStartSystem, startPool, 12);

        const availableSpeciesSet = new Set();
        await Promise.all(this.nearbyStartSystems.map(async (system) => {
            const details = await this.galaxyGenerator.getSystemDetails(system);
            if (details && details.speciesKey && details.speciesKey !== 'FirstRelic') {
                availableSpeciesSet.add(details.speciesKey);
            }
        }));
        this.availablePlayerSpecies = Array.from(availableSpeciesSet);
    }

    /**
     * Finds the N closest stars to a given center star.
     * @private
     */
    _findClosestSystems(centerStar, starList, count) {
        const distances = starList.map(star => {
            const dx = star.x - centerStar.x;
            const dy = star.y - centerStar.y;
            const dz = star.z - centerStar.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return { star, distance };
        });

        distances.sort((a, b) => a.distance - b.distance);
        return distances.slice(0, count).map(d => d.star);
    }

    /**
     * Seeds the local database with a default ship for testing purposes.
     * @returns {Ship} The created ship.
     */
    async seedPlayerShip() {
        // 1. Create a new Ship instance
        const ship = new Ship("Rookie Ship");

        // 2. Get a ship layout and set it on the ship
        // Redesigned layout: "Wormhole Slider" - Sleek, shield-driven racer.
        const testLayout = {
            name: "Wormhole Slider Prototype",
            components: [
                // 1. Bridge - Cockpit (Swapped order, shrunk, and positioned)
                { usage: "Bridge", pos: [0, 0, 3.5], rot: [0, 0, 0], type: "ellipsoid", dims: { width: 0.6, height: 0.7, length: 2.5 } },
                // 2. Central Fuselage - Main Body
                { usage: "Fuselage", pos: [0, 0, -1.0], rot: [0, 0, 0], type: "box", dims: { width: 1.5, height: 1.0, depth: 9.0 } },
                // 3. Nose Cone - Pointing Forward (Raised Y to 0 to match fuselage)
                { usage: "Nose", pos: [0, 0, 5.5], rot: [Math.PI / 2, 0, 0], type: "cone", dims: { radius: 0.65, height: 3.0 } },

                // 4. Shield Generator - Torus around Centre of Mass
                { usage: "ShieldGen", pos: [0, 0, 0], rot: [Math.PI / 2, 0, 0], type: "torus", dims: { radius: 1.2, tube: 0.3 } },

                // 5. Fuel Tanks / Side Intakes - Changed to boxes and moved back to avoid "lumps" look
                { usage: "FuelL", pos: [1.2, 0, -1.5], rot: [0, 0, 0], type: "box", dims: { width: 0.8, height: 0.8, depth: 5.0 } },
                { usage: "FuelR", pos: [-1.2, 0, -1.5], rot: [0, 0, 0], type: "box", dims: { width: 0.8, height: 0.8, depth: 5.0 } },

                // 6. Main Engines - Rear mounted
                { usage: "ThrusterL", pos: [1.2, 0, -4.5], rot: [Math.PI / 2, 0, 0], type: "cylinder", dims: { radiusTop: 0.6, radiusBottom: 0.8, height: 2.0 } },
                { usage: "ThrusterR", pos: [-1.2, 0, -4.5], rot: [Math.PI / 2, 0, 0], type: "cylinder", dims: { radiusTop: 0.6, radiusBottom: 0.8, height: 2.0 } },

                // 7. Wings - Wedge type
                { usage: "WingL", pos: [4.5, 0, -1.0], rot: [0, 0, 0], type: "wedge", dims: { width: 4.0, length: 3.0, depth: 0.2 } },
                { usage: "WingR", pos: [-4.5, 0, -1.0], rot: [0, 0, Math.PI], type: "wedge", dims: { width: 4.0, length: 3.0, depth: 0.2 } }
            ]
        };

        ship.setLayout(testLayout);

        // 3. Mock data for the component generator
        const mockCorporation = { name: "Generic Corp" };
        const species = 'Human';
        const techLevel = 1;

        // 4. Generate component definitions and add them to the ship
        const componentPromises = testLayout.components.map(async compInfo => {
            const def = await this.componentGenerator.generateComponent(
                { name: compInfo.usage }, // Template
                mockCorporation,
                species,
                techLevel,
                compInfo.usage
            );
            // Override shape properties if the layout specifies them (fixing the "cube" issue)
            if (compInfo.type) def.type = compInfo.type;
            if (compInfo.dims) def.dims = compInfo.dims;
            return def;
        });

        const componentDefinitions = await Promise.all(componentPromises);
        componentDefinitions.forEach((def, i) => {
            const layoutInfo = testLayout.components[i];
            ship.addComponent(def, layoutInfo.pos, layoutInfo.rot);
        });

        // 5. Generate a name for the ship
        const seed = Math.random();
        const shipName = await this.loreMaster.nameGenerator.generate('SHIP_NAMES', seed);
        ship.name = shipName;

        // 6. Generate the ship's mesh
        const styleConfig = { method: 'ORGANIC', plating: false, blendStrength: 1.5 };
        // Use async generation for visualization
        ship.mesh = await this.shipFactory.generateProceduralShipAsync(ship.components, styleConfig);

        this.playerShip = ship;
        this.database.ships.push(this.playerShip);

        return this.playerShip;
    }

    /**
     * Sets the player's chosen species and starting system.
     * @param {string} speciesKey - The key of the player's chosen species.
     * @param {object} systemStar - The star object of the player's chosen starting system.
     */
    setPlayerStart(speciesKey, systemStar) {
        this.playerSpecies = speciesKey;
        this.playerStartSystem = systemStar;
        Logger.message(`GameEngine: Player start set. Species: ${speciesKey}, System: ${systemStar.starClass}`);
    }

    /**
     * The main update function, called every frame by the active scene.
     * @param {number} deltaTime - The time since the last frame.
     */
    update(deltaTime) {
        // ... (rest of the file is unchanged)
    }
}
