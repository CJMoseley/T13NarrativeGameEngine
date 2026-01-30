/* LEGACY CODE - MOVED TO src/t13ne/core/

import Logger from '@/src/t13ne/core/Logger.js';
import { EventBus } from '@/src/t13ne/core/EventBus.js';
import { Scene } from '@/src/t13ne/core/Scene.js';

/**
 * SceneManager
 *
 * This class is responsible for the "Backstage" work of preparing scenes. It dynamically
 * imports scene code, instantiates the scene, and runs its asynchronous `prepare()` method.
 */

const withTimeout = (promise, ms, label) => {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms));
    return Promise.race([promise, timeout]);
};

export class SceneManager {
    constructor(viewManager) {
        this.viewManager = viewManager; // Keep reference for scene constructors
        // Automatically assess available scenes using Vite's import.meta.glob
        const sceneModules = import.meta.glob('@/js/scenes/*.js');
        this.sceneRegistry = {};

        for (const path in sceneModules) {
            const sceneName = path.split('/').pop().replace('.js', '');
            this.sceneRegistry[sceneName] = sceneModules[path];
        }

        Logger.message("SceneManager initialized.");
    }

    getAvailableScenes() {
        return Object.keys(this.sceneRegistry);
    }

    /**
     * Prepares a scene for display. This includes loading the module, instantiating the class,
     * and running its async prepare() method to load assets and run procedural generation.
     * @param {string} sceneName - The name of the scene to prepare.
     * @param {object} sceneData - Data to pass to the scene's constructor.
     * @param {function} onProgress - A callback to report progress (e.g., for a loading bar).
     * @returns {Promise<Scene|null>} A promise that resolves with the prepared scene instance, or null on failure.
     */
    async prepareScene(sceneName, sceneData = {}, onProgress = () => {}) {
        const funcName = 'SceneManager.prepareScene';
        Logger.start(funcName, { sceneName, sceneData });

        onProgress({ status: `Loading module for ${sceneName}...`, percent: 0 });

        // Special case for the base Scene class used for benchmarking
        if (sceneName === 'Scene') {
             const newSceneInstance = new Scene(this.viewManager, sceneData);
             await newSceneInstance.prepare(onProgress);
             return newSceneInstance;
        }

        if (!this.sceneRegistry[sceneName]) {
            Logger.error(`Scene "${sceneName}" not found in registry.`);
            onProgress({ status: `Error: Scene "${sceneName}" not found.`, percent: 1, error: true });
            return null;
        }

        let SceneClass;
        let newSceneInstance;

        try {
            // 1. Load the scene's code module
            const sceneModuleLoader = this.sceneRegistry[sceneName];
            const sceneModule = await withTimeout(sceneModuleLoader(), 20000, `Scene module ${sceneName} loading`);
            SceneClass = sceneModule[sceneName];

            if (!SceneClass) {
                throw new Error(`Scene class "${sceneName}" not found in the imported module.`);
            }

            // 2. Instantiate the scene class
            onProgress({ status: `Instantiating ${sceneName}...`, percent: 0.1 });
            newSceneInstance = new SceneClass(this.viewManager, sceneData);
            Logger.message(`Successfully instantiated scene: ${newSceneInstance.constructor.name}`);

            // 3. Run the scene's internal preparation (asset loading, procgen)
            const progressCallback = (progress) => {
                // Scale the scene's internal progress (0-1) to the manager's progress range (e.g., 10%-90%)
                onProgress({ status: `Preparing ${sceneName}...`, percent: 0.1 + progress * 0.8 });
            };
            await withTimeout(newSceneInstance.prepare(progressCallback), 60000, `Scene ${sceneName} prepare()`);

            onProgress({ status: `Preparation complete for ${sceneName}.`, percent: 1 });
            Logger.message(`Successfully prepared scene: ${sceneName}`);
            return newSceneInstance;

        } catch (error) {
            Logger.error(`Failed to prepare scene "${sceneName}".`, error);
            onProgress({ status: `Error preparing scene: ${error.message}`, percent: 1, error: true });
            // Clean up the partially prepared scene if it exists
            if (newSceneInstance && typeof newSceneInstance.dispose === 'function') {
                newSceneInstance.dispose();
            }
            return null;
        }
    }
}

*/