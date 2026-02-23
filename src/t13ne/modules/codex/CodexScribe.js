import Logger from '/src/t13ne/core/Logger.js';
import CodexDB from '/src/t13ne/modules/codex/CodexDB.js';

/**
 * CodexScribe
 * Handles writing data, creating new entries, and saving state.
 */
export class CodexScribe {
    constructor(library, librarian) {
        this.library = library;
        this.librarian = librarian;
        this.dirtyFiles = {};
        this.codexIsDirty = false;
        this.profManifestIsDirty = false;
        this.knotManifestIsDirty = false;
    }

    async createProficiency(profData, suggestedId = null) {
        const funcName = 'CodexScribe.createProficiency';
        Logger.start(funcName, { name: profData.name, suggestedId });
        await this.librarian._getOrBuildProficiencyManifest();

        let newId = suggestedId ? String(suggestedId) : String(this.librarian.nextProfId++);

        const bundleIndex = Math.floor((parseInt(newId, 10) - 1) / 50);
        const subdir = Math.floor(bundleIndex / 50);
        const path = `proficiencies/Profs/${subdir}/profs${bundleIndex}.json`;
        const fullPath = `/plugins/t13ne/data/json/${path}`;

        let bundleData = this.dirtyFiles[fullPath] || await this.library.getData(path) || {};

        // Merge if exists to preserve existing fields during updates
        if (bundleData[newId]) {
            bundleData[newId] = { ...bundleData[newId], ...profData, id: newId };
        } else {
            bundleData[newId] = { id: newId, ...profData };
        }

        this.dirtyFiles[fullPath] = bundleData;

        // Update cache in library
        this.library.cache[path] = bundleData;
        this.library.cache[fullPath] = bundleData;

        // Update Manifest
        this.librarian.profManifest.paths[newId] = fullPath;
        this.librarian._indexProficiency(this.librarian.profManifest, newId, bundleData[newId]);
        this.profManifestIsDirty = true;

        // Save to DB as Knot
        const knotRecord = { id: newId, type: 'Proficiency', ...profData };
        await CodexDB.saveKnot(knotRecord);

        Logger.message(`CodexScribe: Created/Updated proficiency ID '${newId}' in '${fullPath}'.`);
        Logger.end(funcName, newId);
        return newId;
    }

    async createKnot(knotData, suggestedId = null) {
        const funcName = 'CodexScribe.createKnot';
        Logger.start(funcName, { name: knotData.name, suggestedId });
        await this.librarian._getOrBuildKnotManifest();

        let newId = suggestedId ? String(suggestedId) : String(this.librarian.nextKnotId++);

        const bundleIndex = Math.floor((parseInt(newId, 10) - 1) / 50);
        const subdir = Math.floor(bundleIndex / 50);
        const path = `knots/Knots/${subdir}/knots${bundleIndex}.json`;
        const fullPath = `/plugins/t13ne/data/json/${path}`;

        let bundleData = this.dirtyFiles[fullPath] || await this.library.getData(path) || {};

        // Merge if exists
        if (bundleData[newId]) {
            bundleData[newId] = { ...bundleData[newId], ...knotData, id: newId };
        } else {
            bundleData[newId] = { id: newId, ...knotData };
        }

        this.dirtyFiles[fullPath] = bundleData;
        this.library.cache[fullPath] = bundleData;

        this.librarian.knotManifest.paths[newId] = fullPath;
        this.librarian._indexKnot(this.librarian.knotManifest, newId, bundleData[newId]);
        this.knotManifestIsDirty = true;

        // Save to DB
        const knotRecord = { id: newId, type: 'Knot', ...knotData };
        await CodexDB.saveKnot(knotRecord);

        Logger.message(`CodexScribe: Created/Updated knot ID '${newId}' in '${fullPath}'.`);
        Logger.end(funcName, newId);
        return newId;
    }

    // Internal helper for legacy support, delegates to createProficiency logic implicitly
    _updateManifest(id, prof, filePath) {
        // This is mostly handled by createProficiency now, but kept for compatibility
        this.librarian.profManifest.paths[id] = filePath;
        this.librarian._indexProficiency(this.librarian.profManifest, id, prof);
        this.profManifestIsDirty = true;
    }

    getUnsavedChanges() {
        const changes = { files_to_save: [] };
        for (const path in this.dirtyFiles) {
            changes.files_to_save.push({
                path: path,
                content: JSON.stringify(this.dirtyFiles[path], null, 2)
            });
        }

        if (this.profManifestIsDirty) {
            this.librarian._cacheManifestToLS('T13NE_PROF_MANIFEST', this.librarian.profManifest, 'T13NE_PROF_MANIFEST_VERSION');
        }
        if (this.knotManifestIsDirty) {
            this.librarian._cacheManifestToLS('T13NE_KNOT_MANIFEST', this.librarian.knotManifest, 'T13NE_KNOT_MANIFEST_VERSION');
        }

        return changes;
    }

    async saveGame(game, entities) {
        // Save the Game itself as a SuperKnot
        await this.saveEntityToStore(game);

        for (const ent of entities) {
            await this.saveEntityToStore(ent);
        }
        return game.id;
    }

