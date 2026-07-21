﻿import { Character, SeededRNG } from "/src/t13ne/modules/characters/t13ne-chars.js";
import { Annex, Hitch, PersonalityAnnex } from "/src/t13ne/modules/mechanics/t13ne-knots.js";
import T13NE from '/src/t13ne/T13NE.js';
import Logger from "/src/t13ne/core/Logger.js";
import T13Boons from '/src/t13ne/modules/mechanics/t13ne-boon.js';

const LITE_BOONS = {
    1: { type: 'Proficiency', boon: 10, draw: 1, play: 1, rt: 0, grt: 0, umbral: 0, nimbed: 0 },
    2: { type: 'Skill', boon: 19, draw: 2, play: 1, rt: 5, grt: 0, umbral: 0, nimbed: 0 },
    3: { type: 'Minor Talent', boon: 26, draw: 2, play: 2, rt: 7, grt: 1, umbral: 1, nimbed: 0 },
    4: { type: 'Normal Talent', boon: 29, draw: 2, play: 2, rt: 7, grt: 1, umbral: 1, nimbed: 1 },
    5: { type: 'Major Talent', boon: 32, draw: 3, play: 2, rt: 8, grt: 1, umbral: 1, nimbed: 2 },
    6: { type: 'Minor Power', boon: 38, draw: 3, play: 3, rt: 9, grt: 2, umbral: 2, nimbed: 2 },
    7: { type: 'Major Power', boon: 49, draw: 3, play: 3, rt: 10, grt: 2, umbral: 2, nimbed: 3 },
    8: { type: 'Super-Skill', boon: 59, draw: 4, play: 4, rt: 12, grt: 3, umbral: 0, nimbed: 6 },
    9: { type: 'Super-Talent', boon: 92, draw: 5, play: 4, rt: 16, grt: 3, umbral: 1, nimbed: 6 },
    10: { type: 'Super-Power', boon: 142, draw: 6, play: 4, rt: 21, grt: 3, umbral: 2, nimbed: 6 } // * +2 from other facets
};

