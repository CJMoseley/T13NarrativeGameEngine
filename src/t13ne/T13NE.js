import Logger from '@/src/t13ne/core/Logger.js';
import T13NE_Facets from '@/src/t13ne/modules/mechanics/t13ne-facets.js'; // Import the new facets module
import T13NE_Sway from '@/src/t13ne/modules/mechanics/t13ne-sway.js';
import CodexLoader from '@/src/t13ne/modules/codex/CodexLoader.js';

import T13NECardsAPI from '@/src/t13ne/modules/mechanics/t13ne-cards-api.js'; // Import the T13NECardsAPI
import AIService from '@/src/t13ne/modules/ai/AIService.js';
import T13NE_IChing from '@/src/t13ne/modules/mechanics/t13ne-iching.js';
import T13Ordeals from '@/src/t13ne/modules/systems/ordeals/t13ne-ordeals.js';
import { T13NameGenerator } from '@/src/t13ne/modules/ai/T13NameGenerator.js';
import T13Descriptions from '@/src/t13ne/modules/ai/T13Descriptions.js';
import * as AINodes from '@/src/t13ne/modules/ai/t13ne-ai-nodes.js';
import { ThreadsSystem } from '@/src/t13ne/modules/narrative/t13ne-threads.js';
import * as Knots from '@/src/t13ne/modules/mechanics/t13ne-knots.js';
import T13NE_PRNG from '@/src/t13ne/modules/systems/t13ne-prng.js';
import T13Tapestry from '@/src/t13ne/modules/world/T13Tapestry.js';
import AnnexFactory from '@/src/t13ne/modules/narrative/t13ne-annexes.js';
import T13NE_Pacts from '@/src/t13ne/modules/narrative/t13ne-pacts.js';
import T13NE_Drama from '@/src/t13ne/modules/narrative/t13ne-drama.js';
import T13NE_Stress from '@/src/t13ne/modules/mechanics/t13ne-stress.js';
import T13NE_Tension from '@/src/t13ne/modules/mechanics/t13ne-tension.js';
import T13NE_Plots from '@/src/t13ne/modules/narrative/t13ne-plots.js';
import T13NE_NarrativeWeaving from '@/src/t13ne/modules/narrative/t13ne-narrative-weaving.js';
import T13NE_Resources from '@/src/t13ne/modules/mechanics/t13ne-resources.js';
import T13NE_Tests from '@/src/t13ne/modules/mechanics/t13ne-tests.js';
import T13NE_Stakes from '@/src/t13ne/modules/systems/ordeals/t13ne-stakes.js';
import T13NE_NarrativeTricks from '@/src/t13ne/modules/systems/ordeals/t13ne-narrative-tricks.js';
import T13NE_SocialOrdeals from '@/src/t13ne/modules/systems/ordeals/t13ne-social-ordeals.js';
import T13NE_Snapfire from '@/src/t13ne/modules/systems/ordeals/t13ne-snapfire.js';
import T13NE_YarnTangling from '@/src/t13ne/modules/systems/ordeals/t13ne-yarntangling.js';
import T13NE_ActionSpaces from '@/src/t13ne/modules/systems/ordeals/t13ne-action-spaces.js';
import T13NE_PsychosocialSpaces from '@/src/t13ne/modules/systems/ordeals/t13ne-psychosocial-spaces.js';
import T13NE_SpaceVisualizer from '@/src/t13ne/modules/systems/ordeals/t13ne-space-visualizer.js';
import T13YarnTeller from '@/src/t13ne/modules/narrative/t13ne-yarntelling.js';
import T13NECommands from '@/src/t13ne/modules/systems/t13ne-commands.js';
import T13NE_Wounds from '@/src/t13ne/modules/mechanics/t13ne-wounds.js';
import T13NE_CharacterArc from '@/src/t13ne/modules/characters/t13ne-CharacterArc.js';
import T13NE_Catalysts from '@/src/t13ne/modules/mechanics/t13ne-catalysts.js';
import T13NE_Referee from '@/src/t13ne/modules/systems/t13ne-referee.js';
import T13NE_GameState from '@/src/t13ne/modules/systems/t13ne-gamestate.js';
import T13NE_Game from '@/src/t13ne/modules/systems/t13ne-game.js';
import T13NE_Reasoning from '@/src/t13ne/modules/ai/t13ne-reasoning.js';
import T13NE_StateMachine from '@/src/t13ne/modules/systems/t13ne-state-machine.js';
import T13NE_Editor from '@/src/t13ne/modules/systems/t13ne-editor.js';

