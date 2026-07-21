import Logger from "../../core/Logger.js";
import PRNG from "./t13ne-prng.js";

/**
 * SceneDirector
 * Manages the construction and orchestration of scenes.
 */
export class SceneDirector {
    constructor(referee) {
        this.referee = referee;
        this.componentRegistry = new Map();
        this._initDefaultRegistry();
    }

    _initDefaultRegistry() {
        // Register default components
        // These will be imported dynamically when needed
        this.componentRegistry.set('Planet', () => import('/src/t13ne/scenes/scenecomponents/Planet.js').then(m => m.Planet));
        this.componentRegistry.set('Star', () => import('/src/t13ne/scenes/scenecomponents/Star.js').then(m => m.Star));
        this.componentRegistry.set('Asteroid', () => import('/src/t13ne/scenes/scenecomponents/Asteroid.js').then(m => m.Asteroid));
        // Add more furniture here...
    }

    /**
     * Creates a component instance based on definition.
     * @param {object} def
     */
    async createComponent(def) {
        const type = def.type;
        if (this.componentRegistry.has(type)) {
            const Loader = this.componentRegistry.get(type);
            const ComponentClass = await Loader();

            // Legacy components are often THREE.Group subclasses,
            // we wrap them if they don't follow the SceneComponent interface.
            const instance = new ComponentClass(def.data, ...(def.args || []));

            if (typeof instance.prepare !== 'function') {
                // Wrapper for legacy THREE objects
                return {
                    id: def.id || PRNG.nextDouble().toString(36).substring(7),
                    mesh: instance,
                    prepare: async () => {},
                    onLoad: (scene) => scene.add(instance),
                    update: () => {},
                    dispose: () => {
                        if (instance.geometry) instance.geometry.dispose();
                        if (instance.material) instance.material.dispose();
                    }
                };
            }
            return instance;
        }
        Logger.warn(`SceneDirector: Unknown component type '${type}'`);
        return null;
    }

    /**
     * Builds a scene definition.
     * @param {object} config
     */
    buildSceneDefinition(config) {
        return {
            name: config.name || "Dynamic Scene",
            components: config.components || [],
            beats: config.beats || [],
            atmosphere: config.atmosphere || null
        };
    }

    /**
     * Tells the ViewManager to play a scene.
     * @param {object} sceneDef
     */
    async playScene(sceneDef) {
        const ViewManager = this.referee.t13ne.getModule('ViewManager');
        if (ViewManager) {
            Logger.message(`SceneDirector: Playing scene '${sceneDef.name}'`);
            return await ViewManager.transitionToScene('DynamicScene', sceneDef);
        }
        return false;
    }
}