export class Lite extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Lite';
        this.woundStackLimit = 3; // Max 3 of same wound type before increasing level
        this.woundCapacity = this.calculateWoundCapacity();

        // Lite characters store Yin on Hitches and Yang on Proficiencies
        this.yinStorage = data.yinStorage || {};
        this.yangStorage = data.yangStorage || {};
    }

    calculateWoundCapacity() {
        // 1 Wound per Proficiency/Annex. 
        // Assuming this means per Annex object, as Proficiencies are combined into Annexes in Lite.
        return (this.subAnnexes ? this.subAnnexes.length : 0) + (this.masterAnnex ? 1 : 0);
    }

    static async generate(codexLoader, options = {}) {
        const funcName = 'Lite.generate';
        Logger.start(funcName, options);
        const seed = options.seed !== undefined ? options.seed : Date.now();
        const rng = new SeededRNG(seed);
        const genre = options.genre || 'T13 Core';
        const era = options.era || 'Timeless';

        const NameGenerator = T13NE.getModule('NameGenerator');
        const Facets = T13NE.getModule('Facets');
        const Threads = T13NE.getModule('Threads');
        const T13Geometry = T13NE.getModule('T13Geometry');
        const IChing = T13NE.getModule('IChing');

        if (!NameGenerator || !Facets) {
            Logger.error("T13NE: Modules not loaded for Lite generation.");
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

        let charData = {
            name: 'Unnamed',
            description: '',
            charType: 'Lite',
            tags: { genres: [genre], eras: [era], facets: [] },
            knotData: [],
            ageCategory: 'Adult',
            scaleModifier: 0,
            proficiencyDice: '1d6',
            hitches: [],
            subAnnexes: [],
            yinStorage: {},
            yangStorage: {}
        };

        // 1. Name & Geometry
        const nameResult = await NameGenerator.generate({ type: 'Alien' }, rng.next());
        charData.name = nameResult[0];
        charData.fullName = nameResult[1];
        charData.altName = nameResult[2];
        Logger.message(`${funcName}: Generated Name: ${charData.name}`);

        if (T13Geometry) {
            charData.geometry = T13Geometry.calculateFullGeo(charData.name);
        }

        // 2. Hitches (1 to 13)
        Logger.message(`${funcName}: Generating Hitches...`);
        const numHitches = rng.range(1, 13);
        let totalProficiencyPoints = 0;
        let maxHitchBoon = 0;

        for (let i = 0; i < numHitches; i++) {
            const hitchFacet = resolveFacet(null);
            // Determine Bane: <10 Quirk, 10-19 Flaw, 20+ Woe
            // Weighted random for variety
            let bane;
            const roll = rng.next();
            if (roll < 0.5) bane = rng.range(1, 9); // Quirk
            else if (roll < 0.85) bane = rng.range(10, 19); // Flaw
            else bane = rng.range(20, 26); // Woe

            if (bane > maxHitchBoon) maxHitchBoon = bane;
            totalProficiencyPoints += bane;

            const hitch = new Hitch(codexLoader, {
                name: `${hitchFacet.FacetName} ${bane < 10 ? 'Quirk' : (bane < 20 ? 'Flaw' : 'Woe')}`,
                description: `A Lite Hitch of ${hitchFacet.FacetName}`,
                bane: bane,
                tags: { facets: [hitchFacet.FacetName] }
            });
            charData.hitches.push(hitch);

            // Store Yin Capacity
            const yinValue = T13Boons.getBoonValue(bane);
            charData.yinStorage[hitch.name] = { capacity: yinValue, current: 0 };
        }

        // 3. Proficiencies & Annexes
        // "For each Hitch Bane the Lite Character may select a Proficiency."
        // "multiply/combine proficiencies to make the Lite equivalent of Annexes"
        Logger.message(`${funcName}: Generating Annex Suggestions...`);
        let remainingProfs = totalProficiencyPoints;
        charData.annexSuggestions = [];

        while (remainingProfs > 0) {
            // Decide size of next Annex (1-10 profs)
            // Bias towards larger annexes if we have many points
            let size = 1;
            if (remainingProfs >= 10 && rng.next() > 0.7) size = 10;
            else if (remainingProfs >= 6 && rng.next() > 0.6) size = rng.range(6, 9);
            else if (remainingProfs >= 3 && rng.next() > 0.5) size = rng.range(3, 5);
            else size = Math.min(remainingProfs, rng.range(1, 2));

            remainingProfs -= size;
            const annexDef = LITE_BOONS[size];
            const annexFacet = resolveFacet(null);

            // Get actual proficiencies from Threads if possible to populate the knot
            let profs = [];
            if (Threads) {
                profs = await Threads.findProficiencies({ facet: annexFacet.FacetName, genre, era });
            }

            // Pick 'size' proficiencies (duplicating if needed or using placeholders)
            const knotData = [];
            for (let k = 0; k < size; k++) {
                if (profs && profs.length > 0) {
                    const p = rng.pick(profs);
                    knotData.push({ profId: p.id, knot: 1 });
                } else {
                    knotData.push({ profId: `lite_prof_${annexFacet.FacetName}_${k}`, knot: 1 });
                }
            }

            const suggestion = {
                name: `${annexFacet.FacetName} ${annexDef.type}`,
                description: annexDef.Description || `A ${annexDef.type} based on ${annexFacet.FacetName}.`,
                tags: { facets: [annexFacet.FacetName] },
                annexType: annexDef.type,
                proficiencies: knotData.map(p => p.profId ? p.profId : { name: p.profId, facet: annexFacet.FacetName }),
                liteStats: annexDef
            };
            charData.annexSuggestions.push(suggestion);

            // Store Yang Capacity
            const yangValue = T13Boons.getBoonValue(annexDef.boon);
            charData.yangStorage[suggestion.name] = { capacity: yangValue, current: 0 };
        }

        // 4. Personality Annex
        // "Personality Annex Boon is equal to Max Yin looked up as Value to a Boon + Highest Proficiency Boon equivalent"
        // Max Yin Value comes from the highest Hitch Bane converted to Value.
        // But wait, "Max Yin looked up as Value to a Boon" -> This effectively just returns the Hitch Bane itself 
        // (since Boon -> Value -> Boon is circular, unless scale modifies it).
        // Assuming standard scale 0 for Lite.

        Logger.message(`${funcName}: Generating Personality...`);
        let highestProfBoon = 0;
        charData.subAnnexes.forEach(a => {
            if (a.liteStats && a.liteStats.boon > highestProfBoon) highestProfBoon = a.liteStats.boon;
        });

        const personalityBoon = maxHitchBoon + highestProfBoon;

        // Select Personality/Core from existing facets
        const availableFacets = new Set();
        charData.hitches.forEach(h => h.tags.facets.forEach(f => availableFacets.add(f)));
        charData.subAnnexes.forEach(a => a.tags.facets.forEach(f => availableFacets.add(f)));
        const facetList = Array.from(availableFacets);

        const personaFacetName = rng.pick(facetList) || 'Awe';
        const coreFacetName = rng.pick(facetList) || 'Zeal';

        charData.personalityAnnex = new PersonalityAnnex(codexLoader, {
            name: `${charData.name}'s Lite Personality`,
            description: `Persona: ${personaFacetName}, Core: ${coreFacetName}. Boon: ${personalityBoon}`,
            tags: { facets: [personaFacetName, coreFacetName] },
            personas: [personaFacetName],
            cores: [coreFacetName]
        });
        // Override boon
        charData.personalityAnnex.boon = personalityBoon;

        // 5. I-Ching
        if (IChing) {
            // Randomly select I-Ching
            // Lite characters might not have a full statblock to calculate from, so random is appropriate
            const hex1 = rng.range(0, 63);
            const hex2 = rng.range(0, 63);
            charData.iching = [hex1, hex2];
        }

        charData.description = `A Lite character with ${numHitches} Hitches and ${charData.subAnnexes.length} Annexes. Highest Ability: ${highestProfBoon} Boon.`;

        const liteChar = new Lite(codexLoader, charData);
        Logger.end(funcName, liteChar);
        return liteChar;
    }
}
