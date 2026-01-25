import Logger from '@/js/core/Logger.js';

/**
 * Base class for all plugins. Defines the interface that plugins must implement.
 */
export class Plugin {
    constructor(gameEngine) {
        if (this.constructor === Plugin) {
            throw new Error("Plugin is an abstract class and cannot be instantiated directly.");
        }
        this.gameEngine = gameEngine;
        this.name = 'Unnamed Plugin';
        this.version = '0.0.0';
    }

    /**
     * Initializes the plugin. Asynchronous operations should be done here.
     * @returns {Promise<void>}
     */
    async initialize() {
        Logger.message(`Initializing plugin: ${this.name} v${this.version}`);
    }

    /**
     * Registers the plugin's features with the game engine.
     * This is where the plugin provides its APIs, hooks, and extensions.
     */
    register() {
        Logger.message(`Registering plugin: ${this.name} v${this.version}`);
    }

    /**
     * Returns the standard API name for this plugin based on the convention WHRAPI_PluginName.
     * Spaces in the plugin name are removed to ensure a valid API key.
     * @returns {string}
     */
    get standardApiName() {
        const sanitizedName = this.name.replace(/\s/g, '');
        return `WHRAPI_${sanitizedName}`;
    }

    /**
     * Helper to expose the plugin's API using the standard naming convention.
     * @param {object} api - The API object to expose.
     */
    exposeStandardApi(api) {
        if (this.gameEngine && this.gameEngine.pluginManager) {
            this.gameEngine.pluginManager.exposeApi(this.name, this.standardApiName, api);
        }
    }
}