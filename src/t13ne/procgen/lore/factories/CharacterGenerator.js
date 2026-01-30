import { LoreData } from '../LoreData.js';
import { NameGenerator } from './NameGenerator.js';

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

    async generateCharacter(model) {
        switch (model) {
            case 'Extra':
            case 'Chorus':
            case 'Cast':
                return await this._generateExtraCharacter(model);
            case 'Archetype':
                return await this._generateArchetypeCharacter();
            case 'Detailed':
                return await this._generateDetailedCharacter();
            default:
                throw new Error(`Unknown character model: ${model}`);
        }
    }

    async _getFacets() {
        const T13NE = this.pluginManager.getApi('T13', 'T13NE');
        if (T13NE) {
            const Facets = T13NE.getModule('Facets');
            if (Facets) {
                return await Facets.getFacetsArr();
            }
        }
        // Fallback facets if LoreData failed to load them or hasn't loaded them yet
        return [
            { FacetName: 'Awe', Hitch: 'Awe Hitch' }, { FacetName: 'Burden', Hitch: 'Burden Hitch' }, 
            { FacetName: 'Craft', Hitch: 'Craft Hitch' }, { FacetName: 'Dominion', Hitch: 'Dominion Hitch' },
            { FacetName: 'Enigma', Hitch: 'Enigma Hitch' }, { FacetName: 'Fury', Hitch: 'Fury Hitch' }, 
            { FacetName: 'Gossamer', Hitch: 'Gossamer Hitch' }, { FacetName: 'Heresy', Hitch: 'Heresy Hitch' },
            { FacetName: 'Inertia', Hitch: 'Inertia Hitch' }, { FacetName: 'Jeer', Hitch: 'Jeer Hitch' }, 
            { FacetName: 'Key', Hitch: 'Key Hitch' }, { FacetName: 'Liberty', Hitch: 'Liberty Hitch' },
            { FacetName: 'Miasma', Hitch: 'Miasma Hitch' }, { FacetName: 'Nature', Hitch: 'Nature Hitch' }, 
            { FacetName: 'Orthodox', Hitch: 'Orthodox Hitch' }, { FacetName: 'Phoenix', Hitch: 'Phoenix Hitch' },
            { FacetName: 'Quiet', Hitch: 'Quiet Hitch' }, { FacetName: 'Rook', Hitch: 'Rook Hitch' }, 
            { FacetName: 'Sin', Hitch: 'Sin Hitch' }, { FacetName: 'Trial', Hitch: 'Trial Hitch' },
            { FacetName: 'Virtue', Hitch: 'Virtue Hitch' }, { FacetName: 'Wyrd', Hitch: 'Wyrd Hitch' }, 
            { FacetName: 'Yonder', Hitch: 'Yonder Hitch' }, { FacetName: 'Zeal', Hitch: 'Zeal Hitch' }
        ];
    }

    async _generateExtraCharacter(specificType) {
        const name = this.nameGenerator.generateAlienName(Math.random(), Math.random(), Math.random());
        
        let isChorus;
        if (specificType === 'Chorus') isChorus = true;
        else if (specificType === 'Cast') isChorus = false;
        else isChorus = Math.random() > 0.5;

        const annexType = isChorus ? 'Talent' : 'Power';
        const facets = await this._getFacets();
        const rootFacet = facets[Math.floor(Math.random() * facets.length)];
        const channelFacet = facets[Math.floor(Math.random() * facets.length)];
        const tangleFacet = facets[Math.floor(Math.random() * facets.length)];
        const auras = [];

        const annex = new Annex(rootFacet.FacetName, channelFacet.FacetName, tangleFacet.FacetName, auras);

        return {
            name: name,
            type: 'Extra',
            extraType: isChorus ? 'Chorus' : 'Cast',
            annex: annex
        };
    }

    async _generateArchetypeCharacter() {
        const name = this.nameGenerator.generateAlienName(Math.random(), Math.random(), Math.random());
        const yangBoon = Math.floor(Math.random() * 11) + 8; // Random boon between 8 and 18
        
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Tapestry = T13NE?.getModule('Tapestry');
        if (!T13Tapestry) throw new Error("T13Tapestry module not loaded");

        // Create a flat statblock where all Yang facets have the same boon
        const boons = Array(12).fill(yangBoon);
        const statblock = T13Tapestry.setStats(0, boons, [0], 0, '%', 'Archetype');
        const tapestry = new T13Tapestry(statblock);

        const facets = await this._getFacets();
        const personaFacet = facets[Math.floor(Math.random() * facets.length)];
        const coreFacet = facets[Math.floor(Math.random() * facets.length)];
        const personalityAnnex = new Annex(personaFacet.FacetName, coreFacet.FacetName, null, []);

        const hitchFacet = facets[Math.floor(Math.random() * facets.length)];
        const hitch = new Hitch(hitchFacet.Hitch || `${hitchFacet.FacetName} Hitch`, Math.floor(Math.random() * 26));

        return {
            name: name,
            type: 'Archetype',
            facetweb: tapestry,
            personalityAnnex: personalityAnnex,
            hitches: [hitch]
        };
    }

    async _generateDetailedCharacter() {
        const name = this.nameGenerator.generateAlienName(Math.random(), Math.random(), Math.random());
        const scale = -1;

        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Tapestry = T13NE?.getModule('Tapestry');
        if (!T13Tapestry) throw new Error("T13Tapestry module not loaded");

        // Use T13Tapestry to generate a randomized statblock
        const statblock = T13Tapestry.randomiseStats(0, 0, scale);
        const tapestry = new T13Tapestry(statblock);

        const facets = await this._getFacets();
        const personaFacet = facets[Math.floor(Math.random() * facets.length)];
        const coreFacet = facets[Math.floor(Math.random() * facets.length)];
        const personalityAnnex = new Annex(personaFacet.FacetName, coreFacet.FacetName, null, []);

        const hitches = [];
        const numHitches = 3; // Example, replace with rule-based number
        for (let i = 0; i < numHitches; i++) {
            const hitchFacet = facets[Math.floor(Math.random() * facets.length)];
            const hitch = new Hitch(hitchFacet.Hitch || `${hitchFacet.FacetName} Hitch`, Math.floor(Math.random() * 26));
            hitches.push(hitch);
        }

        const sortedStats = [...tapestry.Stats].sort((a, b) => Math.abs(b.Facet_Boon - 13) - Math.abs(a.Facet_Boon - 13));
        const extremeStats = sortedStats.slice(0, 6);

        const adjectives = extremeStats.map(stat => {
            const facetData = facets.find(f => f.FacetIndex === stat.Facet);
            const possibleAdjectives = facetData.FacetAdjectives;
            const closestAdjective = possibleAdjectives.reduce((prev, curr) => {
                return (Math.abs(curr.Boon - stat.Facet_Boon) < Math.abs(prev.Boon - stat.Facet_Boon) ? curr : prev);
            });
            return closestAdjective.Adjective;
        });

        const description = `A ${adjectives[0]} and ${adjectives[1]} individual, often described as ${adjectives[2]}. Can be ${adjectives[3]} when provoked. Deep down, they are ${adjectives[4]} and ${adjectives[5]}.`;

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
