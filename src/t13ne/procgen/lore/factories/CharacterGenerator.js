import { LoreData } from '../LoreData.js';
import { NameGenerator } from './NameGenerator.js';
import Logger from '../../../core/Logger.js';
import CacheManager from '../../../core/CacheManager.js';

class Descendant {
    constructor(data) {
        Object.assign(this, data);
    }
}
class Annex {
    constructor(root, channel, tangle, auras) {
        this.root = root;
        this.channel = channel;
        this.tangle = tangle;
        this.auras = auras;
    }
}
class Hitch {
    constructor(name, boon) {
        this.name = name;
        this.boon = boon;
    }
}
class Proficiency {
    constructor(name, facet, boon) {
        this.name = name;
        this.facet = facet;
        this.boon = boon;
    }
}

export class CharacterGenerator {
    constructor(pluginManager) {
        if (!LoreData.isLoaded()) {
            throw new Error("CharacterGenerator cannot be instantiated before LoreData is loaded.");
        }
        this.pluginManager = pluginManager;
        this.nameGenerator = new NameGenerator(pluginManager);
    }

    async generateCharacter(model, options = {}) {
        const characterId = options.seed !== undefined ? `${model}_${options.seed}` : null;
        if (characterId) {
            const cachedCharacter = CacheManager.get('characters', characterId);
            if (cachedCharacter && !options.force) {
                Logger.message(`CharacterGenerator: Returning cached character for ${characterId}`);
                return cachedCharacter;
            }
        }

        Logger.message(`CharacterGenerator: generateCharacter called for model '${model}'`);
        try {
            let character;
            switch (model) {
                case 'Extra':
                case 'Chorus':
                case 'Cast':
                    character = await this._generateExtraCharacter(model, options);
                    break;
                case 'Archetype':
                    character = await this._generateArchetypeCharacter(options);
                    break;
                case 'Detailed':
                    character = await this._generateDetailedCharacter(options);
                    break;
                default:
                    throw new Error(`Unknown character model: ${model}`);
            }

            if (character && characterId) {
                CacheManager.store('characters', characterId, character);
            }
            return character;
        } catch (error) {
            Logger.error(`CharacterGenerator: Failed to generate character for model '${model}'`, error);
            throw error;
        }
    }

