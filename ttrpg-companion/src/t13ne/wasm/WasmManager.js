import prngModule from './prng.js';
import coreModule from './core.js';
import audioModule from './audio.js';

/**
 * WasmManager centralizes the initialization and access to WASM modules.
 */
class WasmManager {
    constructor() {
        this.initialized = false;
        this.prng = null;
        this.core = null;
        this.audio = null;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize modules with empty config or defaults
            this.prng = await prngModule();
            this.core = await coreModule();
            this.audio = await audioModule();

            this.initialized = true;
            console.log("WasmManager: All WASM modules initialized.");
        } catch (error) {
            console.error("WasmManager: Failed to initialize WASM modules:", error);
        }
    }
}

export default new WasmManager();
