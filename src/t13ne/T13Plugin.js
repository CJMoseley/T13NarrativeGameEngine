import { Plugin } from '@/src/t13ne/core/Plugin.js';
import Logger from '@/src/t13ne/core/Logger.js';
import T13NE from '@/src/t13ne/T13NE.js';

/**
 * @module Plugins/T13Ne/T13Plugin
 * @description
 * Main plugin class for integrating the T13NE (Thirteenth Narrative Engine) into Wormhole Racers.
 * This plugin loads all the T13NE modules and exposes them as APIs to the game engine.
 */

/**
 * @class T13Plugin
 * @extends Plugin
 * @description
 * T13 Plugin for integrating T13NE systems into Wormhole Racers.
 */
export class T13Plugin extends Plugin {
    /**
     * @constructor
     * @param {GameEngine} gameEngine - The main game engine instance.
     */
    constructor(gameEngine) {
        super(gameEngine);
        this.name = 'T13';
        this.version = '1.0.0';
    }

    /**
     * Initializes the T13NE plugin.
     * This method loads all T13NE modules and registers their APIs.
     * @async
     */
    async initialize() {
        await super.initialize();
        // Load all T13NE modules
        await T13NE.loadModules();
        this._registerApis();
        Logger.message("T13 Plugin: Initialized.");
    }

    /**
     * Registers the plugin.
     * @override
     */
    register() {
        super.register();
    }

    /**
     * Registers all T13NE modules as APIs with the PluginManager.
     * @private
     */
    _registerApis() {
        // Expose the main T13NE module with both a simple name and the standard API name
        this.gameEngine.pluginManager.exposeApi(this.name, 'T13NE', T13NE);
        this.exposeStandardApi(T13NE);

        // List of all modules to expose from T13NE
        const modulesToExpose = [
            'Codex',
            'T13Geometry',
            'PRNG',
            'Tapestry',
            'Facets',
            'Sway',
            'IChing',
            'CardsAPI',
            'Ordeals',
            'Threads',
            'Pacts',
            'Plots',
            'Drama',
            'Stress',
            'Tension',
            'NarrativeWeaving',
            'Resources',
            'Tests',
            'Stakes',
            'NarrativeTricks',
            'SocialOrdeals',
            'Snapfire',
            'YarnTangling',
            'ActionSpaces',
            'PsychosocialSpaces',
            'SpaceVisualizer',
            'Knots',
            'AINodes',
            'AIService',
            'DescriptionGenerator',
            'NameGenerator',
            'YarnTeller',
            'Reasoning',
            'StateMachine',
            'Conductor'
        ];

        // Iterate and expose each module
        modulesToExpose.forEach(moduleName => {
            const moduleInstance = T13NE.getModule(moduleName);
            if (moduleInstance) {
                this.gameEngine.pluginManager.exposeApi(this.name, moduleName, moduleInstance);
            } else {
                Logger.warn(`T13Plugin: Failed to expose module '${moduleName}'. Module not loaded in T13NE.`);
            }
        });

        Logger.message("T13 Plugin: Registered APIs.");
    }
}