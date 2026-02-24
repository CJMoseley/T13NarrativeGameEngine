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
                        this.reportProgress("Pre-flight Check Required...");

                        await new Promise(resolve => {
                            IntroSequence.promptForInteraction(async () => {
                                await soundEngine.audioContext.resume();
                                resolve();
                            });
                        });
                    }
                }
            },
            { name: 'Physics Engine', action: () => this.gameEngine.physicsEngine.init() },
            {
                name: 'Load T13 Core', action: async () => {
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
                }
            },
            { name: 'Discover Plugins', action: () => this.pluginManager.discoverAndLoadPlugins(this) },
            { name: 'Initialize Plugins', action: () => this.pluginManager.initializePlugins(this) },
            { name: 'Lore Data', action: () => this.loreDataManager.load() },
            { name: 'Core Game Data', action: () => this.gameEngine.initializeBaseData() },

            {
                name: 'Initialize Audio', action: async () => {
                    const music = this.viewManager.engine.getModule('Music');
                    if (music) {
                        music.injectThemeComponents({ galaxy: this.gameEngine.galaxy });
                        this.reportProgress("Priming Acoustic Harmonics...");
                        const theme = await music.createMainTheme(this.gameEngine);
                        if (theme) music.updateTrack(theme);
                    }
                }
            },

            {
                name: 'Cinematic Intro', action: async () => {
                    this.viewManager.sceneQueue = [];
                    // Start the cinematic loop - we do NOT await completion so narrative gen can run in parallel
                    IntroSequence.play(this.viewManager);
                    // Minimal delay to ensure scene transition logic starts before background crunching
                    await new Promise(r => setTimeout(r, 200));
                }
            },

            {
                name: 'Narrative Data', action: () => this.gameEngine.initializeNarrativeData()
            }
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
                        const timeoutDuration = (task.name === 'Narrative Data' || task.name === 'Core Game Data') ? 120000 : (task.name === 'Load T13 Core' ? 60000 : 30000);
                        const timeoutPromise = new Promise((_, reject) =>
                            timeoutId = setTimeout(() => reject(new Error(`Task '${task.name}' timed out after ${timeoutDuration / 1000}s`)), timeoutDuration)
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

        // Finalize loading - the IntroSequence or the last scene will handle the transition to the Main Menu.
    }
}

export default LoaderManager;