    async _getFacets() {
        Logger.message("CharacterGenerator: _getFacets called.");
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        if (T13NE) {
            const Facets = T13NE.getModule('Facets');
            if (Facets) {
                try {
                    const facets = await Facets.getFacetsArr();
                    if (Array.isArray(facets) && facets.length > 0) {
                        // Validate a sample facet
                        if (facets[0] && facets[0].FacetName !== undefined) {
                            Logger.message(`CharacterGenerator: Retrieved ${facets.length} facets from Facets module.`);
                            return facets;
                        } else {
                            Logger.warn("CharacterGenerator: Facets retrieved but appear malformed.", facets[0]);
                        }
                    } else {
                        Logger.warn("CharacterGenerator: Facets module returned empty or invalid array.");
                    }
                } catch (e) {
                    Logger.warn("CharacterGenerator: Failed to retrieve facets from module.", e);
                }
            } else {
                Logger.warn("CharacterGenerator: Facets module not found.");
            }
        } else {
            Logger.warn("CharacterGenerator: T13NE API not found.");
        }
        // Fallback facets if LoreData failed to load them or hasn't loaded them yet
        Logger.message("CharacterGenerator: Using fallback facets list.");
        return [
            { FacetName: 'Awe', Hitch: 'Awe Hitch', FacetIndex: 0 }, { FacetName: 'Burden', Hitch: 'Burden Hitch', FacetIndex: 1 }, 
            { FacetName: 'Craft', Hitch: 'Craft Hitch', FacetIndex: 2 }, { FacetName: 'Dominion', Hitch: 'Dominion Hitch', FacetIndex: 3 },
            { FacetName: 'Enigma', Hitch: 'Enigma Hitch', FacetIndex: 4 }, { FacetName: 'Fury', Hitch: 'Fury Hitch', FacetIndex: 5 }, 
            { FacetName: 'Gossamer', Hitch: 'Gossamer Hitch', FacetIndex: 6 }, { FacetName: 'Heresy', Hitch: 'Heresy Hitch', FacetIndex: 7 },
            { FacetName: 'Inertia', Hitch: 'Inertia Hitch', FacetIndex: 8 }, { FacetName: 'Jeer', Hitch: 'Jeer Hitch', FacetIndex: 9 }, 
            { FacetName: 'Key', Hitch: 'Key Hitch', FacetIndex: 10 }, { FacetName: 'Liberty', Hitch: 'Liberty Hitch', FacetIndex: 11 },
            { FacetName: 'Miasma', Hitch: 'Miasma Hitch', FacetIndex: 12 }, { FacetName: 'Nature', Hitch: 'Nature Hitch', FacetIndex: 13 }, 
            { FacetName: 'Orthodox', Hitch: 'Orthodox Hitch', FacetIndex: 14 }, { FacetName: 'Phoenix', Hitch: 'Phoenix Hitch', FacetIndex: 15 },
            { FacetName: 'Quiet', Hitch: 'Quiet Hitch', FacetIndex: 16 }, { FacetName: 'Rook', Hitch: 'Rook Hitch', FacetIndex: 17 }, 
            { FacetName: 'Sin', Hitch: 'Sin Hitch', FacetIndex: 18 }, { FacetName: 'Trial', Hitch: 'Trial Hitch', FacetIndex: 19 },
            { FacetName: 'Virtue', Hitch: 'Virtue Hitch', FacetIndex: 20 }, { FacetName: 'Wyrd', Hitch: 'Wyrd Hitch', FacetIndex: 21 }, 
            { FacetName: 'Yonder', Hitch: 'Yonder Hitch', FacetIndex: 22 }, { FacetName: 'Zeal', Hitch: 'Zeal Hitch', FacetIndex: 23 }
        ];
    }

    async _generateExtraCharacter(specificType, options = {}) {
        Logger.message(`CharacterGenerator: Generating extra character (${specificType})...`);
        try {
            // Use options.seed if available, otherwise Date.now() + random
            const seed = options.seed !== undefined ? options.seed : (Date.now() + Math.floor(Math.random() * 100000));
            
            // Simple seeded RNG for internal choices
            const rng = (typeof seed === 'number') ? (() => {
                let s = seed;
                return () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
            })() : Math.random;

            const name = this.nameGenerator.generateAlienName(seed);
            Logger.message(`CharacterGenerator: Generated name: ${name}`);
            
            let isChorus;
            if (specificType === 'Chorus') isChorus = true;
            else if (specificType === 'Cast') isChorus = false;
            else isChorus = rng() > 0.5;

            const annexType = isChorus ? 'Talent' : 'Power';
            const facets = await this._getFacets();
            if (!facets || facets.length === 0) {
                Logger.error("CharacterGenerator: No facets available.");
                throw new Error("No facets available for character generation.");
            }

            // Determine selection pool based on species
            let selectionPool = facets;
            const standardSpecies = ['Humans', 'Drones', 'Therios', 'Human', 'Drone', 'Therio'];
            
            if (options.species && !standardSpecies.includes(options.species)) {
                const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
                const T13Tapestry = T13NE?.getModule('Tapestry');
                if (T13Tapestry) {
                    const statblock = T13Tapestry.createSpeciesStatblock(options.species, 0);
                    if (statblock && statblock.Stats) {
                        const sortedStats = [...statblock.Stats].sort((a, b) => b.Facet_Boon - a.Facet_Boon);
                        // Pick from top 6 facets to ensure species flavor
                        const topIndices = sortedStats.slice(0, 6).map(s => s.Facet);
                        const speciesFacets = facets.filter(f => topIndices.includes(f.FacetIndex));
                        if (speciesFacets.length > 0) selectionPool = speciesFacets;
                    }
                }
            }

            // Use options.facets.root if provided
            let rootFacet;
            if (options.facets && options.facets.root && options.facets.root.FacetName) {
                const fName = options.facets.root.FacetName;
                rootFacet = facets.find(f => f.FacetName === fName) || selectionPool[Math.floor(rng() * selectionPool.length)];
            } else {
                rootFacet = selectionPool[Math.floor(rng() * selectionPool.length)];
            }

            const channelFacet = selectionPool[Math.floor(rng() * selectionPool.length)];
            const tangleFacet = selectionPool[Math.floor(rng() * selectionPool.length)];
            
            if (!rootFacet || !channelFacet || !tangleFacet) {
                 Logger.error("CharacterGenerator: Failed to select random facets.", { rootFacet, channelFacet, tangleFacet });
                 throw new Error("Failed to select random facets.");
            }

            Logger.message(`CharacterGenerator: Selected facets - Root: ${rootFacet.FacetName}, Channel: ${channelFacet.FacetName}`);

            const auras = [];

            const annex = new Annex(rootFacet.FacetName, channelFacet.FacetName, tangleFacet.FacetName, auras);

            return {
                name: name,
                type: 'Extra',
                extraType: isChorus ? 'Chorus' : 'Cast',
                annex: annex
            };
        } catch (e) {
            Logger.error(`CharacterGenerator: Error in _generateExtraCharacter: ${e.message}`, e);
            throw e;
        }
    }

