import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { UIManager } from './ui/UIManager.js';
import { SceneManager } from './SceneManager.js';
import Logger from './Logger.js';
import { EventBus } from './EventBus.js';
// The Scene base class is now the authority on what a scene is.
import { Scene } from './Scene.js';
import { PluginManager } from './PluginManager.js'; // Import PluginManager
import { LoreData } from '../procgen/lore/LoreData.js'; // Import LoreData
import { GalacticHistory } from '../procgen/galaxy/GalacticHistory.js'; // Import GalacticHistory
import { UIMessage } from './ui/UIMessage.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import Localization from './ui/Localization.js';

/**
 * ViewManager
 *
 * This class is the "Front of House" manager. It orchestrates the preparation
 * and transitioning of scenes. It holds the application's core state and coordinates
 * between the SceneManager (Backstage) and UIManager (UI overlays).
 *
 * It manages a cache of prepared scenes to allow for quick transitions and is aware
 * of scenes currently in preparation, including their progress.
 * transitions between different views (e.g., from a planet surface, to a solar system map,
 * to a wormhole race) without the player needing to use menus. The SceneManager handles
 * the 3D aspects of these transitions, while the UIManager handles the 2D UI overlays.
 */
export class ViewManager {
    constructor(engine) {
        this.engine = engine; // T13NE Engine Core
        this.gameEngine = new GameEngine(this.engine);
        this.uiManager = new UIManager(this);
        this.uiMessage = new UIMessage(this);
        this.sceneManager = new SceneManager(this);
        this.pluginManager = this.engine.pluginManager || this.gameEngine.pluginManager; // Use T13NE PluginManager
        this.loreDataManager = LoreData; // Assign the imported LoreData instance
        this.galacticHistoryManager = GalacticHistory; // Assign the imported GalacticHistory instance

        // Z-Index Layer Definitions - Centralized control
        this.Z_LAYERS = {
            CANVAS: 0,
            HUD: 10,
            UI_BASE: 100,
            DIALOGUE: 500,
            COMMUNICATIONS: 600,
            MENUS: 1000,
            TRANSITION: 9000,
            LOADING: 9500,
            DEBUG: 9999,
            OVERLAY: 10000
        };

        // Initialize renderer with preserveDrawingBuffer to allow screen capture for transitions
        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.canvasContainer = document.getElementById('game-canvas-container');
        this.canvasContainer.appendChild(this.renderer.domElement);
        this.canvasContainer.style.zIndex = this.Z_LAYERS.CANVAS;

        // Game State
        this.currentScene = null;

        // Scene Caching and Preparation Tracking
        this.preparedScenes = new Map(); // Cache for ready-to-display scenes
        this.scenesInProgress = new Map(); // Tracks scenes currently being prepared
        this.MAX_CACHE_SIZE = 3; // Max number of scenes to keep in memory

        // Sequencing and Timing
        this.sceneQueue = [];
        this.isSequencing = false;
        this.systemLatency = 100; // Default fallback latency in ms
        this.safetyMarginFactor = 1.4; // 40% safety margin

        this.activeComponentForPlacement = null;
        this.isPaused = false;

        this.performanceMonitor = new PerformanceMonitor(this);
        this.performanceMonitor.start();

        this.initGlobalListeners();
        this.transitionOverlay = this.createTransitionOverlay();
        this.hudOverlay = this.createHUDOverlay();
        this.debugView = this.createDebugView();

        // The UIManager will listen for 'scene:loading' to show a loading screen.

        Logger.message("ViewManager initialized.");
    }

    initGlobalListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === '`') {
                this.togglePause();
            }
        });
    }

    createTransitionOverlay() {
        let overlay = document.getElementById('view-transition-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'view-transition-overlay';
            Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: this.Z_LAYERS.TRANSITION,
                opacity: '0',
                display: 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'black'
            });
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    createHUDOverlay() {
        let hudOverlay = document.getElementById('view-hud-overlay');
        if (!hudOverlay) {
            hudOverlay = document.createElement('div');
            hudOverlay.id = 'view-hud-overlay';
            Object.assign(hudOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: this.Z_LAYERS.HUD,
                display: 'none'
            });
            document.body.appendChild(hudOverlay);
        }
        return hudOverlay;
    }

    setHUD(element) {
        if (this.hudOverlay) {
            this.hudOverlay.innerHTML = '';
            if (element) {
                this.hudOverlay.appendChild(element);
                this.hudOverlay.style.display = 'block';
            } else {
                this.hudOverlay.style.display = 'none';
            }
        }
    }

    createDebugView() {
        let debugContainer = document.getElementById('view-debug-container');
        if (!debugContainer) {
            debugContainer = document.createElement('div');
            debugContainer.id = 'view-debug-container';
            Object.assign(debugContainer.style, {
                position: 'fixed',
                top: '10px',
                right: '10px',
                pointerEvents: 'none',
                zIndex: this.Z_LAYERS.DEBUG,
                color: '#00ff00',
                fontFamily: 'monospace',
                fontSize: '12px',
                whiteSpace: 'pre',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '5px',
                display: 'none'
            });
            document.body.appendChild(debugContainer);
        }
        return debugContainer;
    }

    setDebugInfo(info) {
        if (this.debugView) {
            this.debugView.textContent = typeof info === 'string' ? info : JSON.stringify(info, null, 2);
            this.debugView.style.display = 'block';
        }
    }

    hideDebugInfo() {
        if (this.debugView) {
            this.debugView.style.display = 'none';
        }
    }

    /**
     * Assigns a Z-Index to a DOM element based on the defined layers.
     * @param {HTMLElement} element - The element to position.
     * @param {string} layerName - The name of the layer (e.g., 'DIALOGUE', 'MENUS').
     */
    assignLayer(element, layerName) {
        if (this.Z_LAYERS[layerName] !== undefined) {
            element.style.zIndex = this.Z_LAYERS[layerName];
        } else {
            Logger.warn(`ViewManager: Unknown layer '${layerName}'. Defaulting to UI_BASE.`);
            element.style.zIndex = this.Z_LAYERS.UI_BASE;
        }
    }

    /**
     * Manages the visibility and layering of a loading screen.
     * @param {boolean} visible - Whether to show or hide the loading screen.
     * @param {HTMLElement} [customElement] - Optional custom loading element.
     */
    toggleLoadingScreen(visible, customElement = null) {
        const loader = customElement || document.getElementById('intro-sequence') || document.getElementById('loading-status');
        if (loader) {
            loader.style.zIndex = this.Z_LAYERS.LOADING;
            loader.style.display = visible ? 'flex' : 'none';
        }
    }

    showDialogue(element) {
        if (element) {
            this.assignLayer(element, 'DIALOGUE');
            element.style.display = 'block';
        }
    }

    showCommunications(element) {
        if (element) {
            this.assignLayer(element, 'COMMUNICATIONS');
            element.style.display = 'block';
        }
    }

    togglePause() {
        if (!this.sceneManager.currentScene) return; // Can't pause if no scene is active

        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.uiManager.showPauseMenu();
        } else {
            this.uiManager.hidePauseMenu();
        }
    }

    /**
     * Orchestrates the entire application startup sequence.
     */
    async initialize() {
        // Initialize Localization first
        await Localization.initialize();

        // All loading orchestration is now handled by the LoaderManager,
        // which is initiated from main.js. This method is kept for any
        // future synchronous initialization needs of the ViewManager itself.
        if (this.uiManager) {
            this.uiManager.initialize();
        }

        // Run a benchmark to determine system performance for transitions
        await this.benchmarkSystem();

        Logger.message("ViewManager: Initialization entry point.");
    }

    /**
     * Benchmarks the system by loading a blank scene to establish a baseline latency.
     * This helps in timing transitions seamlessly.
     */
    async benchmarkSystem() {
        const startTime = performance.now();
        // We use the base Scene class as a lightweight benchmark
        const dummyScene = new Scene(this);
        await dummyScene.prepare(() => { });
        const endTime = performance.now();

        this.systemLatency = endTime - startTime;
        dummyScene.dispose();

        Logger.message(`ViewManager: System benchmark complete. Base latency: ${this.systemLatency.toFixed(2)}ms`);
    }

    showCanvas() {
        this.canvasContainer.style.display = 'block';
    }

    hideCanvas() {
        this.canvasContainer.style.display = 'none';
    }

    /**
     * Resets the view state, ensuring menus are closed and state is clean for the new view.
     */
    resetView() {
        this.isPaused = false;
        if (this.uiManager) {
            try {
                this.uiManager.hidePauseMenu();
                if (typeof this.uiManager.closeSubMenus === 'function') {
                    this.uiManager.closeSubMenus();
                }
                // Ensure UIManager is aware of the reset
                if (typeof this.uiManager.onViewReset === 'function') {
                    this.uiManager.onViewReset();
                }
            } catch (e) {
                Logger.warn("ViewManager: Error in UIManager.resetView operations", e);
            }
        }
        this.setHUD(null);
        this.setActiveComponent(null);
    }

    /**
     * Cues a scene to be played as part of a sequence.
     * @param {string} sceneName - Name of the scene class.
     * @param {object} sceneData - Data for the scene.
     * @param {object} options - Sequencing options (duration, onActive callback).
     */
    cueScene(sceneName, sceneData = {}, options = {}) {
        this.sceneQueue.push({
            name: sceneName,
            data: sceneData,
            options: {
                duration: options.duration || 0, // Minimum time to show scene
                onActive: options.onActive || null, // Async function to run when active
                transition: options.transition || null, // Transition options
                ...options
            }
        });
        Logger.message(`ViewManager: Cued scene '${sceneName}'. Queue length: ${this.sceneQueue.length}`);
    }

    /**
     * Starts playing the cued scene sequence.
     */
    async playSequence() {
        if (this.isSequencing) return;
        this.isSequencing = true;
        Logger.message("ViewManager: Starting scene sequence...");

        while (this.sceneQueue.length > 0) {
            const item = this.sceneQueue.shift();
            const startTime = performance.now();

            // Notify UI of upcoming transition
            if (this.uiManager && typeof this.uiManager.onSceneTransitionStart === 'function') {
                this.uiManager.onSceneTransitionStart(item.name);
            }

            // Verify preparation before transition to avoid crashing the sequence
            if (!this.preparedScenes.has(item.name)) {
                Logger.message(`ViewManager: Sequence item '${item.name}' not cached. Attempting just-in-time preparation.`);

                const scene = await this.sceneManager.prepareScene(item.name, item.data, (p) => {
                    this.uiMessage.showMessage({
                        key: 'seq_loader',
                        title: 'Loading...',
                        template: 'loading_scene',
                        data: { message: p.status || 'Loading...' },
                        showProgress: true,
                        progress: p.percent
                    });
                });

                this.uiMessage.closeMessage('seq_loader');

                if (!scene) {
                    Logger.error(`ViewManager: Failed to prepare '${item.name}'. Skipping to next sequence item.`);
                    continue;
                }
                this.addSceneToCache(item.name, scene);
                if (scene.isActive) scene.onUnload();
            }

            // 1. Transition to the scene
            const success = await this.transitionToScene(item.name, item.data, item.options.transition);

            if (success) {
                // 2. Start preparing the NEXT scene in the background (Pre-load)
                const nextItem = this.sceneQueue.length > 0 ? this.sceneQueue[0] : null;
                let nextScenePromise = null;

                if (nextItem) {
                    if (!this.preparedScenes.has(nextItem.name)) {
                        Logger.message(`ViewManager: Pre-loading next scene '${nextItem.name}'...`);
                        nextScenePromise = this.sceneManager.prepareScene(nextItem.name, nextItem.data, (progress) => {
                            // Background loading progress - usually ignored during sequence
                        }).then(scene => {
                            if (scene) {
                                this.addSceneToCache(nextItem.name, scene);
                                // Ensure it is paused (not running) until explicitly loaded
                                if (scene.isActive) scene.onUnload();
                            }
                            return scene;
                        });
                    }
                }

                // 3. Run any specific logic for this scene while it's active
                if (item.options.onActive) {
                    try {
                        await item.options.onActive(this.currentScene);
                    } catch (e) {
                        Logger.error(`ViewManager: Error in scene onActive callback for ${item.name}`, e);
                    }
                }

                // 4. Wait for the minimum duration, accounting for safety margin
                const elapsed = performance.now() - startTime;
                const safetyBuffer = this.systemLatency * this.safetyMarginFactor;
                const remainingTime = Math.max(0, item.options.duration - elapsed);

                if (remainingTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, remainingTime));
                }

                // Ensure we don't switch faster than the safety buffer allows for stability
                const totalTime = performance.now() - startTime;
                if (totalTime < safetyBuffer) {
                    await new Promise(resolve => setTimeout(resolve, safetyBuffer - totalTime));
                }

                // 5. Ensure next scene is ready before we loop to transition
                if (nextScenePromise) {
                    await nextScenePromise;
                }
            }

            if (this.uiManager && typeof this.uiManager.onSceneTransitionEnd === 'function') {
                this.uiManager.onSceneTransitionEnd(item.name);
            }
        }

        this.isSequencing = false;
        Logger.message("ViewManager: Scene sequence complete.");
    }

    /**
     * The main scene transition function. It ensures a scene is prepared before displaying it.
     * @param {string} sceneName The name of the scene to transition to.
     * @param {object} sceneData Optional data for the scene.
     * @param {object} transitionOptions Optional transition effects (type, duration, etc).
     */
    async transitionToScene(sceneName, sceneData = {}, transitionOptions = null) {
        const funcName = 'ViewManager.transitionToScene';
        Logger.start(funcName, { sceneName });

        // 1. Prepare the new scene (or retrieve from cache)
        // We do this first to ensure we don't unload the current scene if the new one fails.
        let newScene = this.preparedScenes.get(sceneName);
        if (!newScene) {
            Logger.message(`Scene '${sceneName}' not in cache. Preparing...`);
            EventBus.emit('scene:loading', sceneName); // For UIManager to show loading screen

            // Show loading progress window
            this.uiMessage.showMessage({
                key: 'scene_loader',
                title: 'Loading Scene',
                template: 'loading_scene',
                data: { message: `Preparing ${sceneName}...` },
                showProgress: true,
                progress: 0
            });

            const onProgress = (progress) => {
                EventBus.emit('scene:loading_progress', { sceneName, ...progress });
                this.uiMessage.showMessage({
                    key: 'scene_loader',
                    title: 'Loading Scene',
                    template: 'loading_scene',
                    data: { message: progress.status || `Loading ${sceneName}...` },
                    showProgress: true,
                    progress: progress.percent
                });
            };

            newScene = await this.sceneManager.prepareScene(sceneName, sceneData, onProgress);
            this.uiMessage.closeMessage('scene_loader');

            if (!newScene) {
                this.handleSceneLoadFailure(sceneName, "Preparation failed in SceneManager.");
                return false;
            }
            this.addSceneToCache(sceneName, newScene);
        } else {
            Logger.message(`Scene '${sceneName}' found in cache.`);
            // Inject updated data if the scene supports it (fixes pre-loading race conditions)
            if (sceneData && typeof newScene.updateSceneData === 'function') {
                newScene.updateSceneData(sceneData);
            }
        }

        // 2. Handle Transition Start (Capture old scene)
        if (transitionOptions && this.currentScene) {
            await this.performTransitionStart(transitionOptions);
        }

        // 3. Unload current scene if there is one
        if (this.currentScene) {
            Logger.message(`Unloading previous scene: ${this.currentScene.constructor.name}`);
            this.currentScene.onUnload();
            EventBus.emit('scene:unload', this.currentScene.constructor.name);
            this.currentScene = null;
        }
        this.hideCanvas();
        this.resetView();

        // 4. Load the new scene into the view
        this.currentScene = newScene;

        // Ensure the renderer's DOM element is in the container
        if (this.renderer.domElement.parentNode !== this.canvasContainer) {
            this.canvasContainer.appendChild(this.renderer.domElement);
        }

        this.showCanvas();
        this.currentScene.onLoad(); // This starts the animation loop

        EventBus.emit('scene:load', sceneName);

        // Explicitly notify UIManager if it has the method
        if (this.uiManager && typeof this.uiManager.onSceneLoaded === 'function') {
            this.uiManager.onSceneLoaded(sceneName);
        }

        Logger.message(`Successfully transitioned to scene: ${sceneName}`);

        // 5. Handle Transition End (Reveal new scene)
        if (transitionOptions) {
            await this.performTransitionEnd(transitionOptions);
        } else {
            this.transitionOverlay.style.display = 'none';
        }

        return true;
    }

    async performTransitionStart(options) {
        const type = options.type || 'fade';
        const duration = options.duration || 1000;
        const color = options.color || '#000000';
        const overlay = this.transitionOverlay;

        overlay.style.display = 'block';
        overlay.style.transition = 'none';
        overlay.style.opacity = '0';
        overlay.style.transform = 'none';
        overlay.style.clipPath = 'none';
        overlay.style.filter = 'none';

        // Check if we need to capture the screen
        const needsCapture = ['crossDissolve', 'wipe', 'slide', 'zoom', 'push', 'pageTurn', 'glitch', 'whipPan'].includes(type);

        if (needsCapture && this.renderer && this.renderer.domElement) {
            try {
                const dataUrl = this.renderer.domElement.toDataURL();
                overlay.style.backgroundImage = `url(${dataUrl})`;
                overlay.style.backgroundColor = 'transparent';
                overlay.style.opacity = '1'; // Show immediately to freeze frame
            } catch (e) {
                Logger.warn("ViewManager: Failed to capture screen for transition.", e);
                overlay.style.backgroundColor = color; // Fallback
            }
        } else {
            overlay.style.backgroundImage = 'none';
            overlay.style.backgroundColor = color;
        }

        if (type === 'fade' || type === 'fadeToBlack') {
            // Fade to color
            void overlay.offsetWidth; // Force reflow
            overlay.style.transition = `opacity ${duration / 2}ms ease-in`;
            overlay.style.opacity = '1';
            await new Promise(r => setTimeout(r, duration / 2));
        } else {
            // For visual transitions, we already set opacity 1 (freeze frame).
            // Wait a frame to ensure it's rendered.
            await new Promise(r => requestAnimationFrame(r));
        }
    }

    async performTransitionEnd(options) {
        const type = options.type || 'fade';
        const duration = options.duration || 1000;
        const overlay = this.transitionOverlay;

        void overlay.offsetWidth; // Force reflow

        if (type === 'fade' || type === 'fadeToBlack') {
            overlay.style.transition = `opacity ${duration / 2}ms ease-out`;
            overlay.style.opacity = '0';
            await new Promise(r => setTimeout(r, duration / 2));
        }
        else if (type === 'crossDissolve') {
            overlay.style.transition = `opacity ${duration}ms ease`;
            overlay.style.opacity = '0';
            await new Promise(r => setTimeout(r, duration));
        }
        else if (type === 'wipe') {
            const direction = options.direction || 'right';
            overlay.style.transition = `clip-path ${duration}ms ease-in-out`;
            if (direction === 'right') overlay.style.clipPath = 'inset(0 0 0 100%)';
            else if (direction === 'left') overlay.style.clipPath = 'inset(0 100% 0 0)';
            else if (direction === 'up') overlay.style.clipPath = 'inset(0 0 100% 0)';
            else if (direction === 'down') overlay.style.clipPath = 'inset(100% 0 0 0)';
            await new Promise(r => setTimeout(r, duration));
        }
        else if (type === 'circleWipe' || type === 'iris') {
            overlay.style.transition = `clip-path ${duration}ms ease-in-out`;
            overlay.style.clipPath = 'circle(0% at 50% 50%)';
            await new Promise(r => setTimeout(r, duration));
        }
        else if (type === 'slide' || type === 'push') {
            const direction = options.direction || 'left';
            overlay.style.transition = `transform ${duration}ms ease-in-out`;
            if (direction === 'left') overlay.style.transform = 'translateX(-100%)';
            else if (direction === 'right') overlay.style.transform = 'translateX(100%)';
            else if (direction === 'up') overlay.style.transform = 'translateY(-100%)';
            else if (direction === 'down') overlay.style.transform = 'translateY(100%)';
            await new Promise(r => setTimeout(r, duration));
        }
        else if (type === 'zoom') {
            overlay.style.transition = `transform ${duration}ms ease-in, opacity ${duration}ms ease-out`;
            overlay.style.transform = 'scale(2)';
            overlay.style.opacity = '0';
            await new Promise(r => setTimeout(r, duration));
        }
        else {
            // Default fade out
            overlay.style.transition = `opacity ${duration}ms ease`;
            overlay.style.opacity = '0';
            await new Promise(r => setTimeout(r, duration));
        }

        overlay.style.display = 'none';
        overlay.style.backgroundImage = 'none';
        overlay.style.clipPath = 'none';
        overlay.style.transform = 'none';
    }

    addSceneToCache(sceneName, sceneInstance) {
        if (this.preparedScenes.size >= this.MAX_CACHE_SIZE) {
            // Evict the least recently used scene (first item in map)
            const lruSceneName = this.preparedScenes.keys().next().value;
            const lruScene = this.preparedScenes.get(lruSceneName);
            lruScene.dispose();
            this.preparedScenes.delete(lruSceneName);
            Logger.message(`Evicted scene '${lruSceneName}' from cache.`);
        }
        this.preparedScenes.set(sceneName, sceneInstance);
    }

    /**
     * Sets the currently selected component for placement.
     * @param {string} componentId - The ID of the component to be placed.
     */
    setActiveComponent(componentId) {
        this.activeComponentForPlacement = componentId;
        Logger.message(`ViewManager: Active component for placement set to ${componentId}`);
        // We can also emit an event here if other parts of the UI need to know
        EventBus.emit('component:select', componentId);
    }

    /**
     * Loads the planet surface scene for a given planet.
     * @param {object} planetData - The data for the planet to be displayed.
     */
    async showPlanetSurface(planetData) {
        Logger.message(`ViewManager: Showing planet surface for ${planetData.name}`);
        try {
            const success = await this.transitionToScene('PlanetSurfaceScene', planetData);
            if (!success) {
                this.handleSceneLoadFailure('PlanetSurfaceScene');
            }
        } catch (error) {
            Logger.error(`ViewManager: Error loading PlanetSurfaceScene:`, error);
            this.handleSceneLoadFailure('PlanetSurfaceScene');
        }
    }

    async showGalaxyMap(startLocation = null) {
        Logger.message(`ViewManager: showGalaxyMap called.`);
        if (!this.gameEngine.galaxy) {
            Logger.error(`ViewManager: galaxy object is missing from gameEngine.`);
            this.handleSceneLoadFailure('GalaxyMapScene', 'Galaxy data missing');
            return;
        }
        Logger.message(`ViewManager: galaxy object exists. Calling loadScene.`);
        try {
            const success = await this.transitionToScene('GalaxyMapScene', { galaxy: this.gameEngine.galaxy, startLocation: startLocation });
            if (!success) {
                this.handleSceneLoadFailure('GalaxyMapScene');
            } else {
                Logger.message(`ViewManager: loadScene for GalaxyMapScene completed.`);
            }
        } catch (error) {
            Logger.error(`ViewManager: Error loading GalaxyMapScene:`, error);
            this.handleSceneLoadFailure('GalaxyMapScene');
        }
    }

    async showSolarSystem(starData) {
        Logger.message(`ViewManager: Showing Solar System for ${starData.systemDetails.name}`);
        try {
            const success = await this.transitionToScene('LocalSpaceScene', { ...starData, galaxy: this.gameEngine.galaxy });
            if (!success) {
                this.handleSceneLoadFailure('LocalSpaceScene');
            }
        } catch (error) {
            Logger.error(`ViewManager: Error loading LocalSpaceScene:`, error);
            this.handleSceneLoadFailure('LocalSpaceScene');
        }
    }

    handleSceneLoadFailure(sceneName, reason = 'Unknown') {
        Logger.error(`ViewManager: CRITICAL FAILURE loading scene ${sceneName}. Reason: ${reason}`);

        // Fallback to main menu if not already there
        if (sceneName !== 'MainMenuScene') {
            Logger.message("ViewManager: Attempting fallback to Main Menu.");
            this.showMainMenu();
        } else {
            // If Main Menu fails, we are in trouble.
            console.error("Critical Error: Unable to load Main Menu. Game is in an unrecoverable state.");
            alert("Critical Error: Unable to load game views. Please refresh the page.");
        }
    }

    /**
     * Transitions the view to the Main Menu.
     * Called by LoaderManager when loading is complete.
     */
    showMainMenu() {
        Logger.message("ViewManager: Showing Main Menu.");
        if (this.currentScene) {
            this.currentScene.onUnload();
            this.currentScene = null;
        }
        this.hideCanvas();
        try {
            if (this.uiManager && typeof this.uiManager.showMainMenu === 'function') {
                this.uiManager.showMainMenu();
            } else {
                throw new Error("UIManager missing or invalid");
            }
        } catch (e) {
            Logger.warn("ViewManager: UIManager.showMainMenu failed, using fallback.", e);
            // Try multiple common IDs for the main menu
            const menu = document.getElementById('main-menu') ||
                document.getElementById('mainMenu') ||
                document.querySelector('.main-menu');

            if (menu) {
                Logger.message("ViewManager: Found Main Menu element, forcing display.");
                menu.style.display = 'flex';
                menu.style.flexDirection = 'column';
                menu.style.justifyContent = 'center';
                menu.style.alignItems = 'center';
                menu.classList.add('menu-reveal');
            }
        }
    }
}
