import Logger from "@/src/t13ne/core/Logger.js";
import T13Boons from '@/src/t13ne/modules/mechanics/t13ne-boon.js';
import T13Dice from '@/src/t13ne/modules/mechanics/t13ne-dice.js';

/**
 * Module for handling T13NE Resources, Sway Caches, and Economic Actions.
 * Implements rules for "Modelling Resources".
 */
class T13NE_Resources {
    constructor() {
        this.initialized = false;
    }

    async initialize(t13ne) {
        this.initialized = true;
        this.t13ne = t13ne;

        try {
            const Codex = t13ne.getModule('Codex');
            if (Codex) {
                this.pcTypes = await Codex.getData('characters', 'pcType.json') || [];
                this.chiClasses = await Codex.getData('characters', 'chiClass.json') || [];
            }
        } catch (error) {
            Logger.error(`T13NE_Resources: Failed to load PC types/Chi classes: ${error}`);
        }

        Logger.message('T13NE_Resources: Initialized.');
    }

    /**
     * Resolves a "Standard" gain amount for a character based on their type.
     * @param {object} character
     * @param {string} type - 'Chi', 'Yin', 'Yang', etc.
     * @returns {number|object} The resolved amount or a dice/draw instruction.
     */
    async resolveStandardGain(character, type) {
        if (type !== 'Chi' && type !== 'Yin' && type !== 'Yang') {
            return 1; // Default for others like Stress
        }

        const pcType = character.pcType || character.Type || 'Extra';
        const chiClass = character.chiClass || character.Chi_Class || 'NPC';

        // 1. Check Chi Class first as it's more specific to Chi Gains
        const classData = this.chiClasses.find(c => c.Chi_Class === chiClass);
        if (classData && type === 'Chi') {
            const gain = classData['Chi Gain'];
            if (gain === '1') return 1;
            if (gain === 'Personality Draw') return { action: 'Draw', source: 'Personality' };
            if (gain === 'Rolled Personality Die / Personality Score') return { action: 'Roll', source: 'Personality' };
            if (gain === 'Personality Die as Yarn / Personality Boon') return { action: 'Boon', source: 'Personality' };
        }

        // 2. Fallback to PC Type
        const typeData = this.pcTypes.find(t => t.Type === pcType);
        if (typeData) {
            const gain = typeData.Gain;
            if (gain && gain.includes('Boon Chi')) return { action: 'Boon', source: 'Personality' };
            if (gain === '1 Chi') return 1;
        }

        return 1; // absolute fallback
    }

    /**
     * Creates a Sway Cache object (e.g., "Wallet of Cash").
     * @param {string} proficiencyName - Name of the proficiency (e.g., "Wallet").
     * @param {string} facetName - The Facet (e.g., "Burden").
     * @param {number} score - The amount of Sway stored.
     * @returns {object} The Sway Cache object.
     */
    createSwayCache(proficiencyName, facetName, score) {
        return {
            type: 'SwayCache',
            proficiency: proficiencyName,
            facet: facetName,
            score: score
        };
    }

    /**
     * Merges multiple Sway Caches of the same Facet into one.
     * @param {Array<object>} caches - Array of Sway Cache objects.
     * @param {string} newName - Name for the new combined proficiency.
     * @returns {object|null} The merged Sway Cache or null if invalid.
     */
    mergeSwayCaches(caches, newName) {
        if (!caches || caches.length < 2) return null;
        const firstFacet = caches[0].facet;
        let totalScore = 0;

        for (const cache of caches) {
            if (cache.facet !== firstFacet) {
                Logger.warn('T13NE_Resources: Cannot merge Sway Caches of different Facets.');
                return null;
            }
            totalScore += cache.score;
        }

        return this.createSwayCache(newName, firstFacet, totalScore);
    }

