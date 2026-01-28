import * as THREE from 'three';
import Logger from '@/js/core/Logger.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { Controls } from '@/js/core/Controls.js';

/**
 * An "Empty Stage" or base class for all scenes in the application.
 * It provides a standardized structure for initialization, asset preparation,
 * lifecycle management, and rendering. It also includes a basic multi-camera system.
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

        this.scene = new THREE.Scene();
        this.renderer = this.viewManager.renderer;
        if (!this.renderer) {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.viewManager.renderer = this.renderer; // Assign back to ViewManager
            // The canvas is appended by the ViewManager when a scene is first shown.
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
     * Sets up camera controls for a specific camera.
     * @param {string} type - 'orbit', 'trackball', or 'none'.
     * @param {object} options - Configuration options for the controls.
     * @param {string} [cameraName] - The name of the camera to attach controls to. Defaults to active camera.
     */
    setupControls(type = 'orbit', options = {}, cameraName = null) {
        const targetCameraName = cameraName || this.activeCameraName;
        if (!targetCameraName || !this.cameras.has(targetCameraName)) {
            Logger.error(`Scene: Cannot setup controls. Camera '${targetCameraName}' not found.`);
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
            Logger.message(`Scene: Controls removed for camera '${targetCameraName}'.`);
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
        Logger.message(`Scene: Controls set to '${type}' for camera '${targetCameraName}'.`);
    }

    /**
     * Adds a camera to the scene's camera registry.
     * @param {string} name - A unique name for the camera.
     * @param {THREE.Camera} camera - The camera object.
     */
    addCamera(name, camera) {
        this.cameras.set(name, camera);
        Logger.message(`Scene: Camera '${name}' added.`);
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

            Logger.message(`Scene: Active camera set to '${name}'.`);
        } else {
            Logger.error(`Scene: Camera '${name}' not found.`);
        }
    }

    /**
     * Sets the mode for the active camera, which can influence controls or effects.
     * @param {string} mode - The mode to set ('game', 'cinematic', 'photo').
     */
    setCameraMode(mode) {
        if (this.cameraModes.includes(mode)) {
            this.activeCameraMode = mode;
            Logger.message(`Scene: Camera mode set to '${mode}'.`);
            // Subclasses can override this to change controls based on mode.
        } else {
            Logger.warn(`Scene: Invalid camera mode '${mode}'.`);
        }
    }

    /**
     * Backstage preparation. Asynchronous loading of assets, procedural generation, etc.
     * This method is called by the SceneManager and must complete before the scene can be shown.
     * @param {function} onProgress - A callback to report loading progress (0 to 1).
     * @returns {Promise<void>}
     */
    async prepare(onProgress) {
        // Example: onProgress(0.5); // Report 50% completion
        // Subclasses will override this to load their specific assets.
        Logger.message(`Preparing scene: ${this.constructor.name}`);
    }

    /**
     * Called by the ViewManager when the scene becomes the active, visible scene.
     * This should be a lightweight method, primarily for starting animations.
     */
    onLoad() {
        this.isActive = true;
        this.isLoaded = true;
        this.animate();
        Logger.message(`Scene loaded: ${this.constructor.name}`);
    }

    /**
     * Called by the ViewManager before a new scene is loaded.
     * This is for stopping animations and detaching event listeners.
     */
    onUnload() {
        this.isActive = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // Dispose all controls
        this.cameraControls.forEach(controls => controls.dispose());
        this.cameraControls.clear();

        Logger.message(`Scene unloaded: ${this.constructor.name}`);
    }

    /**
     * The main update loop, called on each frame. Subclasses should override this.
     * @param {number} time - The high-resolution timestamp from requestAnimationFrame.
     * @param {number} delta - The time in milliseconds since the last frame.
     */
    update(time, delta) {
        // Subclasses override this with their per-frame logic.
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
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        Logger.message(`Scene disposed: ${this.constructor.name}`);
    }
}
