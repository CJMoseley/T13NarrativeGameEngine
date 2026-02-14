import Logger from "../../core/Logger.js";
import { EventBus } from "../../core/EventBus.js";

/**
 * T13NE Conductor Module
 * Orchestrates the audio experience by bridging Game State (View, Tension)
 * and the Audio Director. It acts as the "brain" that decides *what* should play,
 * while the Audio Director handles *how* it plays.
 */
class T13NE_Conductor {
    constructor() {
        this.t13ne = null;
        this.audioDirector = null;
        this.tensionModule = null;
        this.initialized = false;
        this.currentSceneName = null;
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.audioDirector = t13ne.getModule('AudioDirector');
        this.tensionModule = t13ne.getModule('Tension');

        if (!this.audioDirector) {
            Logger.warn("T13NE_Conductor: AudioDirector module not found. Conductor will be silent.");
        }

        // Subscribe to View/Scene events
        EventBus.on('scene:load', (sceneName) => this.onSceneChanged(sceneName));
        EventBus.on('scene:ready', (scene) => this.onScenePrepared(scene));
        
        // Subscribe to Tension events
        EventBus.on('tension:update', (data) => this.onTensionChanged(data));

        this.initialized = true;
        Logger.message("T13NE_Conductor: Initialized and listening.");
    }

    /**
     * Called when a scene has finished preparing (data generation complete).
     * This is the cue to update the music based on the new scene data.
     * @param {Scene} scene - The prepared scene instance.
     */
    async onScenePrepared(scene) {
        const music = this.t13ne.getModule('Music');
        if (!music) return;

        const components = {};
        const sceneData = scene.sceneData || {};

        // Extract narrative components from the scene data
        if (sceneData.galaxy) components.galaxy = sceneData.galaxy;
        if (sceneData.systemDetails) components.currentSystem = sceneData.systemDetails;
        
        // Also check GameEngine for persistent entities that might be relevant
        const gameEngine = this.t13ne.getModule('Game') || (scene.viewManager ? scene.viewManager.gameEngine : null);
        if (gameEngine) {
            if (gameEngine.playerCharacter) components.playerCharacter = gameEngine.playerCharacter;
            if (gameEngine.playerShip) components.playerShip = gameEngine.playerShip;
            if (gameEngine.crew) {
                gameEngine.crew.forEach((member, i) => components[`crew_${i}`] = member);
            }
        }

        // Inject components into the music engine
        music.injectThemeComponents(components);

        // Generate/Update the theme
        // If a track is already playing, this will evolve it.
        // If not, it will start it.
        const theme = await music.createMainTheme(gameEngine);
        if (theme) {
            music.updateTrack(theme);
        }

        Logger.message(`T13NE_Conductor: Updated music for scene '${scene.constructor.name}'`);
    }

    /**
     * Handles scene changes to set the baseline audio context.
     * @param {string} sceneName 
     */
    onSceneChanged(sceneName) {
        this.currentSceneName = sceneName;
        Logger.message(`T13NE_Conductor: Scene changed to ${sceneName}`);
        
        if (!this.audioDirector) return;

        // Infer scene type from name (or ideally get metadata from SceneManager)
        let type = 'Normal';
        const lowerName = sceneName.toLowerCase();

        if (lowerName.includes('combat') || lowerName.includes('battle') || lowerName.includes('fight')) {
            type = 'Combat';
        } else if (lowerName.includes('ordeal')) {
            type = 'Ordeal';
        } else if (lowerName.includes('mystery') || lowerName.includes('investigation')) {
            type = 'Mystery';
        } else if (lowerName.includes('menu') || lowerName.includes('title')) {
            type = 'Menu';
        } else if (lowerName.includes('map')) {
            type = 'Map';
        }

        // Inject this context into the AudioDirector
        this.audioDirector.injectSceneData({ type: type });
    }

    /**
     * Handles tension updates to dynamically adjust music intensity.
     * @param {object} data - { level: number }
     */
    onTensionChanged(data) {
        if (!this.audioDirector) return;

        const level = data.level !== undefined ? data.level : 0;
        Logger.message(`T13NE_Conductor: Adjusting to Tension Level ${level}`);

        // Map Tension Level (0-11) to Mood and Intensity
        // 0-2: Calm / Neutral
        // 3-5: Suspense / Eerie
        // 6-8: Tense / Action
        // 9-11: High Intensity / Tragic

        let mood = 'Calm';
        let intensity = 0.0;

        if (level <= 2) {
            mood = 'Calm';
            intensity = 0.1 + (level * 0.1); // 0.1 - 0.3
        } else if (level <= 5) {
            mood = 'Eerie';
            intensity = 0.4 + ((level - 3) * 0.1); // 0.4 - 0.6
        } else if (level <= 8) {
            mood = 'Action';
            intensity = 0.7 + ((level - 6) * 0.1); // 0.7 - 0.9
        } else {
            mood = 'Action'; // Could be 'Tragic' if supported
            intensity = 1.0;
        }

        // Apply the mood and intensity
        this.audioDirector.setMood(mood, intensity);
    }
}

export default new T13NE_Conductor();