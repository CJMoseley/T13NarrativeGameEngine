import audioModule from './audio.js';
import coreModule from './core.js';
import prngModule from './prng.js';

let wasmAudio = null;
let wasmCore = null;
let wasmPRNG = null;

const WasmManager = {
    initialized: false,
    async initialize() {
        if (this.initialized) return;
        try {
            [wasmAudio, wasmCore, wasmPRNG] = await Promise.all([
                audioModule(),
                coreModule(),
                prngModule()
            ]);
            this.initialized = true;
            console.log('T13NE_WasmManager: All WASM modules initialized.');
        } catch (e) {
            console.error('T13NE_WasmManager: Initialization failed.', e);
        }
    },
    get audio() { return wasmAudio; },
    get core() { return wasmCore; },
    get prng() { return wasmPRNG; }
};

export default WasmManager;
