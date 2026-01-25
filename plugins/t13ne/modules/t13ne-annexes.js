import T13NE from '../T13NE.js';
import CodexLoader from './CodexLoader.js';
import Logger from '@/js/core/Logger.js';
import { Annex, TIE } from './t13ne-knots.js';
import AIService from './AIService.js';

export class AnnexFactory {
    constructor() {
        this.geometry = null;
        this.extractor = null;
        this.threads = null;
        this.facets = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        this.geometry = T13NE.getModule('T13Geometry');
        this.extractor = T13NE.getModule('T13ProficiencyExtractor');
        this.threads = T13NE.getModule('Threads');
        this.facets = T13NE.getModule('Facets');
        this.initialized = true;
    }

    /**
     * Creates an Annex with intelligent proficiency resolution.
     * @param {object} data - Annex definition { name, description, proficiencies: [], tags: {} }
     * @returns {Promise<Annex>}
     */
    async create(data) {
        await this.initialize();

        const resolvedProficiencies = [];
        const annexName = data.name || 'Unnamed Annex';
        const annexDesc = data.description || '';

        // Ensure proficiencies array exists
        const profsToProcess = data.proficiencies || [];

        for (const item of profsToProcess) {
            let profId = null;
            let roleMask = TIE.ROOT | TIE.THREAD; // Default

            if (typeof item === 'string') {
                // 1. Try ID
                profId = await this._resolveProficiencyId(item);
                // 2. Try Name creation
                if (!profId) {
                    profId = await this._createProficiencyByName(item, data.tags?.facets?.[0]);
                }
            } else if (typeof item === 'object') {
                if (typeof item.knot !== 'undefined') roleMask = item.knot;

                if (item.profId) {
                    profId = await this._resolveProficiencyId(item.profId);
                } else if (item.facet) {
                    // 3. Define by FACET
                    profId = await this._resolveByFacet(item.facet, annexName, annexDesc);
                } else if (item.name) {
                    profId = await this._resolveProficiencyId(item.name);
                    if (!profId) {
                         profId = await this._createProficiencyByName(item.name, item.facet || data.tags?.facets?.[0], item.description);
                    }
                }
            }

            if (profId) {
                resolvedProficiencies.push({ profId, knot: roleMask });
            } else {
                Logger.warn(`AnnexFactory: Could not resolve proficiency for item in ${annexName}:`, item);
            }
        }

        const annexData = {
            ...data,
            proficiencies: resolvedProficiencies
        };

        return new Annex(CodexLoader, annexData);
    }

    async _resolveProficiencyId(idOrName) {
        // Check if it's a valid ID first (simple check: exists in codex)
        const byId = await CodexLoader.getProficiency(idOrName);
        if (byId) return byId.id;

        // Check if it's a name in the index
        const manifest = await CodexLoader._getOrBuildProficiencyManifest();
        const lowerName = idOrName.toLowerCase();
        if (manifest.indexes.name[lowerName]) {
            return manifest.indexes.name[lowerName][0]; // Return first match
        }

        return null;
    }

    async _createProficiencyByName(name, facet, description = '') {
        const profData = {
            name: name,
            description: description || `A proficiency in ${name}.`,
            tags: { facets: facet ? [facet] : [] }
        };

        // Use Extractor to enrich if possible
        if (this.extractor) {
             const facetIndex = facet ? await this._getFacetIndex(facet) : 0;
             const candidate = {
                 name: name,
                 field: 'Manual Creation',
                 context: `Created for Annex`,
                 facetIndex: facetIndex,
                 sourceData: { text: name }
             };
             
             try {
                 const results = await this.extractor.processBatch([candidate]);
                 if (results && results.length > 0 && !results[0].error) {
                     profData.name = results[0].generatedName[0];
                     profData.description = results[0].generatedDescription;
                     profData.tags = results[0].tags;
                 }
             } catch (e) {
                 Logger.warn("AnnexFactory: AI enrichment failed, using basic data.", e);
             }
        }

        return await CodexLoader.createProficiency(profData);
    }

    async _resolveByFacet(facetName, annexName, annexDesc) {
        // 1. Get all proficiencies for this facet
        const profs = await this.threads.findProficiencies({ facet: facetName });
        
        if (!profs || profs.length === 0) {
            // No existing profs, create one
            return await this._createProficiencyByName(`${facetName} Proficiency`, facetName, `A proficiency related to ${facetName} for ${annexName}.`);
        }

        // 2. Geometry matching (Impression Grid)
        let candidates = profs;
        if (this.geometry && annexName) {
            // We want high impression value between Annex Name and Proficiency Name
            // calculateImpressions returns a grid.
            // We'll batch calculate impressions for efficiency if possible, or loop.
            // calculateImpressions takes array of names.
            
            const names = [annexName, ...profs.map(p => p.name)];
            const result = this.geometry.calculateImpressions(names);
            
            // result.grid[0][i] is impression of Annex(0) on Prof(i)
            // We want positive values.
            
            const scored = profs.map((p, index) => {
                // index + 1 because 0 is annexName
                const val = result.grid[0][index + 1]?.Value || 0;
                return { p, val };
            });
            
            // Filter for positive matches or just sort
            scored.sort((a, b) => b.val - a.val);
            
            // Take top 5 candidates
            candidates = scored.slice(0, 5).map(s => s.p);
        }

        // 3. AI Selection (if available and multiple candidates)
        if (candidates.length > 1 && AIService) {
            const prompt = `Select the most logical proficiency for an Annex named "${annexName}" (${annexDesc}).
            Candidates:
            ${candidates.map((c, i) => `${i + 1}. ${c.name}: ${c.description}`).join('\n')}
            
            Return ONLY the number of the best match.`;
            
            try {
                const response = await AIService.generateText(prompt);
                const match = response.match(/\d+/);
                if (match) {
                    const index = parseInt(match[0], 10) - 1;
                    if (candidates[index]) return candidates[index].id;
                }
            } catch (e) {
                Logger.warn("AnnexFactory: AI selection failed.", e);
            }
        }

        // Fallback: Return best geometry match or random
        return candidates[0].id;
    }

    async _getFacetIndex(facetName) {
        if (this.facets) {
            const f = await this.facets.getFacet(facetName);
            return f ? f.FacetIndex : 0;
        }
        return 0;
    }
}

export default new AnnexFactory();
