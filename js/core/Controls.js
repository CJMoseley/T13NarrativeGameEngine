import Logger from '@/js/core/Logger.js';

/**
 * Manages game controls by loading them from public/data/controls.json.
 * Supports multiple schemes (e.g., flight_air, flight_wall).
 * Handles Keyboard, Mouse, and Gamepad input.
 */
class ControlsManager {
    constructor() {
        this.schemes = {};
        this._isLoaded = false;
        this.mouseState = {
            mouse0: false, // Left click
            mouse1: false, // Middle click
            mouse2: false, // Right click
            movementX: 0,
            movementY: 0,
            wheelDelta: 0
        };
        this.gamepadState = {
            axes: [0, 0, 0, 0], // Left Stick X/Y, Right Stick X/Y
            buttons: {} // Map of button index to boolean
        };
        this.lockingEnabled = false; // Disabled by default for menus
        this.initMouseListeners();
    }

    setLockingEnabled(enabled) {
        this.lockingEnabled = enabled;
        if (!enabled && document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    initMouseListeners() {
        window.addEventListener('mousedown', (e) => {
            const key = `mouse${e.button}`;
            if (this.mouseState[key] !== undefined) this.mouseState[key] = true;

            // Re-request pointer lock on click if enabled AND clicking the canvas
            if (this.lockingEnabled) {
                if (!document.pointerLockElement && e.button === 0) {
                    const canvas = document.querySelector('canvas');
                    if (canvas && e.target === canvas) {
                        canvas.requestPointerLock();
                    }
                } else if (document.pointerLockElement && e.button === 2) {
                    document.exitPointerLock();
                }
            }
        });
        window.addEventListener('mouseup', (e) => {
            const key = `mouse${e.button}`;
            if (this.mouseState[key] !== undefined) this.mouseState[key] = false;
        });
        window.addEventListener('mousemove', (e) => {
            // Always track movement deltas, regardless of lock state
            // This allows for "Right-click to look" mechanics
            this.mouseState.movementX += e.movementX;
            this.mouseState.movementY += e.movementY;
        });
        window.addEventListener('wheel', (e) => {
            this.mouseState.wheelDelta += e.deltaY;
        });
        // Prevent context menu on right click to allow for usage in game
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Resets mouse deltas after they've been consumed.
     */
    consumeMouseMovement() {
        const deltas = { 
            x: this.mouseState.movementX, 
            y: this.mouseState.movementY,
            wheel: this.mouseState.wheelDelta
        };
        this.mouseState.movementX = 0;
        this.mouseState.movementY = 0;
        this.mouseState.wheelDelta = 0;
        return deltas;
    }

    /**
     * Polls connected gamepads and updates internal state.
     * Should be called every frame.
     */
    update() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        // Use the first active gamepad found
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp) {
                this.gamepadState.axes = gp.axes;
                for (let b = 0; b < gp.buttons.length; b++) {
                    this.gamepadState.buttons[b] = gp.buttons[b].pressed;
                }
                break; // Only support one gamepad for now
            }
        }
    }

    /**
     * Loads controls from the JSON file.
     */
    async load() {
        const funcName = 'ControlsManager.load';
        Logger.start(funcName);
        if (this._isLoaded) return;

        try {
            const response = await fetch('/data/controls.json');
            if (!response.ok) throw new Error(`Failed to load controls.json: ${response.status}`);

            const data = await response.json();
            if (data.schemes) {
                this.schemes = data.schemes;
            }

            this._isLoaded = true;
            Logger.message("ControlsManager: Controls loaded successfully.");
        } catch (error) {
            Logger.error("ControlsManager: Error loading controls", error);
        }
        Logger.end(funcName);
    }

    /**
     * Checks if an action is pressed in a specific scheme.
     * @param {Object} keys - Current keyboard state from Physics Engine (or null if checking global state)
     * @param {string} schemeName - The scheme to check (e.g. 'flight_air')
     * @param {string} actionName - The action name (e.g. 'THRUST')
     */
    isPressed(keys, schemeName, actionName) {
        const scheme = this.schemes[schemeName];
        if (!scheme) return false;

        const actionDef = scheme[actionName];
        if (!actionDef) return false;

        // Helper to check a single key/mouse/gamepad identity
        const check = (id) => {
            if (!id) return false;
            
            // Mouse check
            if (id.startsWith('mouse')) return this.mouseState[id] || false;

            // Gamepad check (e.g., "gamepad_button_0", "gamepad_axis_1_pos")
            if (id.startsWith('gamepad')) {
                if (id.includes('button')) {
                    const btnIndex = parseInt(id.split('_')[2]);
                    return this.gamepadState.buttons[btnIndex] || false;
                }
                if (id.includes('axis')) {
                    const parts = id.split('_');
                    const axisIndex = parseInt(parts[2]);
                    const direction = parts[3]; // 'pos' or 'neg'
                    const val = this.gamepadState.axes[axisIndex];
                    const threshold = 0.5;
                    if (direction === 'pos') return val > threshold;
                    if (direction === 'neg') return val < -threshold;
                }
            }

            // Keyboard check
            if (keys) {
                let key = id;
                if (key === ' ') key = 'space';
                else key = key.toLowerCase();
                return keys[key] && keys[key].isDown;
            }
            return false;
        };

        return check(actionDef.key) || check(actionDef.alt_key) || check(actionDef.gamepad);
    }

    /**
     * Gets all actions for a scheme (useful for UI)
     */
    getActions(schemeName) {
        return this.schemes[schemeName] || {};
    }
}

export const Controls = new ControlsManager();
