import * as THREE from 'three';
import Logger from './Logger.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { EventBus } from './EventBus.js';
import { Controls } from './Controls.js';
import T13NE from '../T13NE.js'; // Import T13NE for config access

/**
 * An "Empty Stage" or base class for all scenes in the application.
 * It provides a standardized structure for initialization, asset preparation,
 * lifecycle management, and rendering. It also includes a basic multi-camera system.
 * 
 * Now includes T13NE specific functionality (Plots, Locations, 2D Layer) by default.
 */
export class Scene {
    /**
     * @param {ViewManager} viewManager - The manager for the overall view and UI.
     * @param {object} sceneData - Data passed to the scene during its creation.
     */
    constructor(viewManager, sceneData = {}) {
        this.viewManager = viewManager;
        this.gameEngine = viewManager.gameEngine;
        this.sceneData = sceneData;

        // Scene flow control properties
        this.estimatedPreparationTime = sceneData.estimatedPreparationTime || 1000; // Default 1s
        this.minDuration = sceneData.minDuration || 0; // Default 0s
        this.isPrepared = false;
        this.isPlaying = false;
        this.isComplete = false;

        // Narrative Context
        this.renderMode = sceneData.renderMode || '3d'; // '3d', '2d', or 'dual'
        this.location = sceneData.location || null; // T13 Location Entity
        this.plot = sceneData.plot || null; // T13Plot instance

        // Music Strategy
        this.theme = null;
        this.themeComponents = [];
        // 'replace' = play this scene's theme. 'merge' = mix with current. 'keep' = don't change.
        this.musicTransition = sceneData.musicTransition || 'replace'; 

        this.scene = new THREE.Scene();
        this.renderer = this.viewManager.renderer;
        if (!this.renderer) {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.viewManager.renderer = this.renderer; // Assign back to ViewManager
            // The canvas is appended by the ViewManager when a scene is first shown.
        }

        // 2D Layer (SVG & Raster)
        this.twoDContainer = null;
        this.svg = null;
        this.rasterLayer = null;
        this.sprites = [];

        if (this.renderMode === '2d' || this.renderMode === 'dual') {
            this.init2DLayer();
        }

        this.cameras = new Map();
        this.cameraControls = new Map(); // Map camera name -> controls instance
        this.activeCamera = null;
        this.activeCameraName = null;
        this.cameraModes = ['game', 'cinematic', 'photo'];
        this.activeCameraMode = 'game';

        this.shouldUpdateControls = true; // Flag to pause controls (e.g. during cutscenes)

        this.animationFrameId = null;
        this.isLoaded = false;
        this.isActive = false;

        // Default camera
        const defaultCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        defaultCamera.position.set(0, 10, 20);
        this.addCamera('default', defaultCamera);
        this.setActiveCamera('default');

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    /**
     * Initializes the 2D SVG/Raster layer for the scene.
     */
    init2DLayer() {
        this.twoDContainer = document.createElement('div');
        this.twoDContainer.id = `t13-scene-2d-${Date.now()}`;
        Object.assign(this.twoDContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '5'
        });
        document.body.appendChild(this.twoDContainer);

        // Raster Layer (for PNGs, JPGs, etc.)
        this.rasterLayer = document.createElement('div');
        Object.assign(this.rasterLayer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '1'
        });
        this.twoDContainer.appendChild(this.rasterLayer);

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "100%");
        this.svg.style.pointerEvents = 'none';
        this.svg.style.position = 'absolute';
        this.svg.style.zIndex = '2';
        this.twoDContainer.appendChild(this.svg);

        Logger.message("Scene: 2D Layer initialized (SVG & Raster).");

        // Handle initial background image if provided in sceneData
        if (this.sceneData.backgroundImage) {
            this.addRasterImage(this.sceneData.backgroundImage, { 
                id: 'scene-background',
                style: { width: '100%', height: '100%', objectFit: 'cover' } 
            });
        }
    }

    addRasterImage(src, options = {}) {
        if (!this.rasterLayer) return null;
        const img = document.createElement('img');
        img.src = src;
        if (options.id) img.id = options.id;
        if (options.className) img.className = options.className;
        if (options.style) Object.assign(img.style, options.style);
        this.rasterLayer.appendChild(img);
        return img;
    }

    /**
     * Adds an animated sprite to the 2D layer.
     */
    addSprite(src, options = {}) {
        if (!this.rasterLayer) return null;

        const sprite = {
            id: options.id || `sprite_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            element: document.createElement('div'),
            src: src,
            frames: options.frames || 1,
            currentFrame: 0,
            fps: options.fps || 12,
            loop: options.loop !== undefined ? options.loop : true,
            timer: 0,
            frameWidth: options.frameWidth || 64,
            frameHeight: options.frameHeight || 64,
            isPlaying: options.autoPlay !== undefined ? options.autoPlay : true,
            onComplete: options.onComplete || null,
            isSpritesheet: options.isSpritesheet || (options.frames > 1)
        };

        Object.assign(sprite.element.style, {
            position: 'absolute',
            width: `${sprite.frameWidth}px`,
            height: `${sprite.frameHeight}px`,
            backgroundImage: `url()`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0px 0px',
            top: (options.y || 0) + 'px',
            left: (options.x || 0) + 'px',
            pointerEvents: options.interactive ? 'auto' : 'none',
            zIndex: options.zIndex || '10'
        });

        if (options.style) Object.assign(sprite.element.style, options.style);
        if (options.className) sprite.element.className = options.className;

        this.rasterLayer.appendChild(sprite.element);
        this.sprites.push(sprite);
        return sprite;
    }

    removeSprite(spriteOrId) {
        const id = typeof spriteOrId === 'string' ? spriteOrId : spriteOrId.id;
        const idx = this.sprites.findIndex(s => s.id === id);
        if (idx !== -1) {
            const s = this.sprites[idx];
            if (s.element && s.element.parentNode) {
                s.element.parentNode.removeChild(s.element);
            }
            this.sprites.splice(idx, 1);
        }
    }

    /**
     * Helper to project 3D coordinates to 2D screen space.
     */
    projectTo2D(position) {
        if (!this.activeCamera) return { x: 0, y: 0 };

        const vector = position.clone();
        vector.project(this.activeCamera);

        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: (-(vector.y * 0.5) + 0.5) * window.innerHeight
        };
    }

    /**
     * Updates the scene data with new context (e.g. passed from IntroSequence).
     */
    updateContext(context) {
        if (!context) return;
        Object.assign(this.sceneData, context);
        // Subclasses can override to react to new data
    }

    /**
     * Sets up camera controls for a specific camera.
     * @param {string} type - 'orbit', 'trackball', or 'none'.
     * @param {object} options - Configuration options for the controls.
     * @param {string} [cameraName] - The name of the camera to attach controls to. Defaults to active camera.
     */
    setupControls(type = 'orbit', options = {}, cameraName = null) {
        const targetCameraName = cameraName || this.activeCameraName;
        if (!targetCameraName || !this.cameras.has(targetCameraName)) {
            Logger.error(`Scene: Cannot setup controls. Camera '' not found.`);
            return;
        }

        const camera = this.cameras.get(targetCameraName);
        const domElement = this.renderer.domElement;

        // Dispose existing controls for this camera if any
        if (this.cameraControls.has(targetCameraName)) {
            const oldControls = this.cameraControls.get(targetCameraName);
            if (oldControls && typeof oldControls.dispose === 'function') {
                oldControls.dispose();
            }
            this.cameraControls.delete(targetCameraName);
        }

        if (type === 'none') {
            Logger.message(`Scene: Controls removed for camera ''.`);
            return;
        }

        let controls;
        if (type === 'trackball') {
            controls = new TrackballControls(camera, domElement);
            controls.rotateSpeed = options.rotateSpeed || 2.0;
            controls.zoomSpeed = options.zoomSpeed || 1.2;
            controls.panSpeed = options.panSpeed || 0.8;
            controls.noZoom = options.noZoom || false;
            controls.noPan = options.noPan || false;
            controls.staticMoving = options.staticMoving || false;
            controls.dynamicDampingFactor = options.dynamicDampingFactor || 0.1;
            if (options.maxDistance) controls.maxDistance = options.maxDistance;
            if (options.minDistance) controls.minDistance = options.minDistance;
        } else {
            // Default to OrbitControls
            controls = new OrbitControls(camera, domElement);
            controls.enableDamping = options.enableDamping !== undefined ? options.enableDamping : true;
            controls.dampingFactor = options.dampingFactor || 0.05;
            controls.autoRotate = options.autoRotate || false;
            controls.autoRotateSpeed = options.autoRotateSpeed || 2.0;
            if (options.maxDistance) controls.maxDistance = options.maxDistance;
            if (options.minDistance) controls.minDistance = options.minDistance;
        }

        if (options.target) {
            controls.target.copy(options.target);
        }

        // Controls are enabled by default, but only updated when the camera is active
        controls.enabled = true;

        this.cameraControls.set(targetCameraName, controls);
        Logger.message(`Scene: Controls set to '' for camera ''.`);
    }

    /**
     * Adds a camera to the scene's camera registry.
     * @param {string} name - A unique name for the camera.
     * @param {THREE.Camera} camera - The camera object.
     */
    addCamera(name, camera) {
        this.cameras.set(name, camera);
        Logger.message(`Scene: Camera '' added.`);
    }

    /**
     * Sets the currently active camera for rendering.
     * Automatically handles enabling/disabling associated controls.
     * @param {string} name - The name of the camera to activate.
     */
    setActiveCamera(name) {
        if (this.cameras.has(name)) {
            // Disable controls for the previous camera
            if (this.activeCameraName && this.cameraControls.has(this.activeCameraName)) {
                const prevControls = this.cameraControls.get(this.activeCameraName);
                prevControls.enabled = false;
            }

            this.activeCamera = this.cameras.get(name);
            this.activeCameraName = name;
            this.onWindowResize(); // Ensure aspect ratio is correct

            // Enable controls for the new camera if they exist
            if (this.cameraControls.has(name)) {
                const newControls = this.cameraControls.get(name);
                newControls.enabled = true;
                // Ensure the controls are operating on the correct object (just in case)
                newControls.object = this.activeCamera;
                newControls.update();
            }

            Logger.message(`Scene: Active camera set to ''.`);
        } else {
            Logger.error(`Scene: Camera '' not found.`);
        }
    }

    /**
     * Sets the mode for the active camera, which can influence controls or effects.
     * @param {string} mode - The mode to set ('game', 'cinematic', 'photo').
     */
    setCameraMode(mode) {
        if (this.cameraModes.includes(mode)) {
            this.activeCameraMode = mode;
            Logger.message(`Scene: Camera mode set to ''.`);
            // Subclasses can override this to change controls based on mode.
        } else {
            Logger.warn(`Scene: Invalid camera mode ''.`);
        }
    }

    /**
     * Backstage preparation. Asynchronous loading of assets, procedural generation, etc.
     * This method is called by the SceneManager and must complete before the scene can be shown.
     * @param {function} onProgress - A callback to report loading progress (0 to 1).
     * @returns {Promise<void>}
     */
    async _prepare(onProgress) {
        // Subclasses will override this to load their specific assets.
        Logger.message(`Preparing scene: ${this.constructor.name}`);
        await this._generateTheme();
    }

    /**
     * Collects components from the scene to be used for theme generation.
     * Includes T13NE specific narrative elements.
     * @returns {Array<object>} An array of components for the theme generator.
     * @protected
     */
    _getThemeComponents() {
        const components = [];
        if (this.sceneData) {
            components.push({ name: `SceneData_${this.constructor.name}`, type: 'Scene', ...this.sceneData });
        }
        if (this.location) {
            components.push(this.location);
        }
        if (this.plot) {
            components.push(this.plot);
        }
        // Add other relevant entities from the game engine if available
        const gameEngine = this.gameEngine;
        if (gameEngine) {
            if (gameEngine.playerCharacter) components.push(gameEngine.playerCharacter);
            if (gameEngine.playerShip) components.push(gameEngine.playerShip);
            if (gameEngine.crew) components.push(...gameEngine.crew);
        }
        return components;
    }

    /**
     * Generates the musical theme for this scene.
     * @protected
     */
    async _generateTheme() {
        const music = this.gameEngine.engine.getModule('Music');
        if (music && music.themeGenerator) {
            Logger.message(`Scene: Generating theme for ${this.constructor.name}...`);
            try {
                // Store components for potential merging later
                this.themeComponents = this._getThemeComponents();
                
                // Always generate a standalone theme for this scene, even if we might merge later.
                // This ensures we have a fallback and a distinct identity for the scene.
                this.theme = await music.createMainTheme(this.gameEngine, true, this.themeComponents);
                
                if (this.theme) {
                    // Rename it to avoid "Main Theme" collisions in logs/cache
                    this.theme.name = `${this.constructor.name} Theme`;
                    Logger.message(`Scene: Theme '${this.theme.name}' generated.`);
                }
            } catch (error) {
                Logger.error(`Scene: Failed to generate theme for ${this.constructor.name}.`, error);
            }
        }
    }

    async prepare(onProgress) {
        const startTime = performance.now();
        try {
            await this._prepare(onProgress); // Call the subclass's implementation
            this.isPrepared = true;
            const duration = performance.now() - startTime;
            this.estimatedPreparationTime = duration; // Update with actual time
            Logger.message(`Scene ${this.constructor.name} prepared in ${duration.toFixed(2)}ms.`);
            EventBus.emit('scene:prepared', this);
        } catch (error) {
            Logger.error(`Scene ${this.constructor.name} failed to prepare.`, error);
            EventBus.emit('scene:prepare_failed', this);
            throw error; // Re-throw so SceneManager can catch it.
        }
    }

    /**
     * Called by the ViewManager when the scene becomes the active, visible scene.
     * This should be a lightweight method, primarily for starting animations.
     */
    onLoad() {
        this.isActive = true;
        this.isLoaded = true;
        
        if (this.twoDContainer) {
            this.twoDContainer.style.display = 'block';
        }

        // Initialize default controls if 3D and camera exists and no controls set
        if ((this.renderMode === '3d' || this.renderMode === 'dual') && this.activeCamera && this.viewManager.renderer) {
            if (!this.cameraControls.has(this.activeCameraName)) {
                // Default to Trackball for T13 compatibility if not specified
                this.setupControls('trackball');
            }
        }

        this.animate();
        this.isPlaying = true;
        EventBus.emit('scene:playing', this);
        Logger.message(`Scene loaded and playing: ${this.constructor.name}`);
    }

    /**
     * Called by the ViewManager before a new scene is loaded.
     * This is for stopping animations and detaching event listeners.
     */
    onUnload() {
        this.isPlaying = false;
        this.isActive = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        if (this.twoDContainer) {
            this.twoDContainer.style.display = 'none';
        }

        // Dispose all controls
        this.cameraControls.forEach(controls => controls.dispose());
        this.cameraControls.clear();

        Logger.message(`Scene unloaded: ${this.constructor.name}`);
    }

    /**
     * Scenes should call this method when their internal logic/animation is complete.
     */
    complete() {
        if (this.isComplete) return;
        this.isComplete = true;
        EventBus.emit('scene:complete', this);
        Logger.message(`Scene complete: ${this.constructor.name}`);
    }

    /**
     * The main update loop, called on each frame. Subclasses should override this.
     * @param {number} time - The high-resolution timestamp from requestAnimationFrame.
     * @param {number} delta - The time in milliseconds since the last frame.
     */
    update(time, delta) {
        // Subclasses override this with their per-frame logic.
        if (this.renderMode === '2d' || this.renderMode === 'dual') {
            this.update2D(time, delta);
        }
    }

    /**
     * Update loop for 2D elements.
     */
    update2D(time, delta) {
        // Update animated sprites
        if (this.sprites && this.sprites.length > 0) {
            for (let i = 0; i < this.sprites.length; i++) {
                const sprite = this.sprites[i];
                if (sprite.isPlaying && sprite.isSpritesheet && sprite.frames > 1) {
                    sprite.timer += delta;
                    const interval = 1000 / sprite.fps;
                    
                    if (sprite.timer >= interval) {
                        const framesToAdvance = Math.floor(sprite.timer / interval);
                        sprite.timer %= interval;
                        
                        sprite.currentFrame += framesToAdvance;
                        
                        if (sprite.currentFrame >= sprite.frames) {
                            if (sprite.loop) {
                                sprite.currentFrame = sprite.currentFrame % sprite.frames;
                            } else {
                                sprite.currentFrame = sprite.frames - 1;
                                sprite.isPlaying = false;
                                if (typeof sprite.onComplete === 'function') sprite.onComplete();
                            }
                        }
                        
                        // Assuming horizontal spritesheet
                        const posX = -(sprite.currentFrame * sprite.frameWidth);
                        sprite.element.style.backgroundPosition = `px 0px`;
                    }
                }
            }
        }
    }

    /**
     * The core animation loop.
     */
    animate() {
        if (!this.isActive) return;

        // It's better to use a clock for delta time calculation
        const time = performance.now();
        const delta = (time - (this.lastTime || time));
        this.lastTime = time;

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

        // Update Global Controls (Gamepad polling)
        Controls.update();

        // Update Active Camera Controls
        if (this.shouldUpdateControls && this.activeCameraName && this.cameraControls.has(this.activeCameraName)) {
            const controls = this.cameraControls.get(this.activeCameraName);
            if (controls.enabled) {
                controls.update();
            }
        }

        this.update(time, delta);

        if (this.gameEngine && typeof this.gameEngine.update === 'function') {
            this.gameEngine.update(time, delta);
        }

        if (this.activeCamera && this.renderer) {
            this.renderer.render(this.scene, this.activeCamera);
        }
    }

    /**
     * Handles window resize events to keep the camera and renderer updated.
     */
    onWindowResize() {
        if (this.activeCamera) {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.activeCamera.aspect = width / height;
            this.activeCamera.updateProjectionMatrix();
            this.renderer.setSize(width, height);

            // Resize controls if they exist
            if (this.activeCameraName && this.cameraControls.has(this.activeCameraName)) {
                const controls = this.cameraControls.get(this.activeCameraName);
                if (typeof controls.handleResize === 'function') {
                    controls.handleResize();
                }
            }
        }
    }

    /**
     * Cleans up all resources used by the scene.
     */
    dispose() {
        this.onUnload();
        this.scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        this.scene.clear();
        this.cameras.clear();
        
        if (this.twoDContainer && this.twoDContainer.parentNode) {
            this.twoDContainer.parentNode.removeChild(this.twoDContainer);
        }
        this.sprites = [];

        window.removeEventListener('resize', this.onWindowResize.bind(this));
        Logger.message(`Scene disposed: ${this.constructor.name}`);
    }
}