import { ViewManager } from '@/src/t13ne/core/ViewManager.js';
import { PluginManager } from '@/src/t13ne/core/PluginManager.js';
import { SoundEngine } from '@/src/t13ne/core/SoundEngine.js';
import LoaderManager from '@/src/t13ne/core/LoaderManager.js';

/**
 * T13NE Engine Core
 * The central hub of the game engine, managing core systems and narrative modules.
 */
class T13NE {
    constructor() {
        this.modules = {};
        this.isLoaded = false;
        this.engineInitialized = false;
        this._loadingPromise = null;

        // Core Systems
        this.viewManager = null;
        this.pluginManager = null;
        this.soundEngine = null;
        this.physicsEngine = null;
        this.loaderManager = null;

        const defaults = {
            codex: {
                cachingStrategy: 'loadAndStore' // 'loadAndStore' or 'loadAndDestroy'
            },
            ai: {
                provider: 'mock',
                baseUrl: 'http://localhost:11434',
                model: 'falcon3:3b',
                temperature: 0.7
            }
        };

        let savedConfig = {};
        try {
            const stored = localStorage.getItem('T13NE_CONFIG');
            if (stored) savedConfig = JSON.parse(stored);
        } catch (e) {
            Logger.warn("T13NE: Failed to load config from localStorage.");
        }

        this.config = {
            codex: { ...defaults.codex, ...(savedConfig.codex || {}) },
            ai: { ...defaults.ai, ...(savedConfig.ai || {}) }
        };
    }

    /**
     * Sets configuration for the T13NE plugin and its modules.
     * This is the API for plugin configuration.
     * @param {object} config - The configuration object.
     */
    setConfig(config) {
        if (config) {
            if (config.codex) {
                this.config.codex = { ...this.config.codex, ...config.codex };
                if (this.modules.Codex) {
                    this.modules.Codex.setConfig(this.config.codex);
                }
            }
            if (config.ai) {
                this.config.ai = { ...this.config.ai, ...config.ai };
                if (this.modules.AIService) {
                    this.modules.AIService.configure(this.config.ai);
                }
            }

            try {
                localStorage.setItem('T13NE_CONFIG', JSON.stringify(this.config));
            } catch (e) {
                Logger.error("T13NE: Failed to save config to localStorage", e);
            }
        }
    }

    /**
     * Retrieves the current configuration.
     * @returns {object}
     */
    getConfig() {
        return this.config;
    }

    /**
     * Retrieves available models from the AI Service.
     * @returns {Promise<Array>}
     */
    async getAvailableModels() {
        if (this.modules.AIService) {
            return await this.modules.AIService.getAvailableModels();
        }
        return [];
    }

    /**
     * Generates a name using AI based on type and context.
     * @param {string} type - The type of name to generate (e.g., 'character', 'planet').
     * @param {string} context - A descriptive context for the AI.
     * @returns {Promise<object|null>} A promise that resolves to an object with names and their geometries.
     */
    async generateName(type, context = {}) {
        const nameGenerator = this.getModule('NameGenerator');
        if (!nameGenerator) {
            Logger.warn("T13NE: NameGeneratorAI module not loaded.");
            return null;
        }

        let name = '';
        switch (type) {
            case 'system':
                name = await nameGenerator.generateSystemName(context.n1, context.n2, context.n3);
                break;
            case 'homeworld':
                name = await nameGenerator.generateHomeworldName(context.systemName, context.speciesName, context.speciesKey, context.techLevelKey, context.n3, context.star);
                break;
            default:
                Logger.warn(`T13NE.generateName: Unknown name type '${type}'`);
                return null;
        }

        const geo = this.getModule('T13Geometry').getGeometryFromString(name);
        return { name, geo };
    }



