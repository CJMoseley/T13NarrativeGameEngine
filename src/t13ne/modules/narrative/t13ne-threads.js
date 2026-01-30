/**
 * T13NE Threads System
 * Manages Proficiencies, Annexes, Notes, Diegetic text, and Maps
 * Proficiencies are the smallest unit of knowledge and can be combined into Annexes
 * 2 Proficiencies = Skill, 3+ = Talent/Power/Super-Power
 */

import Logger from "../../core/Logger.js";
import T13Name from "../characters/t13ne-names.js";
import T13NE from '../../T13NE.js';

/**
 * Annex Builder - Combines proficiencies into Annexes
 * This is a simplified builder. The full logic will be in t13ne-knots.js.
 */
class AnnexBuilder {
    constructor(codexLoader, threadsSystem) {
        this.codexLoader = codexLoader;
        this.threadsSystem = threadsSystem;
        this.annexes = new Map(); // id -> annex object
        this.nextId = 0;
    }

    /**
     * Create an annex from proficiencies
     * @param {Object} data - { name, description, proficiencyIds, facets }
     * @returns {Promise<string>} - Annex ID
     */
    async createAnnex(data) {
        const AnnexFactory = T13NE.getModule('AnnexFactory');
        if (!AnnexFactory) {
            throw new Error("AnnexFactory module not loaded.");
        }

        // Prepare data for AnnexFactory
        // AnnexFactory expects 'proficiencies' array with objects or strings
        const factoryData = {
            name: data.name,
            description: data.description,
            tags: { facets: data.facets || [] },
            proficiencies: data.proficiencyIds || [], // Pass IDs directly, Factory resolves them
            annexType: data.annexType || data.type // Pass annexType if available
        };

        const annexObj = await AnnexFactory.create(factoryData);

        // Store in local map for now (legacy support)
        const id = String(this.nextId++);
        const t13n = new T13Name(annexObj.name);

        const annex = {
            id,
            name: t13n.common,
            fullName: t13n.full,
            altName: t13n.aliases,
            t13Name: t13n.asArray,
            description: annexObj.description,
            type: annexObj.annexType,
            proficiencyIds: annexObj.knot.getTiedProficiencies(),
            parentFacets: data.facets || [],
            createdAt: new Date().toISOString(),
            metadata: data.metadata || {},
            proficiencyId: annexObj.proficiencyId
        };

        this.annexes.set(id, annex);

        // If AnnexFactory didn't save as proficiency, we might want to?
        // But AnnexFactory usually handles resolution. 
        // The original code created a proficiency representing the annex.
        if (!annex.proficiencyId) {
            annex.proficiencyId = await annexObj.saveAsProficiency();
        }

        return id;
    }

    /**
     * Create a proficiency representing the new annex.
     * @param {Object} annex
     */
    async createAnnexProficiency(annex) {
        const facetSet = new Set(annex.parentFacets);

        for (const facetId of facetSet) {
            const profId = await this.codexLoader.createProficiency({
                name: `${annex.name} (${annex.type})`,
                description: `${annex.type} combining: ${annex.proficiencyIds.join(', ')}. ${annex.description}`,
                tags: { facets: [facetId] }
            });
            // Link the created proficiency ID back to the annex object
            annex.proficiencyId = profId;
        }
    }

    getAnnex(id) {
        return this.annexes.get(id) || null;
    }

    getAllAnnexes() {
        return Array.from(this.annexes.values());
    }

    async getProficienciesInAnnex(annexId) {
        const annex = this.getAnnex(annexId);
        if (!annex) return [];

        const profPromises = annex.proficiencyIds.map(id => this.codexLoader.getProficiency(id));
        const profs = await Promise.all(profPromises);

        return profs.filter(p => p);
    }
}

/**
 * Threads System - Main management system
 * Coordinates proficiencies, annexes, and related systems by using the CodexLoader.
 */
class ThreadsSystem {
    constructor(codexLoader) {
        if (!codexLoader) {
            throw new Error("ThreadsSystem requires a CodexLoader instance.");
        }
        this.codexLoader = codexLoader;
        this.annexBuilder = new AnnexBuilder(this.codexLoader, this);
        this.isReady = false;
        this.t13ne = null;
    }

    /**
     * Initialize the threads system.
     * @param {object} t13ne - The main T13NE instance.
     * @returns {Promise<boolean>}
     */
    async initialize(t13ne) {
        this.t13ne = t13ne;
        // The main initialization is now handled by CodexLoader.
        // We just ensure it's ready.
        await this.codexLoader.initialize();
        await this.codexLoader._getOrBuildProficiencyManifest();
        this.isReady = true;
        Logger.message('[T13NE Threads] System initialized.');
        return true;
    }

