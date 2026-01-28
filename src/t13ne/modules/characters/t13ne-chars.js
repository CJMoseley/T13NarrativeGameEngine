import { SuperKnot, Annex, Hitch, PersonalityAnnex } from "@/src/t13ne/modules/mechanics/t13ne-knots.js";
import T13NE from '@/src/t13ne/T13NE.js';
import Logger from "@/src/t13ne/core/Logger.js";
import T13SwayAccount from './T13SwayAccount.js';

/**
 * Simple Seeded RNG to ensure deterministic character generation from a seed.
 */
class SeededRNG {
    constructor(seed) {
        // If seed is a string, hash it. If it's a number, use it. If null/undefined, random.
        if (typeof seed === 'string') {
            this.seed = this._hashString(seed);
        } else if (typeof seed === 'number') {
            this.seed = seed;
        } else {
            this.seed = Math.floor(Math.random() * 2147483647);
        }
    }

    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        // Ensure positive result
        if (this.seed < 0) this.seed += 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    // Helper to pick from array
    pick(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(this.next() * array.length)];
    }

    // Helper for range
    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

/**
 * Represents a Character in the T13NE system.
 * Extends SuperKnot to allow for complex knotwork associations (Annexes, Hitches, etc.).
 */
export class Character extends SuperKnot {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = data.charType || 'Extra';
        this.facetweb = data.facetweb || null;
        this.personalityAnnex = data.personalityAnnex || null;
        // Ensure hitches are properly instantiated or assigned
        this.hitches = data.hitches || [];
        this.wounds = data.wounds || []; // Ensure wounds are loaded or initialized
        this.traumas = data.traumas || []; // Ensure traumas are loaded or initialized
        this.arcs = data.arcs || []; // Initialize character arcs
        this.catalysts = data.catalysts || []; // Initialize character catalysts

        // Store Age and Scale data
        this.ageCategory = data.ageCategory || 'Adult';
        this.scaleModifier = data.scaleModifier || 0;
        this.proficiencyDice = data.proficiencyDice || '1d6';

        // Store Characterization Details
        this.geometry = data.geometry || null;
        this.iching = data.iching || null;
        this.personaDetails = data.personaDetails || null;

        // Full Character properties
        this.alternates = data.alternates || []; // For Full characters, a list of character instances
        this.activeAlternateIndex = data.activeAlternateIndex || 0;

        // Archetype properties
        this.archetypeStats = data.archetypeStats || null; // { Physique, Finesse, Mind, Spirit }

        // If we have a statblock (facetweb), we can use it to generate descriptions
        if (data.statblock && !this.facetweb) {
            const Tapestry = T13NE.getModule('Tapestry');
            if (Tapestry) {
                this.facetweb = new Tapestry(data.statblock);
            }
        }

        // Initialize Sway Account
        this.swayAccount = new T13SwayAccount(data.sway || {});

        // Initialize Stress State
        this.stressState = data.stressState || {
            // Map of dieId -> { stress, strains, shocks, maxStress, stressStrainLimit }
            // e.g. "Facet:Awe": { ... }
        };
        this.stressLimits = data.stressLimits || null; // Will hold { totalMaxStress, totalStressStrainLimit, dice }
        if (!this.stressLimits) {
            this.initializeLimits();
        }
        this.psychosocialSpace = data.psychosocialSpace || null;

        // Lite Character Specifics
        if (this.charType.includes('Lite')) {
            this.yinSway = data.yinSway || 0;
            this.yangSway = data.yangSway || 0;
            this.maxYin = data.maxYin || 13;
            this.maxYang = data.maxYang || 13;
        }
        