    /**
     * Performs a Harvest action to gather Sway.
     * @param {object} character - The character performing the harvest.
     * @param {string} resourceName - The Facet or Resource name (e.g., 'Burden', 'Chi').
     * @param {string} method - 'Simple', 'Roll', or 'Card'.
     * @param {object} [options] - Options like 'card' for Card method, or 'costFacet' for Roll method.
     * @returns {Promise<number>} The amount of Sway harvested.
     */
    async harvest(character, resourceName, method = 'Simple', options = {}) {
        let amount = 0;

        // Determine the correct key for the SwayAccount
        // If it's a special resource (Chi, Yarn, etc) use as is, otherwise assume it's a Facet and prepend Sway:
        const specialResources = ['Chi', 'Yarn', 'Twists', 'Twist'];
        let accountKey = resourceName;
        if (!specialResources.includes(resourceName) && !resourceName.startsWith('Sway:')) {
            accountKey = `Sway:${resourceName}`;
        }

        if (method === 'Simple') {
            amount = 1;
        } else if (method === 'Roll') {
            // Pay 1 Point of Facet Sway from a suited Facet
            const costFacet = options.costFacet || (accountKey.startsWith('Sway:') ? accountKey.split(':')[1] : 'Burden');
            if (character.swayAccount && character.swayAccount.spend(`Sway:${costFacet}`, 1)) {
                // Roll Facet Die.
                let boon = 13; // Default
                if (character.facetweb && character.facetweb.getFacetBoon) {
                    // If harvesting Chi, we might use the costFacet's boon, or a default
                    const facetToRoll = accountKey.startsWith('Sway:') ? accountKey.split(':')[1] : costFacet;
                    const facetData = await character.facetweb.getFacetBoon(facetToRoll);
                    if (facetData) boon = facetData.Boon;
                }

                // Get dice string from Boon and roll it
                const diceStr = await T13Boons.getDiceForBoon(boon);
                // Simple parser/roller if T13Dice doesn't support string parsing directly
                // Assuming T13Dice has a roll method or we implement basic parsing here
                // For now, simple placeholder logic based on boon:
                amount = Math.floor(boon / 2) + T13Dice.RNG(1, 6);
            } else {
                Logger.warn(`T13NE_Resources: Character cannot afford harvest cost in ${costFacet}.`);
                return 0;
            }
        } else if (method === 'Card') {
            if (options.card && character.swayAccount) {
                // Pay 2, 4, or 5 points of suited Facet Sway
                const costFacet = options.costFacet || (accountKey.startsWith('Sway:') ? accountKey.split(':')[1] : 'Burden');
                const cost = options.cost || 4; // Default Intrepid
                if (character.swayAccount.spend(`Sway:${costFacet}`, cost)) {
                    amount = parseInt(options.card.pips || 0) * 2;
                }
            }
        }

        if (amount > 0 && character.swayAccount) {
            character.swayAccount.add(accountKey, amount);
            Logger.message(`T13NE_Resources: ${character.name} harvested ${amount} ${resourceName} (${accountKey}).`);
        }

        return amount;
    }

    /**
     * Makes a payment from the character's Sway Account.
     * @param {object} character 
     * @param {string} resourceType - e.g., 'Sway:Burden'.
     * @param {number} amount 
     * @returns {boolean}
     */
    makePayment(character, resourceType, amount) {
        if (!character.swayAccount) return false;
        return character.swayAccount.spend(resourceType, amount);
    }

