import Logger from "/src/t13ne/core/Logger.js";

const PROF_MANIFEST_KEY = 'T13NE_PROF_MANIFEST';
const PROF_MANIFEST_VERSION_KEY = 'T13NE_PROF_MANIFEST_VERSION';
const CURRENT_MANIFEST_VERSION = '3.0.0';
const KNOT_MANIFEST_VERSION = '1.0.0';
const KNOT_MANIFEST_KEY = 'T13NE_KNOT_MANIFEST';
const KNOT_MANIFEST_VERSION_KEY = 'T13NE_KNOT_MANIFEST_VERSION';

/**
 * CodexLibrarian
 * Manages manifests, indexes, and finding items by ID.
 */
export class CodexLibrarian {
    constructor(library) {
        this.library = library;
        this.profManifest = null;
        this.knotManifest = null;
        this.nextProfId = 0;
        this.nextKnotId = 0;
        this.numerology = null;
        this._profManifestPromise = null;
    }

    clearProficiencyManifest() {
        localStorage.removeItem(PROF_MANIFEST_KEY);
        localStorage.removeItem(PROF_MANIFEST_VERSION_KEY);
        this.profManifest = null;
        Logger.message('CodexLibrarian: Proficiency manifest cleared.');
    }

    clearKnotManifest() {
        localStorage.removeItem(KNOT_MANIFEST_KEY);
        localStorage.removeItem(KNOT_MANIFEST_VERSION_KEY);
        this.knotManifest = null;
        Logger.message('CodexLibrarian: Knot manifest cleared.');
    }

    async _getOrBuildProficiencyManifest() {
        if (this.profManifest) return this.profManifest;
        if (this._profManifestPromise) return this._profManifestPromise;

        this._profManifestPromise = this._loadProficiencyManifest();
        try {
            return await this._profManifestPromise;
        } finally {
            this._profManifestPromise = null;
        }
    }

    async _loadProficiencyManifest() {
        if (this.profManifest) return this.profManifest;

        try {
            const storedVersion = localStorage.getItem(PROF_MANIFEST_VERSION_KEY);
            if (storedVersion === CURRENT_MANIFEST_VERSION) {
                const storedManifest = localStorage.getItem(PROF_MANIFEST_KEY);
                if (storedManifest) {
                    this.profManifest = JSON.parse(storedManifest);
                    this._calcNextProfId();
                    return this.profManifest;
                }
            }
        } catch (e) { }

        await this._loadNumerology();
        await this._buildProficiencyManifest();
        this._calcNextProfId();
        return this.profManifest;
    }

    async _loadNumerology() {
        if (this.numerology) return;
        const data = await this.library.getData('geometry', 'numerology.json');
        if (data) {
            // Handle wrapped data structure if present
            this.numerology = Array.isArray(data) ? data.map(item => item.data || item) : [];
        }
    }

    _calculateGeometry(name) {
        if (!name || !this.numerology) return 0;
        
        let str = String(name).toLowerCase().trim();
        // Basic normalization
        str = str.replace(/[Ã¡Ã¢Ã Ã¥Ã¤]/g, 'a').replace(/[Ã°Ã©ÃªÃ¨Ã«]/g, 'e').replace(/[Ã­Ã®Ã¬Ã¯]/g, 'i').replace(/[Ã³Ã´Ã²Ã¸ÃµÃ¶]/g, 'o').replace(/[ÃºÃ»Ã¹Ã¼]/g, 'u').replace(/Ã¦/g, 'ae').replace(/Ã§/g, 'c').replace(/ÃŸ/g, 'ss');
        str = str.replace(/[^a-z]/g, '');

        let geo = 0;
        for (const num of this.numerology) {
            if (str.includes(num.Letter)) {
                let count = 0;
                let pos = str.indexOf(num.Letter);
                while (pos !== -1) {
                    count++;
                    pos = str.indexOf(num.Letter, pos + 1);
                }
                geo += count * num.Number;
            }
        }

        while (geo > 13) {
            geo = String(geo).split('').reduce((a, b) => a + Number(b), 0);
        }
        return geo;
    }

