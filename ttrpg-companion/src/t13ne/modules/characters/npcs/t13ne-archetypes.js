import { Character, SeededRNG } from "../t13ne-chars.js";
import { PersonalityAnnex, Hitch } from "../../mechanics/t13ne-knots.js";
import T13NE from '../../T13NE.js';
import Logger from "../../core/Logger.js";

export class Archetype extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
    }

    static async generate(codexLoader, options = {}) {
        const funcName = 'Archetype.generate';
        Logger.start(funcName, options);
        const seed = options.seed !== undefined ? options.seed : Date.now();
        const rng = new SeededRNG(seed);
        const genre = options.genre || 'T13 Core';
        const era = options.era || 'Timeless';

        const NameGenerator = T13NE.getModule('NameGenerator');
        const Tapestry = T13NE.getModule('Tapestry');
        const Facets = T13NE.getModule('Facets');
        const T13Geometry = T13NE.getModule('T13Geometry');
        const PsychosocialSpaces = T13NE.getModule('PsychosocialSpaces');

        if (!NameGenerator || !Tapestry || !Facets) {
            Logger.error("T13NE: Modules not loaded for Archetype generation.");
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

        // Load Age
        let ageData = await codexLoader.getData('characters', 'ageCategories.json');
        let selectedAge = (ageData && options.age) ? ageData.find(a => a.Type.toLowerCase() === options.age.toLowerCase()) : null;
        if (!selectedAge && ageData) selectedAge = rng.pick(ageData);
        if (!selectedAge) selectedAge = { Type: 'Adult', Scale_Modifier: 0, Proficiency_Dice: '1d6' };

        let charData = {
            name: 'Unnamed',
            description: '',
            charType: 'Archetype',
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
        Logger.message(`${funcName}: Generated Name: ${charData.name}`);

        if (T13Geometry) {
            charData.geometry = T13Geometry.calculateFullGeo(charData.name);
        }

        // Archetype Statblock
        const yangBoon = Math.floor(rng.next() * 11) + 8 + charData.scaleModifier;
        const boons = Array(12).fill(yangBoon);
        const statblock = Tapestry.setStats(0, boons, [0], 0, '%', 'Archetype');
        
        charData.statblock = statblock;
        charData.facetweb = new Tapestry(statblock);
        charData.iching = statblock.Hex;

        // Personality Annex
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

        // Hitches (Archetypes usually have 1)
        Logger.message(`${funcName}: Generating Hitches...`);
        charData.hitches = [];
        const hitchFacet = resolveFacet(options.facets?.hitches?.[0]);
        const hitch = new Hitch(codexLoader, {
            name: `${hitchFacet.FacetName} Hitch`,
            description: `A hitch related to ${hitchFacet.FacetName}`,
            bane: Math.floor(rng.next() * 26),
            tags: { facets: [hitchFacet.FacetName] }
        });
        charData.hitches.push(hitch);

        // Description
        const descriptions = await charData.facetweb.generateDescription('Character', 6);
        charData.description = `An Archetypal ${descriptions[0]} ${charData.charType}. Driven by ${charData.personaDetails.Motivation || 'Unknown'}.`;

        const archetype = new Archetype(codexLoader, charData);

        if (PsychosocialSpaces) {
            if (!archetype.id) archetype.id = `arch_${Date.now()}_${rng.range(0,1000)}`;
            archetype.psychosocialSpace = PsychosocialSpaces.createHexagonalMap(archetype);
        }

        Logger.end(funcName, archetype);
        return archetype;
    }
}
