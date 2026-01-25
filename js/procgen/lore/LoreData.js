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
        if (this._isLoaded) return;

        const MANIFEST_PATH = '/data/lore-manifest.json';

        const loadJSON = async (url) => {
            Logger.message(`LoreDataManager: Attempting to load JSON from: ${url}`);
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
            if (!response.ok || !contentType || !contentType.includes('application/json')) {
                const statusText = response.ok
                    ? `but received Content-Type: ${contentType || 'unknown'}`
                    : `${response.status} ${response.statusText}`;
                throw new Error(`Failed to fetch valid JSON from ${attemptedUrl}. Server responded with status ${statusText}`);
            }

            // Clone the response to read its body as text without consuming it.
            const text = await response.clone().text();
            if (!text) {
                throw new Error(`Failed to load JSON from ${attemptedUrl}: Response body is empty.`);
            }

            return response.json(); // Now it's safe to parse.
        };

        // Return a promise that resolves when all data is loaded
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Load the manifest file first.
                const manifest = await loadJSON(MANIFEST_PATH);
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
                        Logger.message(`ERROR: Vite Server Configuration Error: ${error}`);
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
                    // Debug: Log keys to help identify structure mismatches
                    if (result.data && typeof result.data === 'object') {
                        Logger.message(`LoreDataManager: Keys for '${result.key}':`, Object.keys(result.data));
                    }
                });

                // Post-process species foundations to ensure traits are inherited
                this._processSpeciesTraits();
                this._processCorporations();

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

    _processSpeciesTraits() {
        if (!this.speciesFoundations) return;
        
        const archetypes = this.speciesFoundations.filter(s => s.type === 'archetype');
        const templates = this.speciesFoundations.filter(s => s.type === 'template');

        templates.forEach(template => {
            // Ensure traits array exists
            if (!template.traits) template.traits = [];
            
            // Inherit from archetype
            if (template.derivesFrom) {
                const archetype = archetypes.find(a => a.id === template.derivesFrom);
                if (archetype && archetype.traits) {
                    archetype.traits.forEach(trait => {
                        if (!template.traits.includes(trait)) template.traits.push(trait);
                    });
                }
            }

            // Add mods as traits
            if (template.mods) {
                template.mods.forEach(mod => {
                    if (!template.traits.includes(mod)) template.traits.push(mod);
                });
            }
        });
    }

    _processCorporations() {
        if (this.corporations && this.corporations.ARCHETYPES) {
            // Convert to array if it's an object (to handle map-like JSON structures)
            if (!Array.isArray(this.corporations.ARCHETYPES)) {
                this.corporations.ARCHETYPES = Object.values(this.corporations.ARCHETYPES);
            }

            this.corporations.ARCHETYPES.forEach(corp => {
                // Ensure arrays exist for properties likely to be checked with .includes()
                if (!corp.tags) corp.tags = [];
                if (!corp.industries) corp.industries = [];
                // Ensure strings exist
                if (!corp.name) corp.name = "Unknown Corp";
                if (!corp.type) corp.type = "Generic";
            });
        }
    }

    isLoaded() {
        return this._isLoaded;
    }
}

export const LoreData = new LoreDataManager();