    async _buildProficiencyManifest() {
        Logger.warn('CodexLibrarian: Building proficiency manifest...');
        const manifest = { paths: {}, indexes: { name: {}, facet: {}, geometry: {} } };
        const inventory = await this.library.getData('proficiencies/Profs/bundles.json');
        if (inventory?.version !== 1 || !Array.isArray(inventory.bundles) || !inventory.bundles.length) {
            throw new Error('Invalid or missing proficiency bundle inventory.');
        }
        const seenPaths = new Set();
        for (const bundle of inventory.bundles) {
            const { path, count } = bundle;
            if (typeof path !== 'string' || !/^proficiencies\/Profs\/\d+\/profs\d+\.json$/.test(path) ||
                !Number.isSafeInteger(count) || count < 1 || seenPaths.has(path)) {
                throw new Error('Invalid proficiency bundle inventory entry.');
            }
            seenPaths.add(path);
            const data = await this.library.getData(path);
            if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length !== count) {
                throw new Error(`Missing or incomplete proficiency bundle: ${path}.`);
            }
            for (const id of Object.keys(data)) {
                if (manifest.paths[id]) {
                    throw new Error(`Duplicate proficiency ID ${id} in ${path}.`);
                }
                manifest.paths[id] = `/plugins/t13ne/data/json/${path}`;
                this._indexProficiency(manifest, id, data[id]);
            }
        }
        
