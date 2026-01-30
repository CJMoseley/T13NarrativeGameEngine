import Logger from '../core/Logger.js';
/**
 * Fetches and instantiates a WebAssembly module.
 * @param {URL | string} url - The URL of the .wasm file.
 * @returns {Promise<WebAssembly.Instance | null>} The instantiated WASM module instance, or null on failure.
 */
export async function loadWasmModule(url) {
    try {
        const response = await fetch(url);
        // Check if the server responded with an error, or if the content-type indicates it's not a WASM file
        if (!response.ok || !response.headers.get('content-type')?.includes('wasm')) {
            throw new Error(`Failed to fetch WASM module: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(buffer);
        return instance;
    } catch (error) {
        // This catch block is expected to be hit since perlin.wasm doesn't exist yet.
        // We log it as a warning instead of an error.
        Logger.message(`WARN: Could not load WASM module from ${url.pathname.split('/').pop()}: ${error.message}`);
        return null;
    }
}