    /**
     * Interprets a card spread using the AI Service.
     * @param {string} spreadName - The name of the spread (e.g., "Narrative Arc", "Dungeon Layout").
     * @param {Array} cards - Array of card objects (Wyrd Tarot/Yarn). Each should have at least a 'name' property. 
     *                        Optional properties: 'position' (name of the position in the spread), 'meaning' (specific meaning of the card).
     * @param {string} [context=""] - The narrative context or question asked.
     * @returns {Promise<string>} The interpretation text.
     */
    async interpretSpread(spreadName, cards, context = "") {
        if (!this.modules.AIService) {
            Logger.warn("T13NE: AIService not loaded.");
            return "AI Service unavailable.";
        }

        let prompt = `Interpret the following '${spreadName}' spread`;
        if (context) prompt += ` regarding: "${context}"`;
        prompt += ".\n\nCards:\n";

        if (Array.isArray(cards)) {
            cards.forEach((card, index) => {
                const position = card.position || `Position ${index + 1}`;
                const name = card.name || card.toString();
                const meaning = card.meaning ? ` (${card.meaning})` : "";
                prompt += `- ${position}: ${name}${meaning}\n`;
            });
        }

        prompt += "\nProvide a concise and thematic interpretation of these cards combined.";

        return await this.modules.AIService.generateText(prompt);
    }

    /**
     * Initializes the T13NE Engine and all core systems.
     * This makes T13NE the primary hub for the entire application.
     */
    async initializeEngine() {
        if (this.engineInitialized) return;

        Logger.message("T13NE: Initializing Engine Core...");

        // 1. Initialize Core Infrastructure
        this.soundEngine = new SoundEngine();
        this.pluginManager = new PluginManager(this);
        this.viewManager = new ViewManager(this); // Pass T13NE as the context
        this.loaderManager = new LoaderManager(this.viewManager);

        // 2. Load Narrative Modules
        await this.loadModules();

        this.engineInitialized = true;
        Logger.message("T13NE: Engine Core Initialized.");
    }

    /**
     * Starts the full engine loading sequence.
     */
    async start() {
        if (!this.engineInitialized) {
            await this.initializeEngine();
        }
        await this.loaderManager.loadAll();
    }

    /**
     * Asynchronously loads all necessary T13NE modules.
     */
    async loadModules() {
        if (this.isLoaded) return;
        if (this._loadingPromise) return this._loadingPromise;

        this._loadingPromise = this._loadModulesInternal();
        try {
            await this._loadingPromise;
        } catch (e) {
            this._loadingPromise = null; // Allow retry on failure
            throw e;
        }
    }