    /**
     * Generates suggested name and description for a thread context using AI services.
     * @param {object} context - Context for generation (type, proficiencies, etc.)
     * @returns {Promise<{name: string, description: string}>}
     */
    async suggestDetails(context) {
        if (!this.t13ne) return { name: context.name, description: context.description };

        const nameGen = this.t13ne.getModule('NameGenerator');
        const descGen = this.t13ne.getModule('DescriptionGenerator');

        let name = context.name;
        if (!name && nameGen) {
            const nameContext = {
                type: context.type || 'Technology',
                ...context
            };
            const seed = context.seed || Math.random();
            const nameResult = await nameGen.generate(nameContext, seed);
            name = nameResult; // Keep the array structure [common, full, aliases]
        }

        let description = context.description;
        if (!description && descGen) {
            const descContext = {
                name: Array.isArray(name) ? name[0] : (name || 'Unnamed'),
                type: context.type || 'Proficiency',
                ...context
            };
            description = await descGen.generate(descContext);
        }

        return { name, description };
    }

    // --- Proficiency Methods (proxied to CodexLoader) ---

    getProficiency(id) {
        return this.codexLoader.getProficiency(id);
    }

    createProficiency(data) {
        return this.codexLoader.createProficiency(data);
    }

    async findProficiencies(query) {
        const manifest = await this.codexLoader._getOrBuildProficiencyManifest();
        let ids = [];

        if (query.name) {
            const nameIndex = manifest.indexes.name;
            ids = nameIndex[query.name.toLowerCase()] || [];
        } else if (query.facet) {
            const facetIndex = manifest.indexes.facet;
            ids = facetIndex[query.facet] || [];
        }
        // Add other index searches here (genre, era, scope)

        const profPromises = ids.map(id => this.getProficiency(id));
        const profs = await Promise.all(profPromises);
        return profs.filter(p => p);
    }

    /**
     * Suggests proficiencies based on context, prioritizing geometry and harmonics.
     * @param {object} context - { character, facet, keywords }
     * @returns {Promise<Array>} Sorted list of proficiency objects.
     */
    async suggestProficiencies(context = {}) {
        const manifest = await this.codexLoader._getOrBuildProficiencyManifest();
        const T13Geometry = this.t13ne.getModule('T13Geometry');

        let candidates = new Set();

        // 1. Filter by Facet if provided
        if (context.facet) {
            const facetIds = manifest.indexes.facet[context.facet] || [];
            facetIds.forEach(id => candidates.add(id));
        }

        // 2. If no facet, or to expand, use Geometry if Character provided
        if (context.character && T13Geometry && candidates.size === 0) {
            const charGeo = context.character.geometry;
            if (charGeo && manifest.indexes.geometry) {
                // Add proficiencies matching the character's geometry number
                const geoIds = manifest.indexes.geometry[charGeo.GeometryNumber] || [];
                geoIds.forEach(id => candidates.add(id));

                // Add proficiencies matching Perfect Harmonic
                if (charGeo.GeoHarmonics?.Perfect) {
                    const perfectIds = manifest.indexes.geometry[charGeo.GeoHarmonics.Perfect] || [];
                    perfectIds.forEach(id => candidates.add(id));
                }
            }
        }

        // Convert to array and score
        let results = [];
        for (const id of candidates) {
            const prof = await this.getProficiency(id);
            if (!prof) continue;

            let score = 0;

            // Scoring logic based on Geometry Harmonics
            if (context.character && T13Geometry) {
                const pName = Array.isArray(prof.Name) ? prof.Name[0] : prof.Name;
                const pGeo = T13Geometry.getGeometryFromString(pName);

                const charGeo = context.character.geometry;
                if (charGeo && charGeo.GeoHarmonics) {
                    if (pGeo === charGeo.GeometryNumber) score += 5; // Self resonance
                    if (charGeo.GeoHarmonics.Harmonic.includes(pGeo)) score += 3;
                    if (pGeo === charGeo.GeoHarmonics.Perfect) score += 5;
                    if (pGeo === charGeo.GeoHarmonics.Wolf) score -= 2;
                    if (charGeo.GeoHarmonics.Dissonant.includes(pGeo)) score -= 3;
                    if (pGeo === charGeo.GeoHarmonics.Nemesis) score -= 5;
                }
            }

            results.push({ prof, score });
        }

        // Sort descending by score
        results.sort((a, b) => b.score - a.score);
        return results.map(r => r.prof);
    }

    // --- Annex Methods ---

    getAnnexes() {
        return this.annexBuilder;
    }

    // --- General Methods ---

    /**
     * Gathers all unsaved changes from the CodexLoader.
     * @returns {object}
     */
    getUnsavedChanges() {
        return this.codexLoader.getUnsavedChanges();
    }

    ready() {
        return this.isReady;
    }
}

// We no longer export ProficiencyCatalogue, as it's been removed.
export { ThreadsSystem, AnnexBuilder };








