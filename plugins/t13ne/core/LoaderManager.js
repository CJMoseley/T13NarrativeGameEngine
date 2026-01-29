import Logger from './Logger.js';
import IntroSequence from '@/js/ui/IntroSequence.js';
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
            { name: 'Plugins', action: () => this.pluginManager.discoverAndLoadPlugins(this) },
            { name: 'Initialize Plugins', action: () => this.pluginManager.initializePlugins(this) },
            { name: 'Physics Engine', action: () => this.gameEngine.physicsEngine.init() },
            { name: 'Lore Data', action: () => this.loreDataManager.load() },
            { name: 'Game Engine Data', action: () => this.gameEngine.initializeDataDependents() },

            // Visual Loading Sequence - Now queued via ViewManager
            { name: 'Queue Visuals', action: async () => {
                // Hide IntroSequence to reveal the visual sequence
                IntroSequence.hide();

                // 1. Galaxy View
                // We clear the previous cue and replace it with a more complex one.
                this.viewManager.sceneQueue = []; // Clear any previous cues just in case

                this.viewManager.cueScene('GalaxyMapScene', { attractMode: true }, {
                    duration: 4000,
                    onActive: async (scene) => {
                        // Wait a bit then focus
                        await new Promise(r => setTimeout(r, 1000));
                        if (scene && typeof scene.focusOnSystem === 'function' && this.gameEngine.playerStartSystem) {
                            await scene.focusOnSystem(this.gameEngine.playerStartSystem);
                        }
                    }
                });

                // 3. System View
                // We need to prepare the data for the system view first
                if (this.gameEngine.playerStartSystem) {
                    const systemDetails = await this.gameEngine.galaxyGenerator.getSystemDetails(this.gameEngine.playerStartSystem);
                    const systemGen = this.gameEngine.loreMaster.stellarSystemGenerator;
                    const planets = systemGen.generatePlanets(systemDetails);

                    // Store for reuse (e.g. in TestMenu or return to system)
                    this.gameEngine.currentSystemDetails = systemDetails;
                    this.gameEngine.currentPlanets = planets;

                    this.viewManager.cueScene('StellarSystemScene', {
                        systemDetails,
                        planets,
                        star: this.gameEngine.playerStartSystem,
                        galaxy: this.gameEngine.galaxy,
                        playIntro: true
                    }, {
                        duration: 20000, // Increased duration to allow full flyby sequence (18s)
                        transition: { type: 'crossDissolve', duration: 2000 },
                        onActive: async (scene) => {
                            // Delegate animation to the scene itself for better control over coordinates
                            if (typeof scene.playIntroSequence === 'function') {
                                await scene.playIntroSequence();
                            }
                        }
                    });
                }

                // 4. Ship Showcase
                this.viewManager.cueScene('ShipShowcaseScene', {}, {
                    duration: 5000, // Show ship for 5 seconds before menu
                    onActive: async () => {
                        IntroSequence.hide(); // Reveal scene
                    },
                    transition: { type: 'wipe', duration: 1200, direction: 'up' }
                });

                // Start the sequence without waiting, allowing the loader to finish and show the skip button
                this.viewManager.playSequence();
            }},

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

                // Add a timeout to prevent infinite hanging
                let timeoutId;
                const timeoutPromise = new Promise((_, reject) =>
                    timeoutId = setTimeout(() => reject(new Error(`Task '${task.name}' timed out after 30s`)), 30000)
                );

                try {
                    // We don't await the visual sequence to finish, just to start
                    if (task.name === 'Queue Visuals') {
                        await task.action();
                    } else {
                        await Promise.race([task.action(), timeoutPromise]);
                    }
                } finally {
                    clearTimeout(timeoutId);
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

        this.reportProgress('All systems initialized. Welcome, racer.');
        Logger.message('LoaderManager: All tasks completed successfully.');

        // Create a standalone button to continue, ensuring it's visible over the canvas
        const continueButton = document.createElement('button');
        continueButton.innerText = 'Continue to Main Menu';
        continueButton.className = 'menu-button';
        continueButton.style.position = 'absolute';
        continueButton.style.bottom = '50px';
        continueButton.style.left = '50%';
        continueButton.style.transform = 'translateX(-50%)';
        continueButton.style.zIndex = '10000';
        continueButton.id = 'loader-continue-btn';
        continueButton.style.cursor = 'pointer';
        continueButton.style.padding = '10px 20px';
        continueButton.style.fontSize = '16px';
        continueButton.style.borderRadius = '5px';
        continueButton.style.width = 'auto';

        continueButton.onclick = () => {
            continueButton.remove();
            if (typeof IntroSequence !== 'undefined') {
                IntroSequence.hide();
            }
            this.viewManager.sceneQueue = []; // Ensure sequence is cleared
            this.viewManager.showMainMenu();
        };

        document.body.appendChild(continueButton);
    }
}

export default LoaderManager;
