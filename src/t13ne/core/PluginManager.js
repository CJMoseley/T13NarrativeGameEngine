import Logger from './Logger.js';

/**
 * @module Core/PluginManager
 * @description
 * Manages the discovery, loading, registration, and lifecycle of all plugins.
 * It provides a centralized way for plugins to interact with the game engine and expose their APIs.
 */

/**
 * @class PluginManager
 * @description
 * Manages the loading, registration, and lifecycle of plugins.
 */
export class PluginManager {
    /**
     * @constructor
     * @param {GameEngine} gameEngine - The main game engine instance.
     */
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.plugins = [];
        this.pluginApis = new Map(); // Stores exposed APIs from plugins
        Logger.message("PluginManager: Instantiated.");
    }

    /**
     * Discovers and loads all plugins from the /public/plugins directory.
     * It looks for a 'wormholeracers-register-plugin.js' file in each plugin's root.
     * This method uses Vite's `import.meta.glob` to dynamically find plugin entry points.
     * @param {LoaderManager} loader - The loader manager for reporting progress.
     * @async
     */
    async discoverAndLoadPlugins(loader) {
        Logger.start('PluginManager.discoverAndLoadPlugins');

        // Vite-specific feature to find all plugin registration files.
        const registrationModules = import.meta.glob('@plugins/*/wormholeracers-register-plugin.js');

        for (const path in registrationModules) {
            try {
                const moduleLoader = registrationModules[path];
                const registrationModule = await moduleLoader();
                const PluginClass = registrationModule.default;

                if (PluginClass && typeof PluginClass === 'function') {
                    await this.registerPlugin(PluginClass);
                } else {
                    Logger.message(`WARN: PluginManager: Plugin registration file at ${path} did not export a valid default class.`);
                }
            } catch (error) {
                Logger.message(`ERROR: PluginManager: Failed to load plugin from ${path}: ${error}`);
            }
        }
        Logger.end('PluginManager.discoverAndLoadPlugins');
    }

    /**
     * Registers a plugin class. The plugin will be instantiated and initialized.
     * @param {class} PluginClass - The class of the plugin to register.
     * @async
     */
    async registerPlugin(PluginClass) {
        try {
            const pluginInstance = new PluginClass(this.gameEngine);
            this.plugins.push(pluginInstance);
            Logger.message(`PluginManager: Registered plugin class ${pluginInstance.name}.`);
            return pluginInstance;
        } catch (error) {
            Logger.message(`ERROR: PluginManager: Failed to register plugin: ${error}`);
            return null;
        }
    }

    /**
     * Initializes all registered plugins.
     * @param {LoaderManager} loader - The loader manager for reporting progress.
     * @async
     */
    async initializePlugins(loader) {
        Logger.start('PluginManager.initializePlugins');
        for (const plugin of this.plugins) {
            loader.reportProgress(`Plugin: ${plugin.name} - Harmonizing...`);
            await plugin.initialize();
            plugin.register(); // Register features after initialization
        }
        Logger.end('PluginManager.initializePlugins');
    }

    /**
     * Allows a plugin to expose an API to the rest of the game.
     * @param {string} pluginName - The name of the plugin exposing the API.
     * @param {string} apiName - The name of the API being exposed (e.g., 'T13Geometry').
     * @param {object} apiObject - The object/module/class to expose.
     */
    exposeApi(pluginName, apiName, apiObject) {
        if (!this.pluginApis.has(pluginName)) {
            this.pluginApis.set(pluginName, new Map());
        }
        this.pluginApis.get(pluginName).set(apiName, apiObject);
        Logger.message(`PluginManager: Plugin '${pluginName}' exposed API '${apiName}'.`);
    }

    /**
     * Retrieves an exposed API from a plugin.
     * @param {string} pluginName - The name of the plugin.
     * @param {string} apiName - The name of the API to retrieve.
     * @returns {object|null} The exposed API object, or null if not found.
     */
    getApi(pluginName, apiName) {
        const pluginApis = this.pluginApis.get(pluginName);
        if (pluginApis && pluginApis.has(apiName)) {
            return pluginApis.get(apiName);
        }
        Logger.message(`WARN: PluginManager: API '${apiName}' from plugin '${pluginName}' not found.`);
        return null;
    }
}