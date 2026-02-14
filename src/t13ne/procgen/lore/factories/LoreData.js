import Logger from '../../core/Logger.js';

/**
 * Asynchronously loads and manages all static lore data from JSON files.
 * This acts as a singleton; data is fetched once and then cached.
 */
class LoreDataManager {
    constructor() {
        const funcName = 'LoreDataManager.constructor';
        Logger.start(funcName);
        this._isLoaded = false;
        this.dataFiles = []; // Will be populated from the manifest.
        Logger.end(funcName);
    }

    load() {
        const funcName = 'LoreDataManager.load';
        Logger.start(funcName);
        if (this._isLoaded) return Promise.resolve();

        const MANIFEST_PATH = '/data/lore-manifest.json';

        const loadJSON = async (url) => {
            let response = await fetch(url);
            let attemptedUrl = url;

            // If the first attempt fails with a 404, try a lowercase version of the filename.
            if (response.status === 404) {
                const pathParts = url.split('/');
                const filename = pathParts.pop();
                const lowercaseUrl = [...pathParts, filename.toLowerCase()].join('/');

                if (url !== lowercaseUrl) {
                    Logger.message(`WARN: LoreDataManager: Failed to fetch ${url} (404), retrying with ${lowercaseUrl}`);
                    response = await fetch(lowercaseUrl);
                    attemptedUrl = lowercaseUrl;
                }
            }

            const contentType = response.headers.get('content-type');
            if (!response.ok) {
                throw new Error(`Failed to fetch ${attemptedUrl}: ${response.status} ${response.statusText}`);
            }
            
            if (contentType && !contentType.includes('application/json')) {
                Logger.message(`WARN: LoreDataManager: ${attemptedUrl} served with content-type '${contentType}', expected 'application/json'. Attempting to parse anyway.`);
            }

            // Clone the response to read its body as text without consuming it.
            const text = await response.clone().text();
            if (!text) {
                throw new Error(`Failed to load JSON from ${attemptedUrl}: Response body is empty.`);
            }

            try {
                return await response.json();
            } catch (e) {
                throw new Error(`JSON Parse Error in ${attemptedUrl}: ${e.message}`);
            }
        };

        // Return a promise that resolves when all data is loaded
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Load the manifest file first.
                const manifest = await loadJSON(MANIFEST_PATH);
                
                if (!manifest || !Array.isArray(manifest.files)) {
                    throw new Error(`Manifest at ${MANIFEST_PATH} is invalid or missing 'files' array.`);
                }
                this.dataFiles = manifest.files;

                // Initialize properties to null based on the manifest.
                this.dataFiles.forEach(file => {
                    this[file.key] = null;
                });

                // --- Pre-flight Check ---
                const criticalFile = this.dataFiles.find(f => f.isCritical);
                if (!criticalFile) {
                    Logger.message("WARN: LoreDataManager: No critical file marked in manifest. Skipping pre-flight check.");
                } else {
                    try {
                        await loadJSON(criticalFile.path);
                    } catch (error) {
                        reject(new Error(`Pre-flight check failed for critical file ${criticalFile.path}. This is likely a Vite server configuration issue. Please ensure your dev server is running from the project root and that your 'vite.config.js' correctly defines the 'publicDir' to be the 'public' folder at the project root. Original error: ${error.message}`));
                        return;
                    }
                }
                // --- End Pre-flight Check ---

                const promises = this.dataFiles.map(file =>
                    loadJSON(file.path)
                        .then(data => ({ key: file.key, data }))
                        .catch(error => {
                            if (file.isCritical) throw error;
                            Logger.message(`WARN: LoreDataManager: Failed to load optional file '${file.key}' from '${file.path}': ${error.message}`);
                            return { key: file.key, data: null };
                        })
                );

                const results = await Promise.all(promises);

                results.forEach(result => {
                    Logger.message(`LoreDataManager: Assigning key '${result.key}'.`);
                    this[result.key] = result.data;
                });

                this._isLoaded = true;
                Logger.message("LoreDataManager: All lore data loaded successfully.");
                Logger.end(funcName);
                resolve();
            } catch (error) {
                Logger.message(`ERROR: LoreDataManager: Failed during LoreData loading: ${error}`);
                Logger.end(funcName);
                reject(error);
            }
        });
    }

    isLoaded() {
        return this._isLoaded;
    }
}

export const LoreData = new LoreDataManager();
