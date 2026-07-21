﻿import { Character, SeededRNG } from "/src/t13ne/modules/characters/t13ne-chars.js";
import { PersonalityAnnex, Hitch, Annex } from "/src/t13ne/modules/mechanics/t13ne-knots.js";
import T13NE from '/src/t13ne/T13NE.js';
import Logger from "/src/t13ne/core/Logger.js";

export class Detailed extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
    }

    static async generate(codexLoader, options = {}) {
        const funcName = 'Detailed.generate';
        Logger.start(funcName, options);
        const seed = options.seed !== undefined ? options.seed : Date.now();
        const rng = new SeededRNG(seed);
        const genre = options.genre || 'T13 Core';
        const era = options.era || 'Timeless';

        const NameGenerator = T13NE.getModule('NameGenerator');
        const Tapestry = T13NE.getModule('Tapestry');
        const Facets = T13NE.getModule('Facets');
        const Threads = T13NE.getModule('Threads');
        const T13Geometry = T13NE.getModule('T13Geometry');
        const PsychosocialSpaces = T13NE.getModule('PsychosocialSpaces');
        const AIService = T13NE.getModule('AIService');
        const AnnexFactory = T13NE.getModule('AnnexFactory');

        if (!NameGenerator || !Tapestry || !Facets) {
            Logger.error("T13NE: Modules not loaded for Detailed generation.");
            return null;
        }

        const facetsArr = await Facets.getFacetsArr();
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
            if (!profs || profs.length === 0) {
                 profs = await Threads.findProficiencies({ facet: facetName });
            }
            const selected = [];
            if (profs && profs.length > 0) {
                for (let i = 0; i < count; i++) {
                    const p = rng.pick(profs);
                    if (p) selected.push({ profId: p.id, knot: 1 });
                }
            }
            return selected;
        };

        // Load Data
        const [ageData, pcTypesData, experienceData] = await Promise.all([
            codexLoader.getData('characters', 'ageCategories.json'),
            codexLoader.getData('characters', 'pcType.json'),
            codexLoader.getData('characters', 'experienceTiers.json')
        ]);

        let selectedAge = (ageData && options.age) ? ageData.find(a => a.Type.toLowerCase() === options.age.toLowerCase()) : null;
        if (!selectedAge && ageData) selectedAge = rng.pick(ageData);
        if (!selectedAge) selectedAge = { Type: 'Adult', Scale_Modifier: 0, Proficiency_Dice: '1d6' };

        let selectedTier = (experienceData && options.experience) ? experienceData.find(t => t.Type.toLowerCase() === options.experience.toLowerCase()) : null;
        if (!selectedTier && experienceData) selectedTier = rng.pick(experienceData);

        let typeData = pcTypesData?.find(e => e.Type.toLowerCase() === (options.model || 'Grunt').toLowerCase()) || { Min_Hitches: 1, Max_Hitches: 4 };

        let charData = {
            name: 'Unnamed',
            description: '',
            charType: typeData.Type || 'Detailed',
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

        // Name
        const nameResult = await NameGenerator.generate({ type: 'Alien' }, rng.next()); 
        charData.name = nameResult[0];
        charData.fullName = nameResult[1];
        charData.altName = nameResult[2];
        Logger.message(`${funcName}: Generated Name: ${charData.name}`);

        if (T13Geometry) {
            charData.geometry = T13Geometry.calculateFullGeo(charData.name);
        }

        // Statblock
        const baseScale = -1;
        const finalScale = baseScale + charData.scaleModifier;
        let statblock;
        const standardSpecies = ['Humans', 'Drones', 'Therios', 'Human', 'Drone', 'Therio'];
        if (options.species && !standardSpecies.includes(options.species)) {
            statblock = Tapestry.createSpeciesStatblock(options.species, finalScale);
        } else {
            statblock = Tapestry.randomiseStats(0, 0, finalScale);
        }
        
        charData.statblock = statblock;
        charData.facetweb = new Tapestry(statblock);
        charData.iching = statblock.Hex;

        // Personality
        Logger.message(`${funcName}: Generating Personality...`);
        const personaFacet = resolveFacet(options.facets?.persona);
        const coreFacet = resolveFacet(options.facets?.core);
        const personaName = (personaFacet.Persona && personaFacet.Persona.Name) ? personaFacet.Persona.Name : personaFacet.FacetName;
        const coreName = (coreFacet.Core) ? coreFacet.Core : coreFacet.FacetName;
        charData.personaDetails = personaFacet.Persona || {};
        
        charData.personalityAnnex = new PersonalityAnnex(codexLoader, {
            name: `${charData.name}'s Personality`,
            description: `Persona: ${personaName}, Core: ${coreName}`,
            tags: { facets: [personaFacet.FacetName, coreFacet.FacetName] },
            personas: [personaName],
            cores: [coreName]
        });

        // Hitches
        Logger.message(`${funcName}: Generating Hitches...`);
        const typeMin = parseInt(typeData['Min-Hitches']) || 1;
        const typeMax = parseInt(typeData['Max-Hitches']) || 4;
        let minHitches = typeMin;
        let maxHitches = typeMax;
        let numResolved = 0;

        if (selectedTier) {
            switch (selectedTier.Type) {
                case 'Fresh': maxHitches = Math.min(typeMax, typeMin + 2); break;
                case 'Experienced': minHitches = Math.min(typeMax, typeMin + 1); maxHitches = Math.max(minHitches, Math.floor(typeMax / 2)); if (rng.next() > 0.5) numResolved = 1; break;
                case 'Veteran': minHitches = Math.floor(typeMax / 2); maxHitches = Math.max(minHitches, typeMax - 1); numResolved = 2; break;
                case 'Maxed': minHitches = typeMax; numResolved = Math.floor(minHitches / 2); break;
            }
        }
        if (minHitches > maxHitches) minHitches = maxHitches;
        if (minHitches < 0) minHitches = 0;
        
        const numHitches = rng.range(minHitches, maxHitches);
        if (numResolved > numHitches) numResolved = numHitches;

        charData.hitches = [];
        for (let i = 0; i < numHitches; i++) {
            const hitchFacet = resolveFacet(options.facets?.hitches?.[i]);
            let resolution = null;
            if (i < numResolved) {
                 const resTypes = ['Persona', 'Core', 'Edge'];
                 const resType = rng.pick(resTypes);
                 if (resType === 'Persona' && hitchFacet.Persona) resolution = { type: 'Persona', details: hitchFacet.Persona };
                 else if (resType === 'Core' && hitchFacet.Core) resolution = { type: 'Core', name: hitchFacet.Core, text: hitchFacet.Core_Text };
                 else resolution = { type: 'Edge', name: hitchFacet.Resolved_Hitch || 'Resolved Edge', text: hitchFacet.Resolved_Text || 'No description.' };
            }

            const hitch = new Hitch(codexLoader, {
                name: `${hitchFacet.FacetName} Hitch`,
                description: `A hitch related to ${hitchFacet.FacetName}`,
                bane: Math.floor(rng.next() * 26),
                tags: { facets: [hitchFacet.FacetName] },
                resolution: resolution
            });
            hitch.resolution = resolution;
            if (AIService && Facets) await hitch.generateNarrative(AIService, Facets);
            charData.hitches.push(hitch);
            Logger.message(`${funcName}: Added Hitch: ${hitch.name}`);
        }

        // Annexes
        Logger.message(`${funcName}: Generating Annex Suggestions...`);
        const annexSlots = 3 + numHitches;
        charData.subAnnexes = []; // Ensure it's empty for new characters
        charData.annexSuggestions = []; // Add a place for suggestions
        const getWeightedFacet = () => {
            if (charData.facetweb && charData.facetweb.Stats) {
                const totalBoon = charData.facetweb.Stats.reduce((sum, s) => sum + s.Facet_Boon, 0);
                let r = rng.next() * totalBoon;
                for (const stat of charData.facetweb.Stats) {
                    r -= stat.Facet_Boon;
                    if (r <= 0) return facetsArr.find(f => f.FacetIndex === stat.Facet);
                }
            }
            return resolveFacet(null);
        };

        for (let i = 0; i < annexSlots; i++) {
            const targetFacet = getWeightedFacet();
            const targetFacetName = targetFacet ? targetFacet.FacetName : 'Unknown';
            const suggestion = {
                    name: `${targetFacetName} Skill`,
                    description: `A skill in ${targetFacetName}`,
                    annexType: 'Skill',
                    proficiencies: [ { facet: targetFacetName }, { facet: targetFacetName } ],
                    tags: { facets: [targetFacetName] }
            };
            charData.annexSuggestions.push(suggestion);
        }

        // Description
        const descriptions = await charData.facetweb.generateDescription('Character', 6);
        let desc = `A ${selectedTier ? selectedTier.Type + ' ' : ''}${descriptions[0]} and ${descriptions[1]} ${charData.charType}. Deep down, they are ${descriptions[2]}. Age: ${charData.ageCategory}.`;
        if (charData.personaDetails) {
            if (charData.personaDetails.Motivation) desc += ` Driven by: ${charData.personaDetails.Motivation}`;
            if (charData.personaDetails.Avoid) desc += ` Avoids: ${charData.personaDetails.Avoid}`;
        }
        charData.description = desc;

        // Dynamic import to avoid circular dependency and load extended types
        const Types = await import('./t13ne-char-types.js');
        const typeLower = (charData.charType || '').toLowerCase();
        let detailed;
        
        // Map string types to classes
        const typeMap = {
            'grunt': Types.Grunt,
            'hero': Types.Hero,
            'avatar': Types.Avatar,
            'yarn-teller': Types.YarnTeller,
            'yarn teller': Types.YarnTeller,
            'goblin': Types.Goblin,
            'demon': Types.Demoniac, // Or Demon/Archfiend depending on context, mapping to Demoniac for now
            'demon-lord': Types.Archfiend,
            'kaiju': Types.Kaiju,
            'increated': Types.Daemon,
            'fae': Types.FaeCommoner,
            'toon': Types.BattleToon, // Assuming Battle Toon for now
            'bulmas': Types.Bulmas,
            'immortal': Types.Immortal,
            'eternal': Types.Eternal,
            'paragon': Types.Paragon,
            'lesser divinity': Types.LesserDivinity,
            'god': Types.God,
            'supreme god': Types.SupremeGod,
            'neechie': Types.Neechie,
            'hobgoblin': Types.Hobgoblin,
            'ogre': Types.Ogre,
            'demoniac': Types.Demoniac,
            'wyrdchilde': Types.Wyrdchilde,
            'gestalt mercari': Types.GestaltMercari,
            'patron dÃ¦mon': Types.PatronDaemon,
            'dÃ¦mon': Types.Daemon,
            'fae commoner': Types.FaeCommoner,
            'eelafin': Types.HybridFae,
            'eelanÃ©': Types.Eelane,
            'renegade': Types.Renegade,
            'cambion': Types.Cambion,
            'archmage': Types.Archmage,
            'battle toon': Types.BattleToon,
            'mercari': Types.Mercari,
            'paradox warrior': Types.ParadoxWarrior
        };

        const SpecificClass = typeMap[typeLower] || typeMap[typeLower.replace(/s$/, '')]; // Handle plurals simply

        if (SpecificClass) {
            detailed = new SpecificClass(codexLoader, charData);
        } else {
            // Fallback logic
            if (typeLower.includes('yarn-teller')) detailed = new Types.YarnTeller(codexLoader, charData);
            else if (typeLower.includes('hero')) detailed = new Types.Hero(codexLoader, charData);
            else if (typeLower.includes('grunt')) detailed = new Types.Grunt(codexLoader, charData);
            else detailed = new Detailed(codexLoader, charData);
        }

        // Auto-assign if requested via options or game settings
        const config = T13NE.getConfig();
        if (options.autoAssign || (config.gameSettings && config.gameSettings.autoAssignAnnexes)) {
             Logger.message(`${funcName}: Auto-assigning Annexes...`);
             await detailed.autoAssignAnnexes();
        }

        if (PsychosocialSpaces) {
            if (!detailed.id) detailed.id = `detailed_${Date.now()}_${rng.range(0,1000)}`;
            detailed.psychosocialSpace = PsychosocialSpaces.createHexagonalMap(detailed);
        }

        Logger.end(funcName, detailed);
        return detailed;
    }
}