    async _generateArchetypeCharacter(options = {}) {
        const seed = options.seed !== undefined ? options.seed : Math.random();
        const rng = (typeof seed === 'number') ? (() => {
            let s = seed;
            return () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
        })() : Math.random;

        const name = this.nameGenerator.generateAlienName(rng(), rng(), rng());
        
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Tapestry = T13NE?.getModule('Tapestry');
        if (!T13Tapestry) throw new Error("T13Tapestry module not loaded");

        let statblock;
        const standardSpecies = ['Humans', 'Drones', 'Therios', 'Human', 'Drone', 'Therio'];
        let selectionPool = null;

        if (options.species && !standardSpecies.includes(options.species)) {
            // Use species specific web for Archetype
            statblock = T13Tapestry.createSpeciesStatblock(options.species, 0);
        } else {
            // Standard flat archetype
            const yangBoon = Math.floor(rng() * 11) + 8;
            const boons = Array(12).fill(yangBoon);
            statblock = T13Tapestry.setStats(0, boons, [0], 0, '%', 'Archetype');
        }

        const tapestry = new T13Tapestry(statblock);
        const facets = await this._getFacets();

        if (options.species && !standardSpecies.includes(options.species)) {
             const sortedStats = [...tapestry.Stats].sort((a, b) => b.Facet_Boon - a.Facet_Boon);
             const topIndices = sortedStats.slice(0, 6).map(s => s.Facet);
             const speciesFacets = facets.filter(f => topIndices.includes(f.FacetIndex));
             if (speciesFacets.length > 0) selectionPool = speciesFacets;
        }

        const pickFacet = () => (selectionPool || facets)[Math.floor(rng() * (selectionPool || facets).length)];

        const personaFacet = pickFacet();
        const coreFacet = pickFacet();
        const personalityAnnex = new Annex(personaFacet.FacetName, coreFacet.FacetName, null, []);

        const hitchFacet = pickFacet();
        const hitch = new Hitch(hitchFacet.Hitch || `${hitchFacet.FacetName} Hitch`, Math.floor(rng() * 26));

        return {
            name: name,
            type: 'Archetype',
            facetweb: tapestry,
            personalityAnnex: personalityAnnex,
            hitches: [hitch]
        };
    }

