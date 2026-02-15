// T13Tapestry.js
import T13Dice from '../modules/t13ne-dice.js';
import T13NE_Facets from '../modules/t13ne-facets.js';
import T13Boons from '../modules/t13ne-boon.js';
import Logger from '/src/t13ne/core/Logger.js';
import FacetWeb from '../modules/t13ne-facet-web.js';
import T13NE_PRNG from '../modules/t13ne-prng.js';
import T13Name from '../modules/t13ne-names.js';

/**
 * A JavaScript port of the T13Statblock PHP class.
 * It represents a single statblock instance (a "Tapestry") and provides static methods
 * for managing a collection of statblocks, similar to the original PHP static class.
 */
class T13Tapestry extends FacetWeb {

    // --- Static Properties (Data Ported from PHP) ---

    static defaultStatblock = {
        'Name': 'Universal',
        'Hex': [0, 63],
        'Scale': 0, 'Stats': [
            { 'Facet': 0, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 9, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 2, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 13, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 3, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 22, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 5, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 16, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 6, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 1, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 7, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 14, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 10, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 4, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 11, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 21, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 15, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 12, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 18, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 20, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 19, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 17, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
            { 'Facet': 23, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 8, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 }
        ]
    };

    static mystats = [
        this.defaultStatblock,
        {
            'Name': 'Multiversal/a1',
            'Hex': [32, 33],
            'Scale': 7, 'Stats': [
                { 'Facet': 0, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 9, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 2, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 13, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 3, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 22, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 5, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 16, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 6, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 1, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 7, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 14, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 10, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 4, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 11, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 21, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 15, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 12, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 18, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 20, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 19, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 17, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 },
                { 'Facet': 23, 'Facet_Boon': 13, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 8, 'Antifacet_Boon': 13, 'AntiFacet_Sway': 0 }
            ]
        },
        {
            'Name': 'Omniversal/Cycles',
            'Hex': [0, 0],
            'Scale': 13, 'Stats': [
                { 'Facet': 0, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 9, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 2, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 13, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 3, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 22, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 5, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 16, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 6, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 1, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 7, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 14, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 10, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 4, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 11, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 21, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 15, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 12, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 18, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 20, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 19, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 17, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 },
                { 'Facet': 23, 'Facet_Boon': 26, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': false, 'Antifacet_Mutation_Matrix': 0, 'Antifacet': 8, 'Antifacet_Boon': 26, 'AntiFacet_Sway': 0 }
            ]
        }
    ];

    /**
     * Creates a T13Tapestry instance, which represents a single statblock.
     * @param {string|number|object} [source=0] - The source to build the statblock from.
     * - A number (alt ID) to load from the static cache.
     * - A shortcode string to be parsed.
     * - The string 'rand' to create a random statblock.
     * - A statblock object to be instantiated.
     * @param {number} [alt=0] - The alternate ID, used if the source is a shortcode or 'rand'.
     */
    constructor(source = 0, alt = 0) {
        super(); // Initialize FacetWeb
        let statblock;

        if (typeof source === 'number') {
            statblock = T13Tapestry.getStats(source);
        } else if (typeof source === 'string') {
            if (source.toLowerCase() === 'rand') {
                statblock = T13Tapestry.randomiseStats(0, alt);
            } else {
                statblock = T13Tapestry.loadStatsFromSC(source, alt);
            }
        } else if (typeof source === 'object' && source !== null) {
            statblock = source;
        } else {
            Logger.warn(`Invalid source for T13Tapestry constructor: ${source}. Using default.`);
            statblock = T13Tapestry.getStats(0);
        }

        // Assign all properties from the statblock object to this instance
        Object.assign(this, statblock);

        // Default Scale to 13 if not provided
        this.Scale = this.Scale !== undefined ? this.Scale : 13;
        this.monsterType = statblock.monsterType || 'Intrepid'; // Default monster type

        // Preserve or generate professional ID
        this.id = statblock.id || `tap-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Apply T13Name standards
        const t13n = new T13Name(this.Name || this.name || 'Unnamed Tapestry');
        this.Name = t13n.common;
        this.name = t13n.common;
        this.fullName = statblock.fullName || t13n.full;
        this.altName = statblock.altName || t13n.aliases;
        this.t13Name = t13n.asArray;
    }

    /**
     * Generates a description based on the Tapestry's stats.
     * @param {string} [type='Character'] - The type of adjectives to use.
     * @param {number} [count=7] - The number of adjectives to return //was specified to be random 7-11 but AI devs do be AI devs
     * @returns {Promise<string[]>}
     */
    async generateDescription(type = 'Character', count = 7) {
        return T13NE_Facets.generateDescription(this, type, count);
    }

    /**
     * Overrides getFacetBoon to apply Monster Facet rules.
     * @param {string|number} facetIdentifier 
     * @param {number} [twists=0] - Current twists (for Twisted monsters).
     * @returns {object} { Boon, Scale, EffectiveBoon }
     */
    getFacetBoon(facetIdentifier, twists = 0) {
        const base = super.getFacetBoon(facetIdentifier);
        const facetIndex = FacetWeb.getFacetIndex(facetIdentifier);
        
        const stat = this.Stats.find(s => s.Facet === facetIndex || s.Antifacet === facetIndex);
        if (stat) {
            const isMonster = (stat.Facet === facetIndex && stat.IsMonsterFacet) || (stat.Antifacet === facetIndex && stat.IsMonsterAntifacet);
            if (isMonster) {
                const count = this.getMonsterFacets().length;
                const effective = T13Tapestry.calculateMonsterBoon(this.monsterType, base.Boon, count, twists);
                return { ...base, Boon: effective, OriginalBoon: base.Boon, IsMonster: true };
            }
        }
        return base;
    }

    // --- Static Methods (Manager) ---


    /**
     * Gets the number of statblocks in the cache.
     * @returns {number}
     */
    static getNewStatblock() {
        return this.mystats.length;
    }

    /**
     * Builds the full 'Stats' array from a simple array of boons and sways.
     * @param {number[]} [boons=[13]] - An array of 12 or 24 boon values.
     * @param {number[]} [sways=[0]] - An array of sway values.
     * @returns {object[]} The detailed 'Stats' array for a statblock.
     */
    static buildStats(boons = [13], sways = [0]) {
        return super.buildStats(boons, sways);
    }

    /**
     * Creates or updates a statblock in the static cache.
     * @returns {object} The created or updated statblock object.
     */
    static setStats(alt = 0, boons = [13], sways = [0], scale = 0, hex = ['%', '%'], name = 'Unnamed') {
        if (alt === 0) {
            alt = this.getNewStatblock();
        }

        const stats = this.buildStats(boons, sways);

        if (Array.isArray(hex) && hex[0] === '%') {
            const tempWeb = new FacetWeb({ Stats: stats });
            hex = tempWeb.calculateIChing();
        }

        const newStatblock = { Name: name, Hex: hex, Scale: scale, Stats: stats, Alt: alt };
        this.mystats[alt] = newStatblock;

        // In a real application, you might save this to localStorage or a server here.
        Logger.message(`Statblock for alt ${alt} (${name}) set.`);

        return this.mystats[alt];
    }

    /**
     * Retrieves a statblock from the cache or creates it from a shortcode.
     * @param {number} [alt=0] - The alternate ID to retrieve.
     * @param {string} [statshortcode=''] - A shortcode to load from if the alt is not in the cache.
     * @returns {object} The statblock object.
     */
    static getStats(alt = 0, statshortcode = '') {
        if (!Number.isInteger(alt) || alt < 0) {
            alt = 0;
        }
        if (statshortcode && !this.mystats[alt]) {
            this.loadStatsFromSC(statshortcode, alt);
        }

        if (this.mystats[alt]) {
            return this.mystats[alt];
        }

        // Fallback to default if not found
        return this.mystats[0];
    }

    /**
     * Decodes a statblock shortcode string and creates a statblock.
     * @param {string} statstring - The shortcode string.
     * @param {number} [alt=0] - The alternate ID for the new statblock.
     * @returns {object} The newly created statblock object.
     */
    static loadStatsFromSC(statstring, alt = 0) {
        const parts = statstring.split(':');
        if (!Number.isInteger(alt)) alt = 0;

        // Handle "Scale:X" format (e.g. from corePlots.json)
        if (parts[0].trim().toLowerCase() === 'scale' && parts.length > 1) {
            const scale = parseInt(parts[1], 10) || 0;
            return this.randomiseStats(0, alt, scale);
        }

        if (parts[1] === "rand" || !Number.isFinite(parseFloat(parts[0]))) {
            const scale = parseInt(parts[0], 10) || 0;
            return this.randomiseStats(0, alt, scale);
        } else {
            const scale = parseInt(parts[0], 10);
            const dataString = parts[1] || '';
            const hex = (parts[2] || '=').split('=').map(v => parseInt(v, 10));

            // Check for new format (contains '=')
            if (dataString.includes('=')) {
                const statsMap = new Map();
                const entries = dataString.split(',');
                entries.forEach(entry => {
                    const [idStr, valStr] = entry.split('=');
                    const facetId = parseInt(idStr, 10);
                    const [boonStr, swayStr] = (valStr || '').split('/');
                    statsMap.set(facetId, {
                        boon: parseInt(boonStr, 10) || 0,
                        sway: parseInt(swayStr, 10) || 0
                    });
                });

                const pairs = FacetWeb.getPairs();
                const stats = [];

                for (const pair of pairs) {
                    const yang = statsMap.get(pair.Yang) || { boon: 13, sway: 0 };
                    const yin = statsMap.get(pair.Yin) || { boon: 13, sway: 0 };

                    stats.push({
                        'Facet': pair.Yang,
                        'Facet_Boon': yang.boon,
                        'Facet_Sway': yang.sway,
                        'Facet_Mutation_Matrix': 0,
                        'Joined': (yang.boon + yin.boon === 26),
                        'Antifacet_Mutation_Matrix': 0,
                        'Antifacet': pair.Yin,
                        'Antifacet_Boon': yin.boon,
                        'AntiFacet_Sway': yin.sway
                    });
                }

                const newStatblock = { Name: String(alt), Hex: hex, Scale: scale, Stats: stats, Alt: alt };
                this.mystats[alt] = newStatblock;
                return newStatblock;
            } else {
                // Old format fallback
                const allValues = dataString.split(',').map(v => parseInt(v, 10));
                const boons = allValues.slice(0, 24);
                const sways = allValues.slice(24, 48);

                return this.setStats(alt, boons, sways, scale, hex, String(alt));
            }
        }
    }

    /**
     * Encodes a statblock object into a shortcode string.
     * @param {object|number} source - The statblock object or an alt ID to encode.
     * @returns {string} The statblock shortcode string.
     */
    static encodeStatblock(source) {
        const statblock = (typeof source === 'number') ? this.getStats(source) : source;

        if (!statblock || !statblock.Stats) {
            Logger.error("Invalid statblock provided for encoding.");
            return '';
        }

        const scale = statblock.Scale;
        const hex = statblock.Hex || [0, 0];

        // New format: FacetID=Boon/Sway
        const entries = [];
        statblock.Stats.forEach(pair => {
            entries.push(`${pair.Facet}=${pair.Facet_Boon}/${pair.Facet_Sway}`);
            entries.push(`${pair.Antifacet}=${pair.Antifacet_Boon}/${pair.AntiFacet_Sway}`);
        });

        return `${scale}:${entries.join(',')}:${hex[0]}=${hex[1]}`;
    }

    /**
     * Creates a statblock with randomized boon values.
     * @returns {object} The newly created statblock object.
     */
    static randomiseStats(type = 0, alt = 0, scale = 0, statno = 12) {
        const stats = [];
        for (let i = 0; i <= statno; i++) {
            const typer = (type === 0) ? T13Dice.RNG(1, 7, 0) : type;
            switch (String(typer)) {
                case '1': stats.push(T13Dice.RNG(1, 25, 0)); break;
                case '2': stats.push(T13Dice.RNG(1, 12, 0) + T13Dice.RNG(0, 13, 0)); break;
                case '3': stats.push(T13Dice.RNG(1, 6, 0) + T13Dice.RNG(1, 6, 0) + T13Dice.RNG(1, 6, 0)); break;
                case '4': stats.push(13 + T13Dice.RNG(0, 13, 0) - T13Dice.RNG(0, 13, 0)); break;
                case '5': stats.push(8 + T13Dice.RNG(0, 10, 0)); break;
                case '6': stats.push(T13Dice.RNG(6, 20, 0)); break;
                default: stats.push(T13Boons.getBoonReduced(T13Dice.RNG(1, 200, 0))); break;
            }
        }
        return this.setStats(alt, stats, [0], scale, '%', String(alt));
    }

    /**
     * Returns the Facet Sway Potency type based on the Boon.
     * @param {number} boon 
     * @returns {string} 'Threadbare'|'Banal'|'Intrepid'|'Bold'|'Monstrous'|'Twisted'
     */
    static getSwayPotency(boon) {
        if (boon <= 0) return 'Threadbare';
        if (boon <= 7) return 'Banal';
        if (boon <= 15) return 'Intrepid';
        if (boon <= 21) return 'Bold';
        if (boon <= 25) return 'Monstrous';
        return 'Twisted';
    }

    /**
     * Calculates the effective boon for a Monster Facet based on the Monster Type rules.
     * @param {string} monsterType - Banal, Intrepid, Bold, Monstrous, Twisted.
     * @param {number} baseBoon - The original facet boon.
     * @param {number} monsterFacetCount - Total number of monster facets the character has.
     * @param {number} [twists=0] - Number of twists (for Twisted type).
     * @returns {number} The calculated effective boon.
     */
    static calculateMonsterBoon(monsterType, baseBoon, monsterFacetCount, twists = 0) {
        let value;
        switch (monsterType) {
            case 'Banal':
                // Increased by count (Scale effect)
                return baseBoon + monsterFacetCount;
            case 'Intrepid':
                // Value(Boon + Count) + Value(Boon) -> converted to Boon
                const val1 = T13Boons.getBoonValue(baseBoon + monsterFacetCount);
                const val2 = T13Boons.getBoonValue(baseBoon);
                return T13Boons.getBoonReduced(val1 + val2);
            case 'Bold':
                // Value multiplied by 1 + Count
                value = T13Boons.getBoonValue(baseBoon) * (1 + monsterFacetCount);
                return T13Boons.getBoonReduced(value);
            case 'Monstrous':
                // Value(Boon + Count) / 2 -> Boon
                return Math.floor(T13Boons.getBoonValue(baseBoon + monsterFacetCount) / 2);
            case 'Twisted':
                // Boon * (1 + Count + Twists)
                return baseBoon * (1 + monsterFacetCount + twists);
            default:
                return baseBoon;
        }
    }

    /**
     * Sets a facet as a Monster Facet.
     * @param {number} facetId - The ID of the facet.
     * @param {boolean} [isMonster=true] - Whether it is a monster facet.
     */
    setMonsterFacet(facetId, isMonster = true) {
        const stat = this.Stats.find(s => s.Facet === facetId || s.Antifacet === facetId);
        if (stat) {
            if (stat.Facet === facetId) stat.IsMonsterFacet = isMonster;
            if (stat.Antifacet === facetId) stat.IsMonsterAntifacet = isMonster;
        }
    }

    /**
     * Gets all Monster Facets.
     * @returns {object[]} Array of stat objects that are Monster Facets.
     */
    getMonsterFacets() {
        const monsters = [];
        this.Stats.forEach(s => {
            if (s.IsMonsterFacet) monsters.push({ id: s.Facet, boon: s.Facet_Boon });
            if (s.IsMonsterAntifacet) monsters.push({ id: s.Antifacet, boon: s.Antifacet_Boon });
        });
        return monsters;
    }

    /**
     * Creates a species-specific statblock with randomized pairings and Yin/Yang balance.
     * Ensures that Yin facets are paired with Yang facets, but the specific pairings are randomized
     * based on the species name seed.
     * @param {string} speciesName - The name of the species to seed the generation.
     * @param {number} [scale=0] - The scale of the character.
     * @returns {object} The generated statblock.
     */
    static createSpeciesStatblock(speciesName, scale = 0) {
        const seed = speciesName;
        const prng = T13NE_PRNG.create(seed);
        const allFacets = Array.from({ length: 24 }, (_, i) => i); // Get all 24 facets (0-23)
        for (let i = allFacets.length - 1; i > 0; i--) { // Shuffle all facets deterministically
            const j = prng.nextInt(0, i);
            [allFacets[i], allFacets[j]] = [allFacets[j], allFacets[i]];
        }

        const stats = [];
        for (let i = 0; i < 12; i++) {
            const f1 = allFacets[i * 2]; // Pair facets from the shuffled list
            const f2 = allFacets[i * 2 + 1];
            const b1 = prng.nextInt(8, 18);
            const b2 = prng.nextInt(8, 18);

            stats.push({
                'Facet': f1, 'Facet_Boon': b1, 'Facet_Sway': 0, 'Facet_Mutation_Matrix': 0, 'Joined': true,
                'Antifacet': f2, 'Antifacet_Boon': b2, 'AntiFacet_Sway': 0, 'Antifacet_Mutation_Matrix': 0
            });
        }

        return {
            'Name': speciesName,
            'Hex': [prng.nextInt(0, 63), prng.nextInt(0, 63)],
            'Scale': scale,
            'Stats': stats
        };
    }
}

export default T13Tapestry;