    /**
     * Converts Sway between types based on T13 rules (Mercurial, FÃ¦ry, Transferable, Fixed).
     * @param {object} character 
     * @param {string} fromType - e.g. 'Sway:Wealth', 'Chi', 'Yang'
     * @param {string} toType - e.g. 'Sway:Health', 'Chi', 'Yin'
     * @param {number} amount - Amount of source sway to convert.
     * @returns {Promise<number>} Amount gained.
     */
    async convertSway(character, fromType, toType, amount) {
        if (!character.swayAccount) return 0;

        const SwayModule = this.t13ne.getModule('Sway');
        const FacetsModule = this.t13ne.getModule('Facets');

        // Helper to get Facet Name from Sway Type (e.g. 'Sway:Wealth' -> 'Burden')
        const getFacetName = (type) => {
            if (type.startsWith('Sway:')) return type.split(':')[1];
            // Check if it's a raw sway name like 'Wealth'
            const facet = SwayModule.getFacetFromSway(type);
            return facet || type;
        };

        const fromFacetName = getFacetName(fromType);
        const toFacetName = getFacetName(toType);

        const fromTao = await FacetsModule.getTao(fromFacetName);
        const toTao = await FacetsModule.getTao(toFacetName);

        // Determine Conversion Mode
        const mode = character.conversionMode || 'Transferable';
        const potency = character.potency || 'Intrepid'; // Banal, Intrepid, Bold

        let resultAmount = 0;
        let cost = 0;

        // Logic based on Mode
        if (mode === 'Mercurial') {
            // Free conversion between everything
            resultAmount = amount;
        } else if (mode === 'FÃ¦ry') {
            // Same Tao is free
            if (fromTao === toTao && fromTao !== 'Balance') {
                resultAmount = amount;
            } else {
                // Cross Tao requires Chi intermediate (Fixed rules apply effectively)
                if (toType === 'Chi') {
                    // Facet -> Chi
                    resultAmount = this._calculateChiFromSway(amount, potency);
                } else if (fromType === 'Chi') {
                    // Chi -> Facet
                    resultAmount = this._calculateSwayFromChi(amount, potency);
                } else {
                    return 0; // Cannot convert directly
                }
            }
        } else if (mode === 'Transferable') {
            // Facet -> Tao (matching) costs 1
            if (toType === fromTao) { // e.g. Sway:Wealth -> Yin
                resultAmount = Math.max(0, amount - 1);
            } else if (fromType === toType) { // e.g. Yin -> Sway:Wealth
                return 0;
            } else if (toType === 'Chi' || fromType === 'Chi') {
                // Fallback to Fixed rules for Chi interactions if needed
                if (toType === 'Chi') resultAmount = this._calculateChiFromSway(amount, potency);
                else if (fromType === 'Chi') resultAmount = this._calculateSwayFromChi(amount, potency);
            }
        } else { // Fixed
            // Facet <-> Chi only
            if (toType === 'Chi') {
                resultAmount = this._calculateChiFromSway(amount, potency);
            } else if (fromType === 'Chi') {
                resultAmount = this._calculateSwayFromChi(amount, potency);
            } else {
                return 0; // No direct Facet-Facet or Facet-Tao
            }
        }

        if (resultAmount > 0) {
            if (character.swayAccount.spend(fromType, amount)) {
                character.swayAccount.add(toType, resultAmount);
                Logger.message(`T13NE_Resources: Converted ${amount} ${fromType} to ${resultAmount} ${toType} (${mode}/${potency}).`);
                return resultAmount;
            }
        }

        return 0;
    }

    _calculateChiFromSway(amount, potency) {
        if (potency === 'Bold') return amount;
        if (potency === 'Intrepid') return Math.floor(amount / 2);
        if (potency === 'Banal') return T13Boons.getBoonReduced(amount); // Value -> Boon
        return 0;
    }

    _calculateSwayFromChi(amount, potency) {
        if (potency === 'Bold') return amount;
        if (potency === 'Intrepid') return amount * 2;
        if (potency === 'Banal') return T13Boons.getBoonValue(amount); // Boon -> Value
        return 0;
    }

    /**
     * Trades Sway between two characters.
     */
    trade(charA, charB, offerA, offerB) {
        if (!charA.swayAccount || !charB.swayAccount) return false;

        if (charA.swayAccount.getBalance(offerA.type) < offerA.amount) return false;
        if (charB.swayAccount.getBalance(offerB.type) < offerB.amount) return false;

        charA.swayAccount.spend(offerA.type, offerA.amount);
        charB.swayAccount.spend(offerB.type, offerB.amount);

        charA.swayAccount.add(offerB.type, offerB.amount);
        charB.swayAccount.add(offerA.type, offerA.amount);

        Logger.message(`T13NE_Resources: Trade completed between ${charA.name} and ${charB.name}.`);
        return true;
    }
}

export default new T13NE_Resources();