    async _generateDetailedCharacter(options = {}) {
        Logger.message("CharacterGenerator: _generateDetailedCharacter started.");
        const seed = options.seed !== undefined ? options.seed : Math.random();
        
        // Ensure seed is a number for the RNG
        const seedNum = (typeof seed === 'number') ? seed : (
            (typeof seed === 'string') ? seed.split('').reduce((a,b)=>a+b.charCodeAt(0),0) : Date.now()
        );

        const rng = (() => {
            let s = seedNum;
            return () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
        })();

        Logger.message("CharacterGenerator: Generating Name...");
        let name = "Unknown";
        try {
            const nameSeed = Math.floor(rng() * 1000000);
            Logger.message(`CharacterGenerator: Calling generateAlienName with seed ${nameSeed}`);
            name = this.nameGenerator.generateAlienName(nameSeed);
            Logger.message(`CharacterGenerator: Generated name: ${name}`);
        } catch (e) {
            Logger.error("CharacterGenerator: Name generation failed.", e);
            name = "Error-Name";
        }
        const scale = -1;

        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Tapestry = T13NE?.getModule('Tapestry');
        if (!T13Tapestry) {
            Logger.error("CharacterGenerator: T13Tapestry module not loaded");
            throw new Error("T13Tapestry module not loaded");
        }

        // Use T13Tapestry to generate a randomized statblock
        let statblock;
        const standardSpecies = ['Humans', 'Drones', 'Therios', 'Human', 'Drone', 'Therio'];
        if (options.species && typeof options.species === 'string' && !standardSpecies.includes(options.species)) {
            statblock = T13Tapestry.createSpeciesStatblock(options.species, scale);
        } else {
            statblock = T13Tapestry.randomiseStats(0, 0, scale);
        }

        if (!statblock || !statblock.Stats) {
            Logger.warn("CharacterGenerator: Failed to generate statblock. Using default random.");
            statblock = T13Tapestry.randomiseStats(0, 0, scale);
        }

        const tapestry = new T13Tapestry(statblock);

        const facets = await this._getFacets();
        const personaFacet = facets[Math.floor(rng() * facets.length)];
        const coreFacet = facets[Math.floor(rng() * facets.length)];
        const personalityAnnex = new Annex(personaFacet.FacetName, coreFacet.FacetName, null, []);

        const hitches = [];
        const numHitches = 3; // Example, replace with rule-based number
        for (let i = 0; i < numHitches; i++) {
            const hitchFacet = facets[Math.floor(rng() * facets.length)];
            const hitch = new Hitch(hitchFacet.Hitch || `${hitchFacet.FacetName} Hitch`, Math.floor(rng() * 26));
            hitches.push(hitch);
        }

        const sortedStats = [...tapestry.Stats].sort((a, b) => Math.abs(b.Facet_Boon - 13) - Math.abs(a.Facet_Boon - 13));
        const extremeStats = sortedStats.slice(0, 6);

        Logger.message("CharacterGenerator: Generating description adjectives...");
        const adjectives = extremeStats.map(stat => {
            const facetData = facets.find(f => f.FacetIndex === stat.Facet);
            
            if (!facetData) {
                Logger.warn(`CharacterGenerator: Facet data not found for index ${stat.Facet}`);
                return "Unknown";
            }
            
            if (!facetData.FacetAdjectives) {
                return "Unknown";
            }

            const possibleAdjectives = facetData.FacetAdjectives;
            const closestAdjective = possibleAdjectives.reduce((prev, curr) => {
                return (Math.abs(curr.Boon - stat.Facet_Boon) < Math.abs(prev.Boon - stat.Facet_Boon) ? curr : prev);
            });
            return closestAdjective.Adjective;
        });

        const description = `A ${adjectives[0]} and ${adjectives[1]} individual, often described as ${adjectives[2]}. Can be ${adjectives[3]} when provoked. Deep down, they are ${adjectives[4]} and ${adjectives[5]}.`;

        Logger.message("CharacterGenerator: Detailed character generated successfully.");
        return {
            name,
            type: 'Detailed',
            facetweb: tapestry,
            personalityAnnex,
            hitches,
            description
        };
    }
}
