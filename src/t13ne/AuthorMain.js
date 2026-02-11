import Logger from './core/Logger.js';
import T13NE from './T13NE.js';

/**
 * AuthorMain manages the standalone execution environment for T13NE tools.
 * It ensures the engine is loaded and provides a shared context for tools
 * like the Control Panel and Proficiency Manager.
 */
class AuthorMain {
    constructor() {
        this.isInitialized = false;
        this.tools = {
            controlPanel: 't13ne-control-panel.html',
            proficiencyManager: 'proficiency-manager.html'
        };
    }

    /**
     * Bootstraps the standalone T13NE environment.
     */
    async bootstrap() {
        if (this.isInitialized) return T13NE;

        Logger.message("AuthorMain: Bootstrapping standalone T13NE environment...");

        try {
            await T13NE.loadModules();

            // Inject Proficiency Extractor if not already present
            if (!T13NE.getModule('ProficiencyExtractor')) {
                const { default: Extractor } = await import('./modules/world/T13ProficiencyExtractor.js');
                const CodexLoader = T13NE.getModule('Codex');
                T13NE.modules.ProficiencyExtractor = new Extractor(T13NE, CodexLoader);
                await T13NE.modules.ProficiencyExtractor.initialize();
            }

            this.isInitialized = true;
            Logger.message("AuthorMain: T13NE modules loaded successfully.");
            return T13NE;
        } catch (error) {
            Logger.error("AuthorMain: Failed to initialize T13NE:", error);
            throw error;
        }
    }

    /**
     * Executes a T13NEC command.
     */
    async executeCommand(cmd, context = {}) {
        const Commands = T13NE.getModule('Commands');
        if (!Commands) {
            Logger.error("AuthorMain: Commands module not found.");
            return null;
        }
        return await Commands.execute(cmd, context);
    }

    /**
     * Returns the T13NE instance.
     */
    getEngine() {
        return T13NE;
    }

    /**
     * Returns the active character or plot for context.
     */
    getContext() {
        const Referee = T13NE.getModule('Referee');
        const Plots = T13NE.getModule('Plots');
        return {
            character: Referee?.getCharacters()[0], // Default to first char
            plot: Plots?.plots[0], // Default to first plot
            bypassCost: true
        };
    }

    /**
     * Triggers the Audio Asset Baking process.
     * Analyzes samples and updates the manifest with spectral data.
     */
    async bakeAudio() {
        const music = T13NE.getModule('Music');
        if (music) {
            await music.bakeAssets();
        } else {
            Logger.warn("AuthorMain: Music module not loaded, cannot bake audio.");
        }
    }

    /**
     * Generates and saves the main intro sequence themes.
     */
    async generateIntroThemes() {
        const music = T13NE.getModule('Music');
        if (music) {
            await music.createWormholeRacersTheme();
            await music.createT13NETheme();
            Logger.message("AuthorMain: Intro themes generated and saved.");
        } else {
            Logger.warn("AuthorMain: Music module not loaded, cannot generate themes.");
        }
    }

    /**
     * Simple navigation helper for tools.
     * @param {string} toolName 
     */
    openTool(toolName) {
        if (this.tools[toolName]) {
            window.location.href = this.tools[toolName];
        } else {
            Logger.warn(`AuthorMain: Tool '${toolName}' not found.`);
        }
    }
}

const authorMain = new AuthorMain();
export default authorMain;
