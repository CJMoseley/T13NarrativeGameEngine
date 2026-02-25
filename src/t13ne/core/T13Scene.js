import * as THREE from 'three';
import { Scene } from './Scene.js';
import Logger from './Logger.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import T13NE from '../T13NE.js';

/**
 * T13Scene
 * Extends the base Scene to support unified 3D and 2D rendering targets.
 * This is the primary scene class for the T13NE Engine.
 */
export class T13Scene extends Scene {
    constructor(viewManager, sceneData = {}) {
        super(viewManager, sceneData);

        this.renderMode = sceneData.renderMode || '3d'; // '3d', '2d', or 'dual'
        this.location = sceneData.location || null; // T13 Location Entity
        this.plot = sceneData.plot || null; // T13Plot instance

        // 2D Layer (SVG)
        this.twoDContainer = null;
        this.svg = null;
        this.rasterLayer = null;
        
        this.controls = null;
        this.sprites = [];

        if (this.renderMode === '2d' || this.renderMode === 'dual') {
            this.init2DLayer();
        }
    }

    /**
     * Updates the scene data with new context (e.g. passed from IntroSequence).
     * Useful for scenes preloaded before all data was available.
     */
    updateContext(context) {
        if (!context) return;
        Object.assign(this.sceneData, context);
        // Subclasses can override to react to new data (e.g. show the ship)
    }

    /**
     * Initializes the 2D SVG layer for the scene.
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

        Logger.message("T13Scene: 2D Layer initialized (SVG & Raster).");

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
     * @param {string} src - Image source URL.
     * @param {object} options - Sprite options (frames, fps, loop, etc).
     * @returns {object} The sprite object.
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
            backgroundImage: `url(${src})`,
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
     * Called by ViewManager when scene is loaded.
     */
    onLoad() {
        super.onLoad();
        if (this.twoDContainer) {
            this.twoDContainer.style.display = 'block';
        }

        // Initialize default controls if 3D and camera exists
        if ((this.renderMode === '3d' || this.renderMode === 'dual') && this.activeCamera && this.viewManager.renderer) {
            if (!this.controls) {
                this.controls = new TrackballControls(this.activeCamera, this.viewManager.renderer.domElement);
                
                const config = T13NE.getConfig().controls || {};
                this.controls.rotateSpeed = config.rotateSpeed ?? 2.0;
                this.controls.zoomSpeed = config.zoomSpeed ?? 1.2;
                this.controls.panSpeed = config.panSpeed ?? 0.8;
                this.controls.staticMoving = false;
                this.controls.dynamicDampingFactor = 0.1;
            }
        }
    }

    /**
     * Called by ViewManager when scene is unloaded.
     */
    onUnload() {
        super.onUnload();
        if (this.twoDContainer) {
            this.twoDContainer.style.display = 'none';
        }
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
    }

    /**
     * Main update loop.
     */
    update(time, delta) {
        super.update(time, delta);
        if (this.controls) {
            // Sync controls with config
            const config = T13NE.getConfig().controls || {};
            this.controls.rotateSpeed = config.rotateSpeed ?? 2.0;
            this.controls.zoomSpeed = config.zoomSpeed ?? 1.2;
            this.controls.panSpeed = config.panSpeed ?? 0.8;

            this.controls.update();
        }
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
                        sprite.element.style.backgroundPosition = `${posX}px 0px`;
                    }
                }
            }
        }
    }

    /**
     * Dispose of resources.
     */
    dispose() {
        super.dispose();
        if (this.twoDContainer && this.twoDContainer.parentNode) {
            this.twoDContainer.parentNode.removeChild(this.twoDContainer);
        }
        this.sprites = [];
    }

    /**
     * Helper to project 3D coordinates to 2D screen space.
     * @param {THREE.Vector3} position - 3D world position.
     * @returns {object} {x, y} in pixels.
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
}
