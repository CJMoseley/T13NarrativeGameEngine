import Logger from '/src/t13ne/core/Logger.js';
import IntroSequence from '/src/t13ne/core/ui/IntroSequence.js';
import Localization from '/src/t13ne/core/ui/Localization.js';
import * as THREE from 'three';

/**
 * @module Core/LoaderManager
 * @description
 * Manages the entire loading sequence of the application. It orchestrates the initialization of various managers,
 * loading of assets, and the visual intro sequence.
 */

/**
 * @class LoaderManager
 * @description
 * Handles the step-by-step loading of all major game components. This includes plugins,
 * physics, lore data, and the initial visual scene sequence. It provides feedback to the user
 * via the `IntroSequence` UI.
 */
class LoaderManager {
    /**
     * @constructor
     * @param {ViewManager} viewManager - The main view manager instance.
     */
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.engine = viewManager.engine; // T13NE Engine
        this.gameEngine = viewManager.gameEngine;
        this.pluginManager = viewManager.pluginManager;
        this.loreDataManager = viewManager.loreDataManager;
        this.galacticHistoryManager = viewManager.galacticHistoryManager;

        /**
         * The sequence of tasks to be executed during the loading process.
         * Each task has a name for progress reporting and an action to execute.
         * @type {Array<Object>}
         */
        this.tasks = [
            { name: 'Sound Engine', action: () => this.viewManager.engine.soundEngine.init() },
            {
                name: 'System Check', action: async () => {
                    const soundEngine = this.viewManager.engine.soundEngine;
                    if (soundEngine && soundEngine.audioContext && soundEngine.audioContext.state === 'suspended') {
                        Logger.message("AudioContext suspended. Requesting permission immediately.");
                        this.reportProgress("Click to Initialize Systems...");

                        await new Promise(resolve => {
                            const startBtn = document.getElementById('start-button');
                            if (startBtn) {
                                startBtn.style.display = 'block';
                                startBtn.onclick = async () => {
                                    startBtn.style.display = 'none';
                                    this.reportProgress("Initializing...");
                                    await new Promise(r => setTimeout(r, 100));
                                    await soundEngine.audioContext.resume();
                                    resolve();
                                };
                            } else {
                                IntroSequence.promptForInteraction(async () => {
                                    await soundEngine.audioContext.resume();
                                    resolve();
                                });
                            }
                        });
                    }
                }
            },
            { name: 'Physics Engine', action: () => this.gameEngine.physicsEngine.init() },
            { name: 'Load T13 Core', action: async () => {
                if (this.engine.loadModules) await this.engine.loadModules();
                
                // Manually register T13 Core APIs since it's no longer a plugin
                // This ensures generators can find 'T13' APIs via PluginManager
                if (this.pluginManager) {
                    this.pluginManager.exposeApi('T13', 'T13NE', this.engine);
                    
                    const modules = ['Codex', 'CardsAPI', 'T13Geometry', 'Tapestry'];
                    modules.forEach(m => {
                        const mod = this.engine.getModule(m);
                        if (mod) this.pluginManager.exposeApi('T13', m, mod);
                    });
                    Logger.message("LoaderManager: T13 Core APIs registered manually.");
                }
            }},
            { name: 'Discover Plugins', action: () => this.pluginManager.discoverAndLoadPlugins(this) },
            { name: 'Initialize Plugins', action: () => this.pluginManager.initializePlugins(this) },
            { name: 'Lore Data', action: () => this.loreDataManager.load() },
            { name: 'Game Engine Data', action: () => this.gameEngine.initializeDataDependents() },

            // 1. Start Audio with Galaxy (Immediate Feedback)
            {
                name: 'Initialize Audio', action: async () => {
                    const music = this.viewManager.engine.getModule('Music');
                    if (music) {
                        music.injectThemeComponents({ galaxy: this.gameEngine.galaxy });
                        this.reportProgress("Starting Galaxy Theme...");
                        const theme = await music.createMainTheme(this.gameEngine);
                        if (theme) music.playTrackObject(theme);
                    }
                }
            },

            // Visual Loading Sequence - Now queued via ViewManager
            {
                name: 'Queue Visuals', action: async () => {
                    // Hide IntroSequence to reveal the visual sequence
                    IntroSequence.hide();

                    // 1. Galaxy View
                    // We clear the previous cue and replace it with a more complex one.
                    this.viewManager.sceneQueue = []; // Clear any previous cues just in case

                    this.viewManager.cueScene('GalaxyMapScene', { attractMode: true }, {
                        duration: 4000,
                        onActive: async (scene) => {
                            // 1. Generate System (for the next view)
                            const systemGenPromise = (async () => {
                                const music = this.viewManager.engine.getModule('Music');

                                await this.gameEngine.generateSystem();
                                if (music && this.gameEngine.currentSystemDetails) {
                                    music.injectThemeComponents({ currentSystem: this.gameEngine.currentSystemDetails });
                                    const theme = await music.createMainTheme(this.gameEngine);
                                    music.updateTrack(theme);
                                }

                                // Update the next scenes in the queue with the generated data
                                const localSpaceItem = this.viewManager.sceneQueue.find(i => i.name === 'LocalSpaceScene');
                                if (localSpaceItem) {
                                    localSpaceItem.data.systemDetails = this.gameEngine.currentSystemDetails;
                                    localSpaceItem.data.planets = this.gameEngine.currentPlanets;
                                }
                                const orbitItem = this.viewManager.sceneQueue.find(i => i.name === 'PlanetaryOrbitScene');
                                if (orbitItem) {
                                    orbitItem.data.system = this.gameEngine.currentSystemDetails;
                                    orbitItem.data.planet = this.gameEngine.currentPlanets ? this.gameEngine.currentPlanets[0] : null;
                                }
                            })();

                            // Wait a bit then focus
                            await new Promise(r => setTimeout(r, 1000));
                            if (scene && typeof scene.focusOnSystem === 'function' && this.gameEngine.playerStartSystem) {
                                await scene.focusOnSystem(this.gameEngine.playerStartSystem);
                            }
                            
                            // Ensure generation is complete before the scene transitions
                            await systemGenPromise;
                        }
                    });

                    // 3. System View
                    if (this.gameEngine.playerStartSystem) {
                        this.viewManager.cueScene('LocalSpaceScene', {
                            systemDetails: this.gameEngine.currentSystemDetails,
                            planets: this.gameEngine.currentPlanets,
                            star: this.gameEngine.playerStartSystem,
                            galaxy: this.gameEngine.galaxy,
                            playIntro: true
                        }, {
                            duration: 0, // Wait for onActive to finish
                            transition: { type: 'crossDissolve', duration: 2000 },
                            onActive: async (scene) => {
                                if (typeof scene.playIntroSequence === 'function') {
                                    await scene.playIntroSequence();
                                }
                            }
                        });

                        // 3.5 Planetary Orbit
                        this.viewManager.cueScene('PlanetaryOrbitScene', {
                            planet: this.gameEngine.currentPlanets ? this.gameEngine.currentPlanets[0] : null,
                            system: this.gameEngine.currentSystemDetails,
                            sunDirection: new THREE.Vector3(1, 0.5, 1).normalize() // Fallback
                        }, {
                            duration: 10000,
                            transition: { type: 'fade', duration: 1500 },
                            onActive: async (scene) => {
                                // 2. Generate Ship (for the next view)
                                const shipGenPromise = (async () => {
                                    await this.gameEngine.seedPlayerShip();
                                    const music = this.viewManager.engine.getModule('Music');
                                    if (music && this.gameEngine.playerShip) {
                                        music.injectThemeComponents({ playerShip: this.gameEngine.playerShip });
                                        const theme = await music.createMainTheme(this.gameEngine);
                                        music.updateTrack(theme);
                                    }
                                })();
                                await shipGenPromise;
                            }
                        });
                    }

                    // 4. Ship Showcase
                    this.viewManager.cueScene('ShipShowcaseScene', {}, {
                        duration: 0, // It handles its own exit
                        onActive: async () => {
                            IntroSequence.hide(); // Reveal scene
                        },
                        transition: { type: 'wipe', duration: 1200, direction: 'up' }
                    });

                    // Start the sequence and WAIT for it to finish
                    // This prevents the UI from overlaying "Welcome" text on top of the ship generation
                    await this.viewManager.playSequence();
                }
            },

            { name: 'Galactic History', action: () => this.galacticHistoryManager.load(this.pluginManager, this.gameEngine.loreMaster) },
        ];
    }

    /**
     * Reports progress to the user via the IntroSequence UI.
     * @param {string} message - The message to display.
     */
    reportProgress(message) {
        IntroSequence.updateStatus(message);
    }

    /**
     * Executes all loading tasks in sequence.
     * @async
     */
    async loadAll() {
        Logger.message('LoaderManager: Starting all loading tasks...');
        IntroSequence.show();

        for (const task of this.tasks) {
            try {
                this.reportProgress(`Loading ${task.name}...`);
                Logger.message(`LoaderManager: Starting task '${task.name}'...`);

                // Reveal the scene before generating the ship so the user can see the process
                if (task.name === 'Ship Showcase') {
                    IntroSequence.hide();
                }

                // Add a timeout to prevent infinite hanging, but skip for interactive/long tasks
                const useTimeout = !['Queue Visuals', 'Audio Systems', 'System Check'].includes(task.name);
                let timeoutId;

                try {
                    if (useTimeout) {
                        const timeoutPromise = new Promise((_, reject) =>
                            timeoutId = setTimeout(() => reject(new Error(`Task '${task.name}' timed out after 30s`)), 30000)
                        );
                        await Promise.race([task.action(), timeoutPromise]);
                    } else {
                        await task.action();
                    }
                } finally {
                    if (timeoutId) clearTimeout(timeoutId);
                }

                Logger.message(`LoaderManager: Task '${task.name}' completed.`);
            } catch (error) {
                const errorMessage = `LoaderManager: Failed to load ${task.name}. Halting execution.`;
                Logger.error(errorMessage, error);
                this.reportProgress(`ERROR: ${errorMessage}. See console for details.`);
                // Stop further loading on error
                return;
            }
        }

        this.reportProgress(Localization.__('READY_MESSAGE', { message: 'All systems initialized. Welcome, racer.' }));
        Logger.message('LoaderManager: All tasks completed successfully.');

        // Create a standalone button to continue, ensuring it's visible over the canvas
        // This button allows skipping the intro sequence if it gets stuck or user wants to skip
        const continueButton = document.createElement('button');
        continueButton.innerText = Localization.__('CONTINUE_BUTTON');
        continueButton.className = 'menu-button';
        continueButton.style.position = 'absolute';
        continueButton.style.bottom = '50px';
        continueButton.style.left = '50%';
        continueButton.style.transform = 'translateX(-50%)';
        continueButton.style.zIndex = '10000'; // Ensure it's on top of everything, including Intro
        continueButton.id = 'loader-continue-btn';
        continueButton.style.cursor = 'pointer';
        continueButton.style.padding = '10px 20px';
        continueButton.style.fontSize = '16px';
        continueButton.style.borderRadius = '5px';
        continueButton.style.width = 'auto'; // Prevent filling width

        continueButton.onclick = () => {
            continueButton.remove();
            if (typeof IntroSequence !== 'undefined') {
                IntroSequence.hide();
            }
            this.viewManager.sceneQueue = []; // Stop the sequence
            this.viewManager.showMainMenu();
        };

        document.body.appendChild(continueButton);

        // Hook into ViewManager to remove button when sequence ends naturally
        const originalShowMainMenu = this.viewManager.showMainMenu.bind(this.viewManager);
        this.viewManager.showMainMenu = () => {
            const btn = document.getElementById('loader-continue-btn');
            if (btn) btn.remove();
            if (typeof IntroSequence !== 'undefined') {
                IntroSequence.hide();
            }
            originalShowMainMenu();
        };
    }
}

export default LoaderManager;