    async _loadModulesInternal() {

        Logger.message("T13NE: Loading modules...");

        // Load the CodexLoader module first as other modules depend on it
        this.modules.Codex = CodexLoader;
        this.modules.Codex.setConfig(this.config.codex);
        await this.modules.Codex.initialize();
        Logger.message("T13NE: CodexLoader module loaded.");

        // Load Commands module early so others can use it
        this.modules.Commands = T13NECommands;
        await this.modules.Commands.initialize(this);

        // Dynamically import T13Geometry, which is now a class
        const { default: T13Geometry } = await import('@/src/t13ne/modules/world/t13ne-geometry.js');
        const geometryModule = new T13Geometry(this.modules.Codex);
        await geometryModule.initialize();
        this.modules.T13Geometry = geometryModule;
        Logger.message("T13NE: T13Geometry module loaded and initialized.");

        // Load PRNG
        this.modules.PRNG = T13NE_PRNG;
        Logger.message("T13NE: PRNG module loaded.");

        // Load Tapestry
        this.modules.Tapestry = T13Tapestry;
        Logger.message("T13NE: Tapestry module loaded.");

        // Load the Facets module and pre-load all facet data
        this.modules.Facets = T13NE_Facets;
        await this.modules.Facets.loadAllFacets(); // Pre-load all facets
        Logger.message("T13NE: Facets module and data loaded.");

        // Load the Sway module and its data
        this.modules.Sway = T13NE_Sway;
        await this.modules.Sway.initialize(this);
        Logger.message("T13NE: Sway module and data loaded.");

        // Load the IChing module and its data
        this.modules.IChing = T13NE_IChing;
        await this.modules.IChing.initialize(this);
        Logger.message("T13NE: IChing module and data loaded.");

        // Load and initialize the Cards API module
        this.modules.CardsAPI = T13NECardsAPI;
        await this.modules.CardsAPI.initialize(this);
        Logger.message("T13NE: CardsAPI module loaded and initialized.");

        // Load Ordeals module
        this.modules.Ordeals = T13Ordeals;
        await this.modules.Ordeals.initialize(this);
        Logger.message("T13NE: Ordeals module loaded.");

        // Load AnnexFactory
        this.modules.AnnexFactory = AnnexFactory;
        Logger.message("T13NE: AnnexFactory module loaded.");

        // Load Threads System (Proficiencies, Annexes, Notes, Maps)
        this.modules.Threads = new ThreadsSystem(this.modules.Codex);
        await this.modules.Threads.initialize(this);
        Logger.message("T13NE: Threads System loaded.");

        // Load Pacts module
        this.modules.Pacts = T13NE_Pacts;
        await this.modules.Pacts.initialize(this);
        Logger.message("T13NE: Pacts module loaded.");

        // Load Plots module
        this.modules.Plots = T13NE_Plots;
        await this.modules.Plots.initialize(this);
        Logger.message("T13NE: Plots module loaded.");

        // Load Drama module
        this.modules.Drama = T13NE_Drama;
        await this.modules.Drama.initialize(this);
        Logger.message("T13NE: Drama module loaded.");

        // Load Wounds module
        this.modules.Wounds = T13NE_Wounds;
        await this.modules.Wounds.initialize();
        Logger.message("T13NE: Wounds module loaded.");

        // Load Character Arc module
        this.modules.CharacterArc = T13NE_CharacterArc;
        await this.modules.CharacterArc.initialize(this);
        Logger.message("T13NE: Character Arc module loaded.");

        // Load Catalysts module
        this.modules.Catalysts = T13NE_Catalysts;
        await this.modules.Catalysts.initialize();
        Logger.message("T13NE: Catalysts module loaded.");

        // Load Referee module
        this.modules.Referee = T13NE_Referee;
        await this.modules.Referee.initialize(this);
        Logger.message("T13NE: Referee module loaded.");

        // Load GameState module
        this.modules.GameState = T13NE_GameState;
        await this.modules.GameState.initialize(this);
        Logger.message("T13NE: GameState module loaded.");

        // Load Game module (top-level hierarchy)
        this.modules.Game = T13NE_Game;
        await this.modules.Game.initialize(this);
        Logger.message("T13NE: Game module loaded.");

        // Load Stress module
        this.modules.Stress = T13NE_Stress;
        await this.modules.Stress.initialize(this);
        Logger.message("T13NE: Stress module loaded.");

        // Load Tension module
        this.modules.Tension = T13NE_Tension;
        await this.modules.Tension.initialize(this);
        Logger.message("T13NE: Tension module loaded.");

        // Load Narrative Weaving module
        this.modules.NarrativeWeaving = T13NE_NarrativeWeaving;
        await this.modules.NarrativeWeaving.initialize(this);
        Logger.message("T13NE: Narrative Weaving module loaded.");

        // Load Resources module
        this.modules.Resources = T13NE_Resources;
        await this.modules.Resources.initialize(this);
        Logger.message("T13NE: Resources module loaded.");

        // Load Tests module
        this.modules.Tests = T13NE_Tests;
        await this.modules.Tests.initialize(this);
        Logger.message("T13NE: Tests module loaded.");

        // Load Stakes module
        this.modules.Stakes = T13NE_Stakes;
        await this.modules.Stakes.initialize(this);
        Logger.message("T13NE: Stakes module loaded.");

        // Load Narrative Tricks module
        this.modules.NarrativeTricks = T13NE_NarrativeTricks;
        await this.modules.NarrativeTricks.initialize(this);
        Logger.message("T13NE: Narrative Tricks module loaded.");

        // Load Social Ordeals module
        this.modules.SocialOrdeals = T13NE_SocialOrdeals;
        await this.modules.SocialOrdeals.initialize(this);
        Logger.message("T13NE: Social Ordeals module loaded.");

        // Load Alternate Ordeals
        this.modules.Snapfire = T13NE_Snapfire;
        this.modules.YarnTangling = T13NE_YarnTangling;
        Logger.message("T13NE: Alternate Ordeals (Snapfire, YarnTangling) loaded.");

        // Load Action Spaces module
        this.modules.ActionSpaces = T13NE_ActionSpaces;
        await this.modules.ActionSpaces.initialize(this);
        Logger.message("T13NE: Action Spaces module loaded.");

        // Load Psychosocial Spaces module
        this.modules.PsychosocialSpaces = T13NE_PsychosocialSpaces;
        await this.modules.PsychosocialSpaces.initialize(this);
        Logger.message("T13NE: Psychosocial Spaces module loaded.");

        // Load Space Visualizer
        this.modules.SpaceVisualizer = T13NE_SpaceVisualizer;
        await this.modules.SpaceVisualizer.initialize(this);
        Logger.message("T13NE: Space Visualizer module loaded.");

        // Load Knots System
        this.modules.Knots = Knots;
        Logger.message("T13NE: Knots System loaded.");

        // Load AI Nodes module
        this.modules.AINodes = AINodes;
        Logger.message("T13NE: AI Nodes module loaded.");

        // Load AI Service
        this.modules.AIService = AIService;
        this.modules.AIService.configure(this.config.ai);

        // Load AI Description Generator
        this.modules.DescriptionGenerator = new T13Descriptions(this, this.modules.AIService);
        Logger.message("T13NE: AI Description Generator module loaded.");

        // Load YarnTeller
        this.modules.YarnTeller = T13YarnTeller;
        Logger.message("T13NE: YarnTeller module loaded.");

        // Load Reasoning module
        this.modules.Reasoning = T13NE_Reasoning;
        Logger.message("T13NE: Reasoning module loaded.");

        // Load Editor module
        this.modules.Editor = T13NE_Editor;
        await this.modules.Editor.initialize(this);
        Logger.message("T13NE: Editor module loaded.");

        // Load StateMachine module
        this.modules.StateMachine = T13NE_StateMachine;
        await this.modules.StateMachine.initialize(this);
        Logger.message("T13NE: StateMachine module loaded.");

        // Load AI Name Generator for the T13NE.generateName() method
        this.modules.NameGenerator = new T13NameGenerator(this.modules.T13Geometry);
        await this.modules.NameGenerator.initialize();
        Logger.message("T13NE: AI Name Generator module loaded and initialized.");

        // Auto-detect Ollama model if provider is ollama but no model is specified
        if (this.config.ai.provider === 'ollama' && !this.config.ai.model) {
            try {
                Logger.message("T13NE: No Ollama model configured. Attempting to fetch available models...");

                // Race the fetch against a 2-second timeout to prevent hanging startup
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
                const models = await Promise.race([this.modules.AIService.getAvailableModels(), timeout]);

                if (models && models.length > 0) {
                    // Sort by size (ascending) to find the lightest model
                    models.sort((a, b) => (a.size || 0) - (b.size || 0));
                    this.config.ai.model = models[0].name;
                    this.modules.AIService.configure({ model: this.config.ai.model });
                    Logger.message(`T13NE: Auto-configured Ollama model to '${this.config.ai.model}' (Size: ${models[0].size} bytes).`);
                } else {
                    Logger.warn("T13NE: No models found in Ollama instance. Please pull a model (e.g., 'ollama pull llama3').");
                }
            } catch (error) {
                Logger.warn("T13NE: Failed to auto-detect Ollama models:", error);
            }
        }

        Logger.message("T13NE: AI Service loaded.");

        this.isLoaded = true;
        Logger.message("T13NE: All modules loaded.");
    }

    /**
     * Get a loaded module.
     * @param {string} moduleName - The name of the module to get (e.g., 'T13Geometry', 'CardsAPI').
     * @returns {object|null}
     */
    getModule(moduleName) {
        if (!this.isLoaded) {
            Logger.message("ERROR: T13NE modules not loaded yet. Call loadModules() first.");
            return null;
        }
        return this.modules[moduleName] || null;
    }
}

export default new T13NE();
