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
 * T13 Core, and optional game-adapter tasks (such as Wormhole Racers). It provides feedback
 * to the user via the `IntroSequence` UI.
 */
class LoaderManager {
    /**
     * @constructor
     * @param {ViewManager} viewManager - The main view manager instance.
     */
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.engine = viewManager.engine; // T13NE Engine
        this.gameAdapter = viewManager.gameAdapter || null;
        this.gameEngine = viewManager.gameEngine || null;
        this.pluginManager = viewManager.pluginManager;
        this.loreDataManager = viewManager.loreDataManager || null;
        this.galacticHistoryManager = viewManager.galacticHistoryManager || null;

        /**
         * The sequence of tasks to be executed during the loading process.
         * Each task has a name for progress reporting and an action to execute.
         * @type {Array<Object>}
         */
        this.tasks = [
            { name: 'Sound Engine', action: () => this.viewManager.engine.soundEngine?.init() },
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
            {
                name: 'Load T13 Core', action: async () => {
                    if (this.engine.loadModules) await this.engine.loadModules();

                    // Manually register T13 Core APIs since it's no longer a plugin
                    // This ensures consumers can find 'T13' APIs via PluginManager
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
            { name: 'Discover Plugins', action: () => this.pluginManager?.discoverAndLoadPlugins(this) },
            { name: 'Initialize Plugins', action: () => this.pluginManager?.initializePlugins(this) },
            ...(this.gameAdapter?.buildLoaderTasks
                ? this.gameAdapter.buildLoaderTasks({
                    viewManager: this.viewManager,
                    engine: this.engine,
                    gameEngine: this.gameEngine,
                    loreDataManager: this.loreDataManager,
                    pluginManager: this.pluginManager,
                    reportProgress: (msg) => this.reportProgress(msg)
                })
                : [])
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

        Logger.message('LoaderManager: All tasks completed successfully.');
    }
}

export default LoaderManager;