        this.templates = data.templates || [];
        this.annexSuggestions = data.annexSuggestions || [];
        this.masterAnnexSuggestion = data.masterAnnexSuggestion || null;
    }

    /**
     * Returns a structured behavioral profile for AI agents.
     * @returns {object}
     */
    getBehavioralProfile() {
        const motivations = [];
        const avoids = [];
        const shadows = [];
        const cores = [];
        const edges = [];

        // Primary Personality
        if (this.personaDetails) {
            if (this.personaDetails.Motivation) motivations.push(this.personaDetails.Motivation);
            if (this.personaDetails.Avoid) avoids.push(this.personaDetails.Avoid);
            if (this.personaDetails.Shadow) shadows.push(this.personaDetails.Shadow);
        }

        // Primary Cores from Personality Annex
        if (this.personalityAnnex && this.personalityAnnex.cores) {
            cores.push(...this.personalityAnnex.cores);
        }

        // Resolved Hitches
        if (this.hitches && Array.isArray(this.hitches)) {
            this.hitches.forEach(h => {
                if (h.resolution) {
                    if (h.resolution.type === 'Persona' && h.resolution.details) {
                        if (h.resolution.details.Motivation) motivations.push(`[Resolved ${h.name}] ${h.resolution.details.Motivation}`);
                        if (h.resolution.details.Avoid) avoids.push(`[Resolved ${h.name}] ${h.resolution.details.Avoid}`);
                        if (h.resolution.details.Shadow) shadows.push(`[Resolved ${h.name}] ${h.resolution.details.Shadow}`);
                    } else if (h.resolution.type === 'Core') {
                        cores.push(`${h.resolution.name} (Resolved ${h.name})`);
                    } else if (h.resolution.type === 'Edge') {
                        edges.push(`${h.resolution.name}: ${h.resolution.text}`);
                    }
                }
            });
        }

        return {
            motivation: motivations.join(' | ') || 'Unknown',
            avoid: avoids.join(' | ') || 'Unknown',
            shadow: shadows.join(' | ') || 'Unknown',
            iching: this.iching || [],
            geometry: this.geometry?.GeoHarmonics || {},
            geometryName: this.geometry?.Geo?.Name || 'Unknown',
            cores: cores,
            edges: edges
        };
    }

    addCatalyst(catalyst) {
        this.catalysts.push(catalyst);
    }

    removeCatalyst(id) {
        this.catalysts = this.catalysts.filter(c => c.id !== id);
    }

    /**
     * Calculates and stores the character's stress and strain limits.
     * Should be called after creation or loading.
     */
    async initializeLimits() {
        const Stress = T13NE.getModule('Stress');
        if (Stress) {
            const limits = await Stress.calculateTotalLimits(this);
            this.stressLimits = limits;
            Logger.message(`Character ${this.name}: Stress limits initialized. Max Stress: ${limits.totalMaxStress}, Strain Limit: ${limits.totalStressStrainLimit}`);
        } else {
            Logger.warn(`Character ${this.name}: Could not initialize stress limits, Stress module not available.`);
            this.stressLimits = { totalMaxStress: 0, totalStressStrainLimit: 0, dice: {} };
        }
    }

    /**
     * Moves the character's Inner Self to a new state in their Psychosocial Space.
     * @param {string} targetStateId - The ID of the state to move to.
     * @param {object} [externalForce=null] - The entity forcing the move (optional).
     * @param {string} [method='Persuasion'] - The method used (e.g., 'Persuasion', 'Intimidation').
     * @returns {Promise<boolean>} True if moved, false otherwise.
     */
    async moveInnerSelf(targetStateId, externalForce = null, method = 'Persuasion') {
        if (!this.psychosocialSpace) {
            Logger.warn(`Character ${this.name} has no Psychosocial Space.`);
            return false;
        }

        // If forced, perform a test to resist
        if (externalForce) {
            const Tests = T13NE.getModule('Tests');
            if (Tests) {
                let difficulty = 10; // Default difficulty

                // Calculate difficulty based on external force
                if (typeof externalForce === 'number') {
                    difficulty = externalForce;
                } else if (externalForce.facetweb) {
                    // Determine actor facet based on method
                    let actorFacet = 'Dominion';
                    if (method === 'Persuasion') actorFacet = 'Virtue';
                    else if (method === 'Intimidation') actorFacet = 'Awe';
                    else if (method === 'Deception') actorFacet = 'Heresy';

                    const facetData = await externalForce.facetweb.getFacetBoon(actorFacet);
                    if (facetData) {
                        difficulty = (facetData.Boon || 13) + (externalForce.scaleModifier || 0);
                    }
                }

                // Determine resistance facet
                let resistFacet = 'Rook';
                if (method === 'Persuasion') resistFacet = 'Inertia';
                else if (method === 'Deception') resistFacet = 'Key';
                else if (method === 'Intimidation') resistFacet = 'Rook';

                // Perform resistance test
                const result = await this.performTest('Dice', {
                    facet: resistFacet,
                    difficulty: difficulty
                });

                if (result.success) {
                    Logger.message(`Character ${this.name} resisted movement to ${targetStateId} (Method: ${method}).`);
                    return false;
                }
            }
        }

        // Move
        this.psychosocialSpace.moveToState(this, targetStateId);
        Logger.message(`Character ${this.name} moved Inner Self to ${targetStateId}.`);
        return true;
    }

    /**
     * Performs a test using the T13NE_Tests module.
     * @param {string} type - 'Value', 'Card', or 'Dice'.
     * @param {object} options - Test options.
     * @returns {Promise<object>} Test result.
     */
    async performTest(type, options) {
        const Tests = T13NE.getModule('Tests');
        if (!Tests) return null;
        return await Tests.performTest(type, this, options);
    }

    /**
     * Adds Sway or Chi to the character's account.
     * Checks for Facet Sway overflow and triggers Facet evolution if necessary.
     * @param {string} type - The type of Sway (e.g., 'Chi', 'Sway:Awe').
     * @param {number} amount - Amount to add.
     */
    async gainSway(type, amount) {
        this.swayAccount.add(type, amount);

        // Check for Facet Sway overflow
        if (type.startsWith('Sway:') && this.facetweb) {
            const facetName = type.split(':')[1];
            const Facets = T13NE.getModule('Facets');
            const facetData = await Facets.getFacet(facetName);

            if (facetData) {
                // Find the stat pair containing this facet
                const statPair = this.facetweb.Stats.find(s => s.Facet === facetData.FacetIndex || s.Antifacet === facetData.FacetIndex);

                if (statPair) {
                    const isPrimary = statPair.Facet === facetData.FacetIndex;
                    const currentBoon = isPrimary ? statPair.Facet_Boon : statPair.Antifacet_Boon;
                    const scale = this.scaleModifier || 0;
                    const threshold = currentBoon + scale;

                    const currentSway = this.swayAccount.getBalance(type);

                    if (currentSway >= threshold) {
                        // Force Facet Raise
                        this.evolveFacet(facetData.FacetIndex);
                        // Consume Sway for the level up
                        this.swayAccount.spend(type, threshold);
                        Logger.message(`Character ${this.name}: ${facetName} Facet raised to ${currentBoon + 1} due to Sway accumulation.`);
                    }
                }
            }
        }
    }

    /**
     * Evolves a Facet by increasing its Boon and decreasing the Anti-Facet.
     * @param {number} facetIndex - The index of the facet to raise.
     */
    evolveFacet(facetIndex) {
        if (!this.facetweb || !this.facetweb.Stats) return;

        const statPair = this.facetweb.Stats.find(s => s.Facet === facetIndex || s.Antifacet === facetIndex);

        if (statPair) {
            if (statPair.Facet === facetIndex) {
                statPair.Facet_Boon++;
                statPair.Antifacet_Boon--;
            } else {
                statPair.Antifacet_Boon++;
                statPair.Facet_Boon--;
            }
        }
    }

    /**
     * Purchases a new Proficiency using Chi.
     * @param {object|string} profData - Data for the new proficiency or ID.
     * @param {number} cost - Cost in Chi.
     * @returns {Promise<boolean>} Success.
     */
    async purchaseProficiency(profData, cost) {
        if (this.swayAccount.spend('Chi', cost)) {
            let profId = typeof profData === 'string' ? profData : await this.codexLoader.createProficiency(profData);
            this.knot.assign(profId, 1); // 1 = Thread/Proficiency
            return true;
        }
        return false;
    }

    /**
     * Merges proficiencies into an Annex (new or existing).
     * @param {string[]} profIds - IDs of proficiencies to merge.
     * @param {Annex|string} target - Existing Annex object or name for new Annex.
     * @param {number} cost - Chi cost for the merge operation.
     * @returns {Promise<Annex|null>} The updated or created Annex.
     */
    async mergeProficiencies(profIds, target, cost = 0) {
        if (cost > 0 && !this.swayAccount.spend('Chi', cost)) return null;

        let annex = target instanceof Annex ? target : new Annex(this.codexLoader, {
            name: target,
            description: 'Merged proficiency annex.',
            proficiencies: []
        });

        if (typeof target === 'string') this.subAnnexes.push(annex);
        profIds.forEach(id => { annex.knot.assign(id, 1); this.knot.untie(id, 1); });
        return annex;
    }

    /**
     * Automatically processes any annex suggestions into full Annexes.
     * Uses AnnexFactory to resolve and create them.
     * @returns {Promise<void>}
     */
    async autoAssignAnnexes() {
        const AnnexFactory = T13NE.getModule('AnnexFactory');
        if (!AnnexFactory) {
            Logger.warn("Character: Cannot auto-assign annexes, AnnexFactory not found.");
            return;
        }

        // Process Master Annex Suggestion
        if (this.masterAnnexSuggestion) {
            this.masterAnnex = await AnnexFactory.create(this.masterAnnexSuggestion);
            delete this.masterAnnexSuggestion;
        }

        // Process Sub Annex Suggestions
        if (this.annexSuggestions && this.annexSuggestions.length > 0) {
            if (!this.subAnnexes) this.subAnnexes = [];
            for (const suggestion of this.annexSuggestions) {
                const annex = await AnnexFactory.create(suggestion);
                this.subAnnexes.push(annex);
            }
            this.annexSuggestions = [];
        }
    }

    /**
     * Factory method to generate a new procedural character.
     * Replaces the logic previously found in CharacterGenerator.js.
     * 
     * @param {CodexLoader} codexLoader - The loader instance.
     * @param {object|string} options - Configuration options or model string.
     * @param {string} [options.model='Extra'] - 'Extra', 'Vex', 'Chorus', 'Cast', 'Force-of-Nature', 'Grunt', 'Hero', 'Archetype', etc.
     * @param {string|number} [options.seed] - Seed for deterministic generation.
     * @param {string} [options.age] - Specific age category (e.g., 'Kid', 'Adult').
     * @param {string} [options.genre='T13 Core'] - Genre for proficiency selection.
     * @param {string} [options.era='Timeless'] - Era for proficiency selection.
     * @param {string} [options.experience] - Specific experience tier (e.g., 'Fresh', 'Veteran').
     * @param {object} [options.facets] - Specific facets to use (root, channel, persona, core, etc.).
     * @returns {Promise<Character>}
     */
    static async generate(codexLoader, options = {}) {
        if (typeof options === 'string') {
            options = { model: options };
        }

        const modelInput = options.model || 'Extra';
        const seed = options.seed !== undefined ? options.seed : Date.now();
        const rng = new SeededRNG(seed);
        const genre = options.genre || 'T13 Core';
        const era = options.era || 'Timeless';

        const NameGenerator = T13NE.getModule('NameGenerator');
        const Tapestry = T13NE.getModule('Tapestry');
        const Facets = T13NE.getModule('Facets');
        const T13Geometry = T13NE.getModule('T13Geometry');
        const Threads = T13NE.getModule('Threads');
        const AIService = T13NE.getModule('AIService');

        if (!NameGenerator || !Tapestry || !Facets) {
            Logger.error("T13NE: Modules not loaded for Character generation.");
            return null;
        }

        const facetsArr = await Facets.getFacetsArr();
        const ARCHETYPE_MAPPING = {
            Physique: [0, 5, 23, 18, 12, 13], // Awe, Fury, Zeal, Sin, Miasma, Nature
            Finesse: [2, 7, 9, 11, 10, 4, 6],   // Craft, Heresy, Jeer, Liberty, Key, Enigma, Gossamer
            Mind: [19, 14, 4, 10, 13, 20],     // Trial, Orthodox, Enigma, Key, Nature, Virtue
            Spirit: [15, 16, 22, 21, 6, 20]     // Phoenix, Quiet, Yonder, Wyrd, Gossamer, Virtue
        };

        const resolveFacet = (input) => {
            if (input) {
                if (typeof input === 'string') {
                    const found = facetsArr.find(f => f.FacetName.toLowerCase() === input.toLowerCase());
                    if (found) return found;
                } else if (typeof input === 'object' && input.FacetName) {
                    return input;
                }
            }
            return rng.pick(facetsArr);
        };

        const getProficienciesForFacet = async (facetName, count = 1) => {
            if (!Threads) return [];
            let profs = await Threads.findProficiencies({ facet: facetName, genre, era });
            if (!profs || profs.length === 0) profs = await Threads.findProficiencies({ facet: facetName });

            const selected = [];
            if (profs && profs.length > 0) {
                for (let i = 0; i < count; i++) {
                    const p = rng.pick(profs);
                    if (p) selected.push({ profId: p.id, knot: 1 });
                }
            }
            return selected;
        };

        const [ageData, extraTypesData, pcTypesData, experienceData] = await Promise.all([
            codexLoader.getData('ageCategories'),
            codexLoader.getData('extraTypes'),
            codexLoader.getData('pcType'),
            codexLoader.getData('experienceTiers')
        ]);

        const safeAgeData = (ageData && Array.isArray(ageData)) ? ageData : [{ Type: 'Adult', Scale_Modifier: 0, Proficiency_Dice: '1d6' }];
        let selectedAge = options.age ? safeAgeData.find(a => a.Type.toLowerCase() === options.age.toLowerCase()) : null;
        if (!selectedAge) selectedAge = rng.pick(safeAgeData);

        const safeExpData = (experienceData && Array.isArray(experienceData)) ? experienceData : [];
        let selectedTier = options.experience ? safeExpData.find(t => t.Type.toLowerCase() === options.experience.toLowerCase()) : null;
        if (!selectedTier && safeExpData.length > 0) selectedTier = rng.pick(safeExpData);

        let structure = 'Extra';
        let typeData = null;
        let targetModel = modelInput.toLowerCase();

        // Extra Tiers: Vex < Chorus < Cast < Force-of-Nature
        let extraMatch = extraTypesData?.find(e => e.Type.toLowerCase() === targetModel);
        if (extraMatch) {
            structure = 'Extra';
            typeData = extraMatch;
        } else if (targetModel === 'extra') {
            structure = 'Extra';
            typeData = rng.pick(extraTypesData || []) || { Type: 'Chorus', Master_Annex: 'Talent' };
        } else if (targetModel === 'archetype') {
            structure = 'Archetype';
            typeData = pcTypesData?.find(e => e.Type === 'Archetype Character') || { Type: 'Archetype', Min_Hitches: 0, Max_Hitches: 24 };
        } else if (targetModel === 'lite') {
            structure = 'Lite';
            typeData = pcTypesData?.find(e => e.Type === 'Lite Character') || { Type: 'Lite', Min_Hitches: 1, Max_Hitches: 13 };
        } else if (targetModel === 'full') {
            structure = 'Full';
            typeData = { Type: 'Full', Alternates: 2 };
        } else {
            let pcMatch = pcTypesData?.find(e => e.Type.toLowerCase().includes(targetModel));
            if (pcMatch) {
                structure = 'Detailed';
                typeData = pcMatch;
            } else {
                structure = 'Detailed';
                typeData = pcTypesData?.find(e => e.Type === 'Grunt') || { Type: 'Grunt', Min_Hitches: 1, Max_Hitches: 4 };
            }
        }

        let charData = {
            name: ['Unnamed', 'Unnamed Individual', ''],
            description: '',
            charType: typeData.Type || structure,
            tags: { genres: [genre], eras: [era], facets: [] },
            knotData: [],
            ageCategory: selectedAge.Type,
            experienceTier: selectedTier ? selectedTier.Type : 'Unknown',
            scaleModifier: parseInt(selectedAge.Scale_Modifier, 10) || 0,
            proficiencyDice: selectedAge.Proficiency_Dice
        };

        if (selectedTier) {
            if (selectedTier.Type === 'Fresh') charData.scaleModifier -= 1;
            else if (selectedTier.Type === 'Veteran') charData.scaleModifier += 1;
            else if (selectedTier.Type === 'Maxed') charData.scaleModifier += 2;
        }

        // 1. Generate Name (T13 Standard Array)
        const nameResult = await NameGenerator.generate({ type: 'Character', model: charData.charType }, rng.next());
        charData.name = nameResult;

        // Geometry & I-Ching
        if (T13Geometry && charData.name) {
            charData.geometry = T13Geometry.calculateFullGeo(charData.name[0]);
        }

        if (structure === 'Extra') {
            // Master Annex
            const root = resolveFacet(options.facets?.root);
            const channel = resolveFacet(options.facets?.channel);
            const tangle = resolveFacet(options.facets?.tangle);

            // Determine Type from typeData if available, or default
            let annexType = 'Skill';
            const masterAnnexDesc = typeData.Master_Annex || '';
            if (masterAnnexDesc.includes('Super-Annex')) annexType = 'Super-Annex';
            else if (masterAnnexDesc.includes('Power')) annexType = 'Power';
            else if (masterAnnexDesc.includes('Talent')) annexType = 'Talent';

            // Determine proficiency count
            let masterProfCount = 2;
            if (annexType === 'Talent') masterProfCount = rng.range(3, 5);
            else if (annexType === 'Power') masterProfCount = rng.range(6, 10);
            else if (annexType === 'Super-Annex') masterProfCount = rng.range(11, 15);

            const rootProfs = await getProficienciesForFacet(root.FacetName, 1);
            const channelProfs = await getProficienciesForFacet(channel.FacetName, 1);
            const tangleProfs = await getProficienciesForFacet(tangle.FacetName, masterProfCount - 2);

            const knotData = [];
            if (rootProfs[0]) knotData.push({ ...rootProfs[0], knot: 16 });
            if (channelProfs[0]) knotData.push({ ...channelProfs[0], knot: 32 });
            tangleProfs.forEach(p => knotData.push({ ...p, knot: 1 }));
            
            // Fill with placeholders if needed
            while(knotData.length < masterProfCount) {
                 knotData.push({ facet: tangle.FacetName, knot: 1 });
            }

            charData.masterAnnex = new Annex(codexLoader, {
                name: `${root.FacetName}-${channel.FacetName} Pattern`,
                annexType: annexType,
                description: `A pattern rooted in ${root.FacetName}, channelling ${channel.FacetName}.`,
                tags: { facets: [root.FacetName, channel.FacetName, tangle.FacetName] },
                proficiencies: knotData
            });

            // Extras (Cast/FON) have Personality
            if (charData.charType.includes('Cast') || charData.charType.includes('Force-of-Nature')) {
                const personaFacet = resolveFacet(options.facets?.persona);
                const coreFacet = resolveFacet(options.facets?.core);
                charData.personalityAnnex = new PersonalityAnnex(codexLoader, {
                    name: `${charData.name[0]}'s Identity`,
                    personas: [personaFacet.Persona?.Name || personaFacet.FacetName],
                    cores: [coreFacet.Core || coreFacet.FacetName],
                    tags: { facets: [personaFacet.FacetName, coreFacet.FacetName] }
                });
            }

            // Sub-Annexes by Tier
            let subAnnexCount = 0;
            let subAnnexType = 'Skill';
            if (annexType === 'Talent') { subAnnexCount = rng.range(1, 2); subAnnexType = 'Skill'; }
            else if (annexType === 'Power') { subAnnexCount = rng.range(3, 5); subAnnexType = 'Talent'; }
            else if (annexType === 'Super-Annex') { subAnnexCount = rng.range(6, 10); subAnnexType = 'Power'; }
            // Fallback based on charType if annexType was default
            else if (charData.charType.includes('Chorus')) { subAnnexCount = rng.range(1, 2); subAnnexType = 'Skill'; }
            else if (charData.charType.includes('Cast')) { subAnnexCount = rng.range(3, 5); subAnnexType = 'Talent'; }
            else if (charData.charType.includes('Force-of-Nature')) { subAnnexCount = rng.range(6, 10); subAnnexType = 'Power'; }

            charData.subAnnexes = [];
            for (let i = 0; i < subAnnexCount; i++) {
                const subFacet = resolveFacet(null);
                const subProfs = await getProficienciesForFacet(subFacet.FacetName, 2);
                if (subProfs.length > 0) {
                    charData.subAnnexes.push(new Annex(codexLoader, {
                        name: `${subFacet.FacetName} ${subAnnexType}`,
                        annexType: subAnnexType,
                        proficiencies: subProfs,
                        tags: { facets: [subFacet.FacetName] }
                    }));
                }
            }
        }
        else if (structure === 'Lite') {
            const numHitches = rng.range(1, 13);
            charData.hitches = [];
            for (let i = 0; i < numHitches; i++) {
                const f = resolveFacet(null);
                charData.hitches.push(new Hitch(codexLoader, {
                    name: `${f.FacetName} Complication`,
                    bane: rng.range(1, 30),
                    tags: { facets: [f.FacetName] }
                }));
            }
            // Max Yin/Yang defined by Hitch Boons
            charData.maxYin = charData.hitches.reduce((sum, h) => sum + h.bane, 0);
            charData.maxYang = rng.range(13, 26);
            charData.description = `A Lite Character with ${numHitches} Hitches. Stores Yin on Hitches and Yang on Proficiencies.`;
        }
        else if (structure === 'Archetype') {
            const allFaceBoon = rng.range(8, 18) + charData.scaleModifier;
            charData.statblock = Tapestry.setStats(0, Array(12).fill(allFaceBoon), [0], charData.scaleModifier, ['%', '%'], charData.name[0]);
            charData.facetweb = new Tapestry(charData.statblock);

            // Calculate grouped stats
            charData.archetypeStats = {};
            for (const [statName, facetIndices] of Object.entries(ARCHETYPE_MAPPING)) {
                let sum = 0;
                facetIndices.forEach(idx => {
                    const b = charData.facetweb.getFacetBoon(idx);
                    sum += b.Boon;
                });
                charData.archetypeStats[statName] = Math.round(sum / facetIndices.length);
            }

            charData.description = `An Archetype Character. Stats: ${Object.entries(charData.archetypeStats).map(([k, v]) => `${k}:${v}`).join(', ')}.`;
        }
        else {
            // Detailed / Full
            charData.statblock = Tapestry.randomiseStats(0, 0, charData.scaleModifier);
            charData.facetweb = new Tapestry(charData.statblock);
            charData.iching = charData.statblock.Hex;

            const personaFacet = resolveFacet(options.facets?.persona);
            const coreFacet = resolveFacet(options.facets?.core);
            charData.personalityAnnex = new PersonalityAnnex(codexLoader, {
                name: `${charData.name[0]}'s Personality`,
                personas: [personaFacet.Persona?.Name || personaFacet.FacetName],
                cores: [coreFacet.Core || coreFacet.FacetName],
                tags: { facets: [personaFacet.FacetName, coreFacet.FacetName] }
            });

            const numHitches = rng.range(parseInt(typeData.Min_Hitches) || 1, parseInt(typeData.Max_Hitches) || 4);
            charData.hitches = [];
            for (let i = 0; i < numHitches; i++) {
                const hf = resolveFacet(null);
                charData.hitches.push(new Hitch(codexLoader, {
                    name: `${hf.FacetName} Conflict`,
                    bane: rng.range(1, 25),
                    tags: { facets: [hf.FacetName] }
                }));
            }

            if (structure === 'Full') {
                charData.description = "A Full Character - a pool of multiple Alternates linked across dimensions.";

                // Generate Alternates (Detailed Characters)
                const numAlts = typeData.Alternates || 2;
                charData.alternates = [];
                for (let i = 0; i < numAlts; i++) {
                    const altChar = await Character.generate(codexLoader, {
                        ...options,
                        model: 'Grunt', // Alternates usually start as detailed grunts/heroes
                        name: [`${charData.name[0]} (Alt ${i + 1})`, `${charData.name[1]} (Alternate ${i + 1})`, '']
                    });
                    charData.alternates.push(altChar);
                }
            } else {
                charData.description = `A Detailed ${charData.charType}. Standard T13 high-fidelity model.`;
            }
        }

        const character = new Character(codexLoader, charData);
        await character.initializeLimits();
        return character;
    }
}








