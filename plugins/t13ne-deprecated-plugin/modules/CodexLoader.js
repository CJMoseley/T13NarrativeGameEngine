import { CodexLibrary } from './CodexLibrary.js';
import { CodexLibrarian } from './CodexLibrarian.js';
import { CodexScribe } from './CodexScribe.js';

/**
 * CodexLoader is responsible for loading and caching game data from JSON files.
 * It delegates functionality to Library, Librarian, and Scribe components.
 */
class CodexLoader {
    constructor() {
        this.library = new CodexLibrary();
        this.librarian = new CodexLibrarian(this.library);
        this.scribe = new CodexScribe(this.library, this.librarian);
    }

    // --- Proxy Properties ---
    get dirtyFiles() { return this.scribe.dirtyFiles; }
    set dirtyFiles(v) { this.scribe.dirtyFiles = v; }
    
    get cache() { return this.library.cache; }
    get codex() { return this.library.codex; }
    get profManifest() { return this.librarian.profManifest; }
    get knotManifest() { return this.librarian.knotManifest; }
    get codexIsDirty() { return this.scribe.codexIsDirty; }
    set codexIsDirty(v) { this.scribe.codexIsDirty = v; }
    get profManifestIsDirty() { return this.scribe.profManifestIsDirty; }
    set profManifestIsDirty(v) { this.scribe.profManifestIsDirty = v; }
    get knotManifestIsDirty() { return this.scribe.knotManifestIsDirty; }
    set knotManifestIsDirty(v) { this.scribe.knotManifestIsDirty = v; }

    // --- Delegated Methods ---

    initialize(retries, delay) { return this.library.initialize(retries, delay); }
    setConfig(config) { return this.library.setConfig(config); }
    clearCache() { return this.library.clearCache(); }
    getData(category, file) { return this.library.getData(category, file); }
    getAllCardData() { return this.library.getAllCardData(); }
    loadSwayTypesData() { return this.library.loadSwayTypesData(); }
    loadWoundsData() { return this.library.loadWoundsData(); }
    loadActTypesData() { return this.library.loadActTypesData(); }
    loadBeatTypesData() { return this.library.loadBeatTypesData(); }
    loadGeometryData() { return this.library.loadGeometryData(); }
    find(category, file, query) { return this.library.find(category, file, query); }
    findAll(category, file, query) { return this.library.findAll(category, file, query); }

    clearProficiencyManifest() { return this.librarian.clearProficiencyManifest(); }
    clearKnotManifest() { return this.librarian.clearKnotManifest(); }
    _getOrBuildProficiencyManifest() { return this.librarian._getOrBuildProficiencyManifest(); }
    _getOrBuildKnotManifest() { return this.librarian._getOrBuildKnotManifest(); }
    getProficiency(id) { return this.librarian.getProficiency(id); }
    getKnot(id) { return this.librarian.getKnot(id); }
    getProficiencyIndex(name) { return this.librarian.getProficiencyIndex(name); }
    getTags(type) { return this.librarian.getTags(type); }
    matchesFilter(entity, filters) { return this.librarian.matchesFilter(entity, filters); }

    createProficiency(data, id) { return this.scribe.createProficiency(data, id); }
    createKnot(data, id) { return this.scribe.createKnot(data, id); }
    updateProficiency(id, data) { return this.scribe.createProficiency(data, id); } // Alias for create/update
    getUnsavedChanges() { return this.scribe.getUnsavedChanges(); }
    saveNarrativeGlob(game, entities) { return this.scribe.saveNarrativeGlob(game, entities); }
    loadNarrativeGlob(id) { return this.scribe.loadNarrativeGlob(id); }
    saveSuperKnot(obj) { return this.scribe.saveSuperKnot(obj); }
    loadSuperKnot(id) { return this.scribe.loadSuperKnot(id); }
    
    // Legacy internal method exposure if needed
    _buildFileIndex() { return this.library._buildFileIndex(); }
    _buildProficiencyManifest() { return this.librarian._buildProficiencyManifest(); }
    _buildKnotManifest() { return this.librarian._buildKnotManifest(); }
    _updateManifest(id, prof, path) { return this.scribe._updateManifest(id, prof, path); } // Note: Scribe doesn't have this public, but logic is inside createProficiency
}
export default new CodexLoader();
