/**
 * @module Core/GameEngine
 * @description
 * Manages the core game state, player data, and simulation updates.
 * This class is NOT responsible for UI or scene management.
 */

import { ShipFactory } from './ship/ShipFactory.js';
import { GalaxyGenerator } from '/src/t13ne/procgen/galaxy/GalaxyGenerator.js';
import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';
import { PluginManager } from './PluginManager.js';
import { GalacticHistory } from '/src/t13ne/procgen/galaxy/GalacticHistory.js';
import { Ship } from '/src/t13ne/procgen/ships/Ship.js';
import { ShipLayouts } from '/src/t13ne/procgen/ships/ShipLayouts.js';
import { ProceduralComponentGenerator } from '/src/t13ne/procgen/ships/components/ProceduralComponentGenerator.js';
import { AdvancedPhysicsEngine } from './AdvancedPhysicsEngine.js';
import { HyperphysicsEngine } from './HyperphysicsEngine.js';
import { LoreMaster } from '/src/t13ne/procgen/lore/LoreMaster.js';
import { SoundEngine } from './SoundEngine.js';
import { EngineSoundGenerator } from '/src/t13ne/sounds/EngineSoundGenerator.js';
import { WormholeAmbiance } from '/src/t13ne/sounds/WormholeAmbiance.js';
import { WebRTCManager } from '/src/t13ne/net/WebRTCManager.js';
import { VOIPManager } from './VOIPManager.js';
import { EventBus } from './EventBus.js';
import Logger from './Logger.js';
import { Controls } from './Controls.js';

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

        // Debug
        this.debugEnabled = false;
        this.debugTogglePressed = false;

        this.setupEventListeners();

        Logger.message("GameEngine: Instantiated.");
        Logger.end(funcName);
    }

    /**
     * Initializes the data-dependent components of the game engine.
     * This must be called after core data (LoreData, GalacticHistory) has been loaded.
     */
    setupEventListeners() {
        EventBus.on('request:generate:galaxy', async (seed) => {
            if (this.galaxy) {
                EventBus.emit('galaxy:generated', this.galaxy);
            } else {
                await this.initializeBaseData();
                // initializeBaseData now emits the event itself.
            }
        });

        EventBus.on('request:generate:history', async (galaxy, seed) => {
            if (seed) GalacticHistory.setSeed(seed);
            await GalacticHistory.load(this.pluginManager, this.loreMaster);
            EventBus.emit('history:generated', GalacticHistory.getTimeline());
        });

        EventBus.on('request:generate:system', async (galaxy, seed) => {
            if (!this.playerStartSystem) {
                await this._determineRandomStartPosition();
            }
            if (this.playerStartSystem) {
                await this.generateSystem();
            } else {
                Logger.error("GameEngine: Failed to determine start system, cannot generate system details.");
            }
            EventBus.emit('system:generated', { system: this.currentSystemDetails, planets: this.currentPlanets });
        });

        EventBus.on('request:generate:homeworld', (systemDetails, seed) => {
             const homeworld = this.currentPlanets ? this.currentPlanets.find(p => p.isHomeworld) : null;
             const species = this.currentSystemDetails ? this.currentSystemDetails.speciesCore : null;
             EventBus.emit('homeworld:generated', { planet: homeworld, species: species });
        });

        EventBus.on('request:generate:ship', async (data) => {
            await this.seedPlayerShip();
            EventBus.emit('ship:generated', this.playerShip);
        });
    }

    /**
     * Initializes the data-dependent components of the game engine.
     * This must be called after core data (LoreData, GalacticHistory) has been loaded.
     * @async
     */
    async initializeDataDependents() {
        await this.initializeBaseData();
        await this.initializeNarrativeData();
    }

    /**
     * Initializes the base data (Lore, History, Galaxy) needed for the first visual scene.
     */
    async initializeBaseData() {
        const funcName = 'GameEngine.initializeBaseData';
        Logger.start(funcName);
        const startTime = performance.now();

        try {
            Logger.message("GameEngine: Initializing LoreMaster...");
            this.loreMaster = new LoreMaster(this.pluginManager);
            await this.loreMaster.initialize();
            Logger.message(`GameEngine: LoreMaster initialized in ${(performance.now() - startTime).toFixed(2)}ms`);

            const GameModule = this.engine?.getModule('Game');
            const activeGame = GameModule?.getActiveGame();
            const galacticParams = {};
            if (activeGame?.seed) {
                galacticParams.seed = activeGame.seed;
                GalacticHistory.setSeed(activeGame.seed);
            }

            // DO NOT load GalacticHistory here - it's too slow and blocks the intro visuals.
            // It will be loaded in initializeNarrativeData which runs during the intro.

            Logger.message("GameEngine: Starting Galaxy Generation...");
            const galaxyStartTime = performance.now();
            this.galaxyGenerator = new GalaxyGenerator(this.loreMaster, galacticParams);
            this.galaxy = await this.galaxyGenerator.generateGalaxy();
            Logger.message(`GameEngine: Galaxy generated in ${(performance.now() - galaxyStartTime).toFixed(2)}ms`);

            if (!this.galaxy || !this.galaxy.stars || this.galaxy.stars.length === 0) {
                throw new Error("Galaxy generation failed or produced no stars.");
            }

            EventBus.emit('galaxy:generated', this.galaxy);

            const tapestry = this.engine.getModule('Tapestry');
            this.galaxy.name = tapestry?.galaxyName || "The Galaxy";

            Logger.message(`GameEngine: Base data initialization complete in ${(performance.now() - startTime).toFixed(2)}ms. Galaxy: ${this.galaxy.name}`);
        } catch (error) {
            Logger.error("GameEngine: Failed to initialize base data.", error);
            throw error;
        } finally {
            Logger.end(funcName);
        }
    }

    /**
     * Initializes the narrative data (Start system, plots) which can happen during the intro.
     */
    async initializeNarrativeData() {
        const funcName = 'GameEngine.initializeNarrativeData';
        Logger.start(funcName);

        try {
            // Ensure history is loaded first as start position logic needs it for dominant species
            await GalacticHistory.load(this.pluginManager, this.loreMaster);

            const startPosPromise = this._determineRandomStartPosition();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Start position determination timed out")), 20000));

            await Promise.race([startPosPromise, timeoutPromise]);

            this.galacticPlot = await this.generateGalacticCycle();
            Logger.message("GameEngine: Narrative initialization complete.");
            EventBus.emit('engine:initialized', this);
        } catch (error) {
            Logger.error("GameEngine: Failed to initialize narrative data.", error);
            EventBus.emit('engine:initialization_failed', error);
            throw error;
        } finally {
            Logger.end(funcName);
        }
    }

    /**
     * Waits for the narrative initialization to complete.
     */
    async waitForNarrativeInit() {
        if (this.galacticPlot) return this;
        return new Promise((resolve) => {
            EventBus.once('engine:initialized', () => resolve(this));
        });
    }

    /**
     * Generates the detailed stellar system data for the player's start location.
     * Requires Galaxy to be initialized.
     */
    async generateSystem() {
        if (!this.playerStartSystem) return;
        const systemDetails = await this.galaxyGenerator.getSystemDetails(this.playerStartSystem);
        const systemGen = this.loreMaster.stellarSystemGenerator;
        const planets = await systemGen.generatePlanets(systemDetails);
        this.currentSystemDetails = systemDetails;
        this.currentPlanets = planets;
        Logger.message(`GameEngine: Generated System ${systemDetails.name}`);
    }

    /**
     * Generates the Player and Crew.
     * Requires System to be initialized (for home system context).
     */
    async generateCharacters() {
        if (this.loreMaster && this.loreMaster.characterGenerator) {
            this.playerCharacter = await this.loreMaster.characterGenerator.generateCharacter('Detailed');
            this.playerCharacter.name = "Player"; // Default name

            // Crew generation is game-specific and should be handled by the specific game logic or Tapestry
            this.crew = [];
            Logger.message(`GameEngine: Generated Player Character.`);
        }
    }

    /**
     * Generates the overarching Galactic History Cycle Plot using T13NE structures.
     * This defines the current era's major conflict.
     */
    async generateGalacticCycle() {
        Logger.message("GameEngine: Generating Galactic Cycle Plot...");

        // Try to get cycle from Tapestry
        const tapestry = this.engine.getModule('Tapestry');
        if (tapestry && tapestry.currentCycle) {
            return tapestry.currentCycle;
        }

        // Use Referee to generate a real Narrative Cycle
        const Referee = this.engine.getModule('Referee');
        if (Referee) {
            const currentAge = GalacticHistory.getTimeline()?.slice(-1)[0]; // Get the most recent age
            const name = currentAge ? currentAge.age : "The Current Era";
            const desc = currentAge ? currentAge.description : "A time of uncertainty.";

            return await Referee.generateCycle(name, {
                description: desc,
                scale: 'Galactic',
                isHistoryBased: true
            });
        }

        // Generic Fallback (only if Referee is missing)
        return {
            rank: "Cycle",
            name: "Current Era",
            description: "The current era of the galaxy (Referee not loaded).",
            conflict: { dominant: "Stasis", pressed: "Entropy" },
            tension: 1,
            yarn: 13,
            embodiments: {},
            subplots: []
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

        const prng = this.engine.getModule('PRNG').create(this.galaxy.seed || 'start-pos');
        this.playerStartSystem = startPool[Math.floor(prng.nextDouble() * startPool.length)];

        this.nearbyStartSystems = this._findClosestSystems(this.playerStartSystem, startPool, 12);

        const availableSpeciesSet = new Set();
        await Promise.all(this.nearbyStartSystems.map(async (system) => {
            const details = await this.galaxyGenerator.getSystemDetails(system, { quick: true });
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
        // 0. Derive seed from start system
        const systemSeed = this.currentSystemDetails?.seeds?.join(',') || 'fallback-ship-seed';
        const shipSeed = this.engine.getModule('PRNG').deriveSeed(systemSeed, 'player-ship');

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
        const shipName = await this.loreMaster.nameGenerator.generate('SHIP_NAMES', shipSeed);
        ship.name = shipName;

        // 6. Generate the ship's mesh
        const styleConfig = { method: 'ORGANIC', plating: false, blendStrength: 1.5 };
        // Use seeded creation if possible via ShipFactory
        const proceduralComponents = await this.shipFactory.createRandomShip(shipSeed, { style: 'RACING' });

        // Use async generation for visualization
        ship.mesh = await this.shipFactory.generateProceduralShipAsync(proceduralComponents, styleConfig);

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
     * @param {number} time - The high-resolution timestamp from requestAnimationFrame.
     * @param {number} delta - The time in milliseconds since the last frame.
     */
    update(time, delta) {
        if (this.physicsEngine) {
            this.physicsEngine.update(time, delta);
        }

        // Update sound generators if active
        if (this.engineSound) this.engineSound.update(time, delta);
        if (this.wormholeAmbiance) this.wormholeAmbiance.update(time, delta);

        // Handle Debug Toggle
        const debugToggle = Controls.isPressed(this.physicsEngine.keys, 'system_actions', 'DEBUG_TOGGLE');
        if (debugToggle && !this.debugTogglePressed) {
            this.debugEnabled = !this.debugEnabled;
            Logger.log(`Debug mode: ${this.debugEnabled ? 'ON' : 'OFF'}`);

            // Toggle visibility of general debug elements
            const debugElements = document.querySelectorAll('.t13ne-debug');
            debugElements.forEach(el => {
                el.style.display = this.debugEnabled ? '' : 'none';
            });

            // Toggle specific known debug overlays
            const audioDebug = document.getElementById('audio-debug-viz');
            if (audioDebug) {
                audioDebug.style.display = this.debugEnabled ? 'block' : 'none';
            }

            const viewDebug = document.getElementById('view-debug-container');
            if (viewDebug) {
                viewDebug.style.display = this.debugEnabled ? 'block' : 'none';
            }

            // Propagate to current scene
            if (this.engine.sceneManager && this.engine.sceneManager.currentScene) {
                const scene = this.engine.sceneManager.currentScene;
                if (typeof scene.toggleDebug === 'function') {
                    scene.toggleDebug(this.debugEnabled);
                } else if (scene.debugLayer) {
                    scene.debugLayer.visible = this.debugEnabled;
                }
            }
        }
        this.debugTogglePressed = debugToggle;
    }
}
