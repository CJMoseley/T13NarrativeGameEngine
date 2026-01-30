import Logger from '@/src/t13ne/core/Logger.js';
import CodexDB from './CodexDB.js';

/**
 * CodexLibrary
 * Responsible for raw file I/O, caching, and the base library index.
 */
export class CodexLibrary {
    constructor() {
        this.codex = null;
        this.cache = {};
        this.fileIndex = new Map();
        this.lowerCaseIndex = new Map();
        this.config = {
            cachingStrategy: 'indexedDB' // Default to DB caching
        };
        this.basePath = '/plugins/t13ne/data/json/';
        this.allCards = null;
        this._initPromise = null;
    }

    async initialize(retries = 3, delay = 1000) {
        if (this.codex) return;
        if (this._initPromise) return this._initPromise;

        // Initialize DB
        await CodexDB.open();

        this._initPromise = (async () => {
            let attempt = 0;
            while (attempt <= retries) {
                try {
                    const response = await fetch(`${this.basePath}library-codex.json`);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    this.codex = await response.json();
                    Logger.message('CodexLibrary: Library codex loaded successfully.');
                    this._buildFileIndex();
                    return;
                } catch (error) {
                    attempt++;
                    if (attempt > retries) {
                        Logger.error(`CodexLibrary: Failed to load library-codex.json after ${attempt} attempts: ${error}`);
                        this.codex = null;
                        throw error;
                    }
                    Logger.warn(`CodexLibrary: Failed to load library-codex.json (Attempt ${attempt}/${retries + 1}). Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        })();

        try {
            await this._initPromise;
        } catch (e) {
            this._initPromise = null;
        }
    }

    _buildFileIndex() {
        this.fileIndex.clear();
        this.lowerCaseIndex.clear();
        const traverse = (obj, currentCategory) => {
            for (const key in obj) {
                if (key === 'files') {
                    for (const fileName in obj.files) {
                        const entry = { category: currentCategory, fileName };
                        this.fileIndex.set(fileName, entry);
                        this.lowerCaseIndex.set(fileName.toLowerCase(), entry);
                        
                        const nameNoExt = fileName.replace(/\.[^/.]+$/, "");
                        if (!this.fileIndex.has(nameNoExt)) {
                            this.fileIndex.set(nameNoExt, entry);
                            this.lowerCaseIndex.set(nameNoExt.toLowerCase(), entry);
                        }
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null && key !== 'description') {
                    const nextCategory = currentCategory ? `${currentCategory}/${key}` : key;
                    traverse(obj[key], nextCategory);
                }
            }
        };
        if (this.codex) traverse(this.codex, '');
    }

    setConfig(config) {
        if (config.cachingStrategy && ['loadAndStore', 'loadAndDestroy'].includes(config.cachingStrategy)) {
            // this.config.cachingStrategy = config.cachingStrategy; // Deprecated config override for now
            if (this.config.cachingStrategy === 'loadAndDestroy') {
                this.clearCache();
            }
        }
    }

    clearCache() {
        this.cache = {};
        Logger.message('CodexLibrary: Cache cleared.');
    }

    getFilePath(category, file) {
        const pathParts = category.split('/');
        let currentLevel = this.codex;

        for (const part of pathParts) {
            if (currentLevel && currentLevel[part]) {
                currentLevel = currentLevel[part];
            } else {
                if (category.startsWith('proficiencies/proficiency-list') || category.startsWith('proficiencies/Profs') || category.startsWith('knots/')) {
                    return `/plugins/t13ne/data/json/${category}/${file}`;
                }
                return null;
            }
        }

        if (currentLevel && currentLevel.files && currentLevel.files[file]) {
            return `${this.basePath}${category}/${file}`;
        }
        return null;
    }

    async getData(categoryOrKey, file) {
        let category = categoryOrKey;
        let fileName = file;

        if (file === undefined) {
            if (categoryOrKey.includes('/')) {
                const lastSlash = categoryOrKey.lastIndexOf('/');
                category = categoryOrKey.substring(0, lastSlash);
                fileName = categoryOrKey.substring(lastSlash + 1);
            }
        }

        if (fileName && !fileName.endsWith('.json') && !fileName.includes('.')) {
            fileName += '.json';
        }

        // Special paths
        if (category.startsWith('proficiencies/proficiency-list') || category.startsWith('proficiencies/Profs') || category.startsWith('knots/')) {
            const fullPath = `/plugins/t13ne/data/json/${category}/${fileName}`;
            return this._fetchFile(fullPath, `${category}/${fileName}`);
        }

        if (category === 'tagging' || category.startsWith('tagging/')) {
            const fullPath = `/plugins/t13ne/data/tagging/${fileName}`;
            return this._fetchFile(fullPath, `tagging/${fileName}`);
        }
        
        if (!this.codex) await this.initialize();
        if (!this.codex) return null;

        if (file === undefined && !category.includes('/')) {
             const entry = this._findBestMatch(category);
             if (entry) {
                 category = entry.category;
                 fileName = entry.fileName;
             }
        }

        const cacheKey = `${category}/${fileName}`;
        const filePath = this.getFilePath(category, fileName);

        if (!filePath) {
            Logger.error(`CodexLibrary: File path not found for category '${category}' and file '${fileName}'.`);
            return null;
        }

        return this._fetchFile(filePath, cacheKey);
    }

    async _fetchFile(filePath, cacheKey) {
        // 1. Check Active Memory Cache
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        // 2. Check IndexedDB
        const dbData = await CodexDB.getFile(filePath);
        if (dbData) {
            this.cache[cacheKey] = dbData;
            return dbData;
        }

        try {
            const response = await fetch(filePath);
            if (!response.ok) return null;
            
            const contentType = response.headers.get("content-type");
            if (contentType && !contentType.includes("application/json")) return null;

            const data = await response.json();
            
            // 3. Store in Memory and DB
            this.cache[cacheKey] = data;
            await CodexDB.saveFile(filePath, data);
            return data;
        } catch (error) {
            Logger.error(`CodexLibrary: Failed to load '${filePath}': ${error}`);
            return null;
        }
    }

    _findBestMatch(key) {
        if (this.fileIndex.has(key)) return this.fileIndex.get(key);
        const lowerKey = key.toLowerCase();
        if (this.lowerCaseIndex.has(lowerKey)) return this.lowerCaseIndex.get(lowerKey);
        return null;
    }

    // --- Specific Data Loaders ---

    async getAllCardData() {
        if (this.allCards) return this.allCards;
        const manifestPath = '/plugins/t13ne/data/cards/cards-manifest.json';
        const individualBasePath = '/plugins/t13ne/data/cards/individual/';

        try {
            const manifestResponse = await fetch(manifestPath);
            if (!manifestResponse.ok) throw new Error(`Failed to load cards manifest`);
            const manifest = await manifestResponse.json();

            const loadPromises = Object.values(manifest).map(async (filename) => {
                try {
                    const res = await fetch(`${individualBasePath}${filename}`);
                    if (!res.ok) return null;
                    return await res.json();
                } catch (err) { return null; }
            });

            const cards = await Promise.all(loadPromises);
            this.allCards = cards.filter(c => c !== null);
            return this.allCards;
        } catch (error) {
            Logger.error(`CodexLibrary: Error loading card data: ${error}`);
            return null;
        }
    }

    async loadSwayTypesData() {
        if (!this.codex) await this.initialize();
        if (!this.codex?.sway?.files) return [];

        const filesToLoad = Object.keys(this.codex.sway.files).filter(f => f.startsWith('sway_'));
        const loadPromises = filesToLoad.map(async (filename) => {
            const data = await this.getData('sway', filename);
            return Array.isArray(data) ? data : (data ? [data] : []);
        });

        const results = await Promise.all(loadPromises);
        const allSwayTypes = [];
        results.forEach(arr => allSwayTypes.push(...arr));
        return allSwayTypes;
    }

    async loadWoundsData() {
        const levels = await this.getData('wounds', 'woundLevels.json') || [];
        const types = await this.getData('wounds', 'woundFreshTypes.json') || [];
        return { levels, types };
    }
}