        this.profManifest = manifest;
        this._cacheManifestToLS(PROF_MANIFEST_KEY, manifest, PROF_MANIFEST_VERSION_KEY);
        return manifest;
    }

    async _getOrBuildKnotManifest() {
        if (this.knotManifest) return this.knotManifest;
        
        try {
            const stored = localStorage.getItem(KNOT_MANIFEST_KEY);
            if (stored && localStorage.getItem(KNOT_MANIFEST_VERSION_KEY) === KNOT_MANIFEST_VERSION) {
                this.knotManifest = JSON.parse(stored);
                this._calcNextKnotId();
                return this.knotManifest;
            }
        } catch (e) {}

        await this._buildKnotManifest();
        this._calcNextKnotId();
        return this.knotManifest;
    }

    async _buildKnotManifest() {
        Logger.warn('CodexLibrarian: Building knot manifest...');
        const manifest = { paths: {}, indexes: { name: {}, type: {} } };
        let fileIndex = 0;
        let misses = 0;

        while (fileIndex < 1000) {
            const subdir = Math.floor(fileIndex / 50);
            const path = `knots/Knots/${subdir}/knots${fileIndex}.json`;
            const data = await this.library.getData(path);

            if (data) {
                for (const id in data) {
                    manifest.paths[id] = `/plugins/t13ne/data/json/${path}`;
                    this._indexKnot(manifest, id, data[id]);
                }
                misses = 0;
            } else {
                misses++;
                if (misses >= 5) break;
            }
            fileIndex++;
        }

        this.knotManifest = manifest;
        this._cacheManifestToLS(KNOT_MANIFEST_KEY, manifest, KNOT_MANIFEST_VERSION_KEY);
        return manifest;
    }

    async getProficiency(profId) {
        const manifest = await this._getOrBuildProficiencyManifest();
        const path = manifest.paths[profId];
        if (!path) {
            const knot = await this.getKnot(profId);
            if (knot) return knot;
            return null;
        }

        // Extract category/file from full path
        // Path: /plugins/t13ne/data/json/proficiencies/Profs/0/profs0.json
        const relPath = path.includes('/data/json/') ? path.split('/data/json/')[1] : path;
        const data = await this.library.getData(relPath);
        return data ? data[profId] : null;
    }

    async getKnot(knotId) {
        const manifest = await this._getOrBuildKnotManifest();
        const path = manifest.paths[knotId];
        if (!path) return null;

        const relPath = path.split('/data/json/')[1];
        const data = await this.library.getData(relPath);
        return data ? data[knotId] : null;
    }

    async getTags(type) {
        const data = await this.library.getData('tagging', `${type}.json`);
        if (!data) return ['All'];
        return ['All', ...Object.values(data).map(i => i.Name).sort()];
    }

    /**
     * Retrieves a specific index from the proficiency manifest.
     * @param {string} indexName - The name of the index to retrieve (e.g., 'name', 'facet').
     * @returns {Promise<object|null>} The index object or null.
     */
    async getProficiencyIndex(indexName) {
        const manifest = await this._getOrBuildProficiencyManifest();
        if (manifest && manifest.indexes && manifest.indexes[indexName]) {
            return manifest.indexes[indexName];
        }
        Logger.warn(`CodexLibrarian: Proficiency index '${indexName}' not found in manifest.`);
        return null;
    }

    /**
     * Checks if an entity matches the provided filters.
     * @param {object} entity 
     * @param {object} filters - { genre: [], era: [], scope: [] }
     * @returns {boolean}
     */
    matchesFilter(entity, filters) {
        const record = entity.prof || entity;
        const tags = record.tags || record.Tags || {};
        
        const check = (selectedFilters, itemTags, universalTags) => {
            if (!selectedFilters || selectedFilters.includes('All')) return true;
            const t = itemTags || [];
            // Ensure loose comparison for IDs (string vs number)
            if (selectedFilters.some(f => t.some(it => String(it) === String(f)))) return true;
            if (t.some(tag => universalTags.includes(String(tag)))) return true;
            return false;
        };

        const genreMatch = check(filters.genre, tags.genres || tags.Genres, ['1', 'T13 Core', 'Omniversal']);
        const eraMatch = check(filters.era, tags.eras || tags.Eras, ['1', 'Timeless', 'Omniversal']);
        const scopeMatch = check(filters.scope, tags.scopes || tags.Scopes, ['1', 'Omniversal']);
        const facetMatch = check(filters.facet, tags.facets || tags.Facets, []);

        return genreMatch && eraMatch && scopeMatch && facetMatch;
    }

    _indexProficiency(manifest, id, prof) {
        prof = prof.prof || prof;
        const addName = (n) => {
            if (!n) return;
            const k = String(n).trim().toLowerCase();
            if (!manifest.indexes.name[k]) manifest.indexes.name[k] = [];
            if (!manifest.indexes.name[k].includes(id)) manifest.indexes.name[k].push(id);
        };
        const pName = prof.name || prof.Name;
        if (Array.isArray(pName)) pName.forEach(addName); else addName(pName);
        
        const tags = prof.tags || prof.Tags || {};
        (tags.Facets || tags.facets || []).forEach(f => {
            if (!manifest.indexes.facet[f]) manifest.indexes.facet[f] = [];
            manifest.indexes.facet[f].push(id);
        });

        // Geometry Indexing
        if (!manifest.indexes.geometry) manifest.indexes.geometry = {};
        const primaryName = Array.isArray(pName) ? pName[0] : pName;
        const geo = this._calculateGeometry(primaryName);
        if (geo > 0) {
            if (!manifest.indexes.geometry[geo]) manifest.indexes.geometry[geo] = [];
            manifest.indexes.geometry[geo].push(id);
        }
    }

    _indexKnot(manifest, id, knot) {
        const name = String(knot.name || knot.Name).trim().toLowerCase();
        if (!manifest.indexes.name[name]) manifest.indexes.name[name] = [];
        manifest.indexes.name[name].push(id);
    }

    _calcNextProfId() {
        if (!this.profManifest) return;
        const ids = Object.keys(this.profManifest.paths);
        this.nextProfId = ids.reduce((max, id) => Math.max(max, parseInt(id, 10) || 0), 0) + 1;
    }

    _calcNextKnotId() {
        if (!this.knotManifest) return;
        const ids = Object.keys(this.knotManifest.paths);
        this.nextKnotId = ids.reduce((max, id) => Math.max(max, parseInt(id, 10) || 0), 0) + 1;
    }

    _cacheManifestToLS(key, data, verKey) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(verKey, verKey === KNOT_MANIFEST_VERSION_KEY ? KNOT_MANIFEST_VERSION : CURRENT_MANIFEST_VERSION);
        } catch (e) {}
    }

    async _loadIndexFile(indexName, fileName) {
        const data = await this.library.getData(`proficiencies/${fileName}`);
        if (data) this.profManifest.indexes[indexName] = data;
    }
}


