import { Character, SeededRNG } from '../t13ne-chars.js';
import { Annex, PersonalityAnnex } from '../t13ne-knots.js';
import T13NE from '../../T13NE.js';
import Logger from '@/js/core/Logger.js';

export class Extra extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
    }

    static async generate(codexLoader, options = {}) {
        const seed = options.seed !== undefined ? options.seed : Date.now();
        const rng = new SeededRNG(seed);
        const genre = options.genre || 'T13 Core';
        const era = options.era || 'Timeless';

        const NameGenerator = T13NE.getModule('NameGenerator');
        const Facets = T13NE.getModule('Facets');
        const Threads = T13NE.getModule('Threads');
        const T13Geometry = T13NE.getModule('T13Geometry');
        const AnnexFactory = T13NE.getModule('AnnexFactory');
        const PsychosocialSpaces = T13NE.getModule('PsychosocialSpaces');

        if (!NameGenerator || !Facets) {
            Logger.error("T13NE: Modules not loaded for Extra generation.");
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

        // Load Extra Types
        let extraTypesData = await codexLoader.getData('characters', 'extraTypes.json');
        let typeData = null;
        let targetModel = (options.model || 'Extra').toLowerCase();
        
        if (extraTypesData) {
            typeData = extraTypesData.find(e => e.Type.toLowerCase() === targetModel);
            if (!typeData && targetModel === 'extra') {
                typeData = rng.pick(extraTypesData);
            }
        }
        if (!typeData) typeData = { Type: 'Chorus', Master_Annex: 'Talent' };

        // Load Age
        let ageData = await codexLoader.getData('characters', 'ageCategories.json');
        let selectedAge = (ageData && options.age) ? ageData.find(a => a.Type.toLowerCase() === options.age.toLowerCase()) : null;
        if (!selectedAge && ageData) selectedAge = rng.pick(ageData);
        if (!selectedAge) selectedAge = { Type: 'Adult', Scale_Modifier: 0, Proficiency_Dice: '1d6' };

        let charData = {
            name: 'Unnamed',
            description: '',
            charType: typeData.Type,
            tags: { genres: [genre], eras: [era], facets: [] },
            knotData: [],
            ageCategory: selectedAge.Type,
            scaleModifier: parseInt(selectedAge.Scale_Modifier, 10) || 0,
            proficiencyDice: selectedAge.Proficiency_Dice
        };

        // Name
        const nameResult = await NameGenerator.generate({ type: 'Alien' }, rng.next()); 
        charData.name = nameResult[0];
        charData.fullName = nameResult[1];
        charData.altName = nameResult[2];

        if (T13Geometry) {
            charData.geometry = T13Geometry.calculateFullGeo(charData.name);
        }

        // Master Annex
        let annexType = 'Skill';
        const masterAnnexDesc = typeData.Master_Annex || '';
        if (masterAnnexDesc.includes('Super-Annex')) annexType = 'Super-Annex';
        else if (masterAnnexDesc.includes('Power')) annexType = 'Power';
        else if (masterAnnexDesc.includes('Talent')) annexType = 'Talent';
        
        const root = resolveFacet(options.facets?.root);
        const channel = resolveFacet(options.facets?.channel);
        const tangle = resolveFacet(options.facets?.tangle);
        
        // Calculate Proficiencies count for Master Annex
        let masterProfCount = 2;
        if (annexType === 'Talent') masterProfCount = rng.range(3, 5);
        else if (annexType === 'Power') masterProfCount = rng.range(6, 10);
        else if (annexType === 'Super-Annex') masterProfCount = rng.range(11, 15);

        const masterProfs = [
            { facet: root.FacetName, knot: 16 }, // Root
            { facet: channel.FacetName, knot: 32 } // Channel
        ];
        // Add filler proficiencies
        for(let i=2; i<masterProfCount; i++) {
             masterProfs.push({ facet: tangle.FacetName, knot: 1 });
        }

        // Create a suggestion for the master annex instead of creating it.
        charData.masterAnnexSuggestion = {
            name: `${root.FacetName}-${channel.FacetName} Ability`,
            description: `A ${annexType} rooted in ${root.FacetName}, channelling ${channel.FacetName}.`,
            tags: { facets: [root.FacetName, channel.FacetName, tangle.FacetName] },
            proficiencies: masterProfs,
            annexType: annexType,
            isMaster: true
        };
        charData.masterAnnex = null;

        // Personality for Cast/Force-of-Nature
        if (typeData.Type.includes('Cast') || typeData.Type.includes('Force-of-Nature')) {
             const personaFacet = resolveFacet(options.facets?.persona);
             const coreFacet = resolveFacet(options.facets?.core);

             const personaName = (personaFacet.Persona && personaFacet.Persona.Name) ? personaFacet.Persona.Name : personaFacet.FacetName;
             charData.personaDetails = personaFacet.Persona || {};
             const coreName = (coreFacet.Core) ? coreFacet.Core : coreFacet.FacetName;

             charData.personalityAnnex = new PersonalityAnnex(codexLoader, {
                name: `${charData.name}'s Personality`,
                description: `Persona: ${personaName}, Core: ${coreName}`,
                tags: { facets: [personaFacet.FacetName, coreFacet.FacetName] },
                personas: [personaName],
                cores: [coreName]
            });
        }

        // Sub-Annexes
        let subAnnexCount = 0;
        let subAnnexType = 'Skill';
        if (annexType === 'Talent') { subAnnexCount = rng.range(1, 2); subAnnexType = 'Skill'; }
        else if (annexType === 'Power') { subAnnexCount = rng.range(3, 5); subAnnexType = 'Talent'; }
        else if (annexType === 'Super-Annex') { subAnnexCount = rng.range(6, 10); subAnnexType = 'Power'; }

        charData.subAnnexes = [];
        charData.annexSuggestions = [];
        for (let i = 0; i < subAnnexCount; i++) {
            const subFacet = resolveFacet(null);
            const suggestion = {
                name: `${subFacet.FacetName} ${subAnnexType}`,
                description: `A ${subAnnexType} in ${subFacet.FacetName}`,
                tags: charData.tags,
                annexType: subAnnexType,
                proficiencies: [
                    { facet: subFacet.FacetName },
                    { facet: subFacet.FacetName }
                ]
            };
            charData.annexSuggestions.push(suggestion);
        }

        const extra = new Extra(codexLoader, charData);

        if (PsychosocialSpaces) {
            if (!extra.id) extra.id = `extra_${Date.now()}_${rng.range(0,1000)}`;
            extra.psychosocialSpace = PsychosocialSpaces.createTriangularMap(extra);
        }

        return extra;
    }
}