    async saveEntityToStore(entity) {
        const type = entity.constructor.name;
        let category = 'Knots'; // Default

        if (type === 'T13Game') category = 'Games';
        else if (type === 'Character') category = 'Characters';
        else if (type === 'T13Plot') category = 'Plots';
        else if (type === 'Annex') category = 'Annexes';
        else if (type === 'Descendant') category = 'Descendants';
        else if (type === 'T13Tapestry') category = 'Tapestries';

        // Path structure: knots/Category/ID.json
        const filePath = `/plugins/t13ne/data/json/knots/${category}/${entity.id}.json`;

        let dataToSave = (typeof entity.serialize === 'function') ? entity.serialize() : JSON.parse(JSON.stringify(entity));
        delete dataToSave.t13ne;
        delete dataToSave.codexLoader;

        // 1. Update Dirty Files (for potential JSON export)
        this.dirtyFiles[filePath] = dataToSave;

        // 2. Update Memory Cache
        this.library.cache[filePath] = dataToSave;

        // 3. Update IndexedDB (The real save)
        await CodexDB.saveFile(filePath, dataToSave);
        await CodexDB.saveKnot({ id: entity.id, type: type, ...dataToSave });

        // 4. Update SuperKnot Catalogue if it's a Plot or other key entity
        if (type === 'T13Plot' || type === 'Character') {
            await this.updateSuperKnotCatalogue(entity.id, type, entity.Name || entity.name);
        }
    }

    async updateSuperKnotCatalogue(id, type, name) {
        const cataloguePath = 'knots/superknots/superknot-catalogue.json';
        const fullPath = `/plugins/t13ne/data/json/${cataloguePath}`;
        
        let catalogue = this.dirtyFiles[fullPath] || await this.library.getData(cataloguePath) || [];
        if (!Array.isArray(catalogue)) catalogue = [];

        const existing = catalogue.find(item => item.id === id);
        if (existing) {
            existing.name = name;
            existing.type = type;
            existing.updatedAt = Date.now();
        } else {
            catalogue.push({ id, type, name, createdAt: Date.now(), updatedAt: Date.now() });
        }

        this.dirtyFiles[fullPath] = catalogue;
        this.library.cache[fullPath] = catalogue;
        
        // Also save to DB
        await CodexDB.saveFile(fullPath, catalogue);
    }

    async loadEntity(entityId, type) {
        // Try DB first via getKnot
        const knot = await CodexDB.getKnot(entityId);
        if (knot) return this._reconstructEntity(knot, type || knot.type);

        // Fallback to file path construction if not in DB index but file exists
        let category = 'Knots';
        if (type === 'Character') category = 'Characters';
        // ... (other mappings)

        const path = `knots/${category}/${entityId}.json`;
        const data = await this.library.getData(path); // This now checks DB files store too
        if (data) return this._reconstructEntity(data, type);
        return null;
    }

    async saveSuperKnot(superKnotObject) {
        await this.librarian._getOrBuildKnotManifest();

        const descendantIds = [];
        if (superKnotObject.descendants) {
            for (const d of superKnotObject.descendants) {
                descendantIds.push(await this.saveSuperKnot(d));
            }
        }

        const dataToSave = {
            ...superKnotObject,
            descendants: descendantIds,
            knot: superKnotObject.knot ? superKnotObject.knot.serialize() : []
        };
        // Clean up circular refs
        delete dataToSave.t13ne;
        delete dataToSave.codexLoader;

        const savedId = await this.createKnot(dataToSave, superKnotObject.proficiencyId);
        superKnotObject.proficiencyId = savedId;

        // Update catalogue
        await this.updateSuperKnotCatalogue(savedId, superKnotObject.constructor.name, superKnotObject.Name || superKnotObject.name);

        return savedId;
    }

    async loadSuperKnot(superKnotId) {
        const data = await this.librarian.getKnot(superKnotId);
        if (!data) return null;
        return this._reconstructEntity(data, data.type);
    }

    async _reconstructEntity(data, type) {
        // Dynamic imports to avoid circular dependencies in Scribe
        if (type === 'Character') {
            const { Character } = await import('/src/t13ne/modules/characters/t13ne-chars.js');
            // We need to pass the CodexLoader facade, not just library/scribe
            // Assuming CodexLoader is available globally or passed down. 
            // Since we are inside CodexLoader composition, we might need a reference to the parent.
            // For now, we assume the caller handles the instance or we pass `this.loader` if we had it.
            // Actually, the classes expect `codexLoader`.
            // We will rely on the fact that `import CodexLoader` gets the singleton instance.
            const CodexLoader = (await import('./CodexLoader.js')).default;
            return new Character(CodexLoader, data);
        } else if (type === 'Descendant') {
            const { Descendant } = await import('../characters/t13ne-descendants.js');
            const CodexLoader = (await import('./CodexLoader.js')).default;
            return new Descendant(CodexLoader, data);
        } else if (type === 'T13Tapestry') {
            const { default: Tapestry } = await import('../world/T13Tapestry.js');
            return new Tapestry(data);
        } else if (type === 'T13Game') {
            // Circular dependency risk if importing T13Game here directly? 
            // Usually GameState handles Game reconstruction.
            return data;
        }
        return data;
    }
}
