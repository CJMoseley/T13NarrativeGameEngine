import Logger from '@/src/t13ne/core/Logger.js';
import CodexLoader from '@/src/t13ne/modules/codex/CodexLoader.js';
import T13Boons from '@/src/t13ne/modules/mechanics/t13ne-boon.js';
import T13Dice from '@/src/t13ne/modules/mechanics/t13ne-dice.js';

/**
 * Module for handling T13NE Stress, Strain, and Shock systems.
 */
class T13NE_Stress {
    constructor() {
        this.shockResults = [];
        this.initialized = false;
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;

        // Load Shock Dice Results
        this.shockResults = await CodexLoader.getData('ordeals', 'shockDice.json') || [];
        if (!this.shockResults.length) {
            // Fallback defaults if file missing
            this.shockResults = [
                { Roll: 1, Result: 'Stunned' }, { Roll: 2, Result: 'Stunned' },
                { Roll: 3, Result: 'Distress' }, { Roll: 4, Result: 'Distress' },
                { Roll: 5, Result: 'Trauma' }, { Roll: 6, Result: 'Trauma' }
            ];
        }

        this.initialized = true;
        Logger.message('T13NE_Stress: Initialized.');
    }

    /**
     * Helper to parse dice string and get limits.
     * @param {string} diceStr 
     */
    parseDiceLimits(diceStr) {
        // Default fallback
        let max = 6;
        let min = 1;

        if (diceStr) {
            // Match XdY+Z or XdY-Z or XdY
            const match = diceStr.match(/(\d+)d(\d+)(?:([+-])(\d+))?/);
            if (match) {
                const num = parseInt(match[1], 10);
                const sides = parseInt(match[2], 10);
                const op = match[3] || '+';
                const mod = match[4] ? parseInt(match[4], 10) : 0;

                const modifier = op === '-' ? -mod : mod;

                max = (num * sides) + modifier;
                min = num + modifier;
            }
        }

        return {
            maxStress: Math.max(1, max),
            stressStrainLimit: Math.max(1, min + 1)
        };
    }

    /**
     * Ensures the die state exists on the character.
     */
    async _ensureDieState(character, dieId, boon) {
        if (!character.stressState) character.stressState = {};

        if (!character.stressState[dieId]) {
            // Use pre-calculated limits if available, otherwise calculate on the fly
            const limits = character.stressLimits?.dice[dieId] || this.parseDiceLimits(await T13Boons.getDiceForBoon(boon));

            character.stressState[dieId] = {
                stress: 0,
                strains: 0,
                shocks: 0,
                maxStress: limits.maxStress,
                stressStrainLimit: limits.stressStrainLimit
            };
        }
        return character.stressState[dieId];
    }

    /**
     * Adds stress to a character's die.
     * @param {object} character - The character object.
     * @param {string} dieId - The ID of the die (e.g., 'Facet:Awe').
     * @param {number} amount - Amount of stress to add.
     * @param {number} boon - The boon value of the die (needed for limits).
     */
    async addStress(character, dieId, amount, boon) {
        const state = await this._ensureDieState(character, dieId, boon);

        // If already overstressed (full), convert all new stress to shock
        if (state.stress >= state.maxStress) {
            this.addShock(character, dieId, amount);
            return;
        }

        state.stress += amount;

        // Check for overflow
        if (state.stress > state.maxStress) {
            const overflow = state.stress - state.maxStress;
            state.stress = state.maxStress;
            this.addShock(character, dieId, overflow);
        }

        Logger.message(`T13NE_Stress: ${character.name} added ${amount} stress to ${dieId}. (${state.stress}/${state.maxStress})`);
    }

    /**
     * Relieves stress from a character's die.
     */
    async relieveStress(character, dieId, amount) {
        if (!character.stressState || !character.stressState[dieId]) return;

        const state = character.stressState[dieId];
        state.stress = Math.max(0, state.stress - amount);
        Logger.message(`T13NE_Stress: ${character.name} relieved ${amount} stress from ${dieId}. (${state.stress}/${state.maxStress})`);
    }

    /**
     * Adds shock to a character's die.
     */
    addShock(character, dieId, amount) {
        if (!character.stressState) character.stressState = {};
        if (!character.stressState[dieId]) {
            // Should ideally initialize, but for shock we can just track it if we don't have limits yet
            character.stressState[dieId] = { stress: 0, strains: 0, shocks: 0, maxStress: 10, stressStrainLimit: 2 };
        }

        const state = character.stressState[dieId];
        state.shocks += amount;
        Logger.message(`T13NE_Stress: ${character.name} gained ${amount} SHOCK on ${dieId}. Total: ${state.shocks}`);
    }

    /**
     * Relieves shock from a character's die.
     */
    relieveShock(character, dieId, amount) {
        if (!character.stressState || !character.stressState[dieId]) return;
        const state = character.stressState[dieId];
        state.shocks = Math.max(0, state.shocks - amount);
        Logger.message(`T13NE_Stress: ${character.name} relieved ${amount} shock from ${dieId}. Total: ${state.shocks}`);
    }

    /**
     * Rolls the Shock Pool for a specific die.
     * @param {object} character 
     * @param {string} dieId 
     * @returns {Promise<Array>} Results
     */
    async rollShock(character, dieId) {
        const state = character.stressState?.[dieId];
        if (!state || state.shocks <= 0) return { success: false, message: "No shocks to roll." };

        const results = [];
        const CardsAPI = this.t13ne.getModule('CardsAPI');

        for (let i = 0; i < state.shocks; i++) {
            const roll = T13Dice.RNG(1, 6);
            const resultDef = this.shockResults.find(r => r.Roll == roll) || { Result: 'Stunned' };

            let outcome = {
                roll,
                result: resultDef.Result,
                description: resultDef.Description || resultDef.Result
            };

            // Handle Distress and Trauma results by drawing a card
            if ((resultDef.Result === 'Distress' || resultDef.Result === 'Trauma') && CardsAPI) {
                const drawn = CardsAPI.deck.draw(1);
                if (drawn && drawn.length > 0) {
                    outcome.card = drawn[0];
                    outcome.cardText = CardsAPI.extractCardTextForAI(outcome.card);
                }
            }

            results.push(outcome);
        }

        // Shocks are negated by being rolled
        state.shocks = 0;

        Logger.message(`T13NE_Stress: ${character.name} rolled Shock Pool.`, results);
        return { success: true, results };
    }

    /**
     * Applies a Trauma to a character.
     * @param {object} character 
     * @param {object} card - The card causing the trauma.
     */
    applyTrauma(character, card) {
        if (!character.traumas) character.traumas = [];

        // Logic to check for available slots (Annexes/Incarna) could go here.
        // For now, we append to the list.
        const trauma = {
            id: `trauma_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            card: card,
            name: card.Trauma?.Type || 'Trauma',
            description: card.Trauma?.Description || 'A severe trauma.',
            rules: card.Trauma?.Rules || '',
            date: Date.now()
        };

        character.traumas.push(trauma);
        Logger.message(`T13NE_Stress: Applied Trauma '${trauma.name}' to ${character.name}.`);
        return trauma;
    }

    /**
     * Applies a Distress effect (Stress Effect) to a character.
     * @param {object} character 
     * @param {object} card 
     */
    applyDistress(character, card) {
        // Distress cards fill a Trauma slot unless replaced by actual Trauma.
        // They act as temporary Traumas.
        const distress = this.applyTrauma(character, card);
        distress.type = 'Distress'; // Mark as Distress specifically
        distress.name = card.Stress?.Type || 'Distress';
        distress.description = card.Stress?.Description || 'A distress effect.';
        return distress;
    }

    /**
     * Relieves all Stress, Strain, and Shock from a character.
     * @param {object} character 
     */
    async relieveAllStress(character) {
        if (!character.stressState) return;
        for (const dieId in character.stressState) {
            const state = character.stressState[dieId];
            state.stress = 0;
            state.strains = 0;
            state.shocks = 0;
        }
        Logger.message(`T13NE_Stress: ${character.name} relieved all Stress, Strain, and Shock.`);
    }

    /**
     * Applies a Stress Card effect. Character must pay stress or take a Trauma.
     * @param {object} character 
     * @param {object} card 
     * @returns {Promise<object>}
     */
    async applyStressCard(character, card) {
        if (!card || !card.pips) return { success: false, message: "Invalid card for Stress effect." };

        const cost = parseInt(card.pips, 10);
        let canPay = false;

        // Check if character has enough total stress to pay
        let totalStress = 0;
        if (character.stressState) {
            totalStress = Object.values(character.stressState).reduce((sum, die) => sum + die.stress, 0);
        }

        if (totalStress >= cost) {
            canPay = true;
            // Deduct stress. Simple logic: from highest pool first.
            let remainingCost = cost;
            const sortedDice = Object.entries(character.stressState).sort((a, b) => b[1].stress - a[1].stress);

            for (const [dieId, state] of sortedDice) {
                if (remainingCost <= 0) break;
                const toSpend = Math.min(remainingCost, state.stress);
                state.stress -= toSpend;
                remainingCost -= toSpend;
            }
            return { success: true, message: `Paid ${cost} Stress to accept the Stress effect from ${card.name}.` };
        }

        // If can't pay, apply Trauma
        if (!canPay) {
            this.applyTrauma(character, card);
            return { success: true, message: `Could not pay ${cost} Stress. Gained a Trauma from ${card.name}.` };
        }
    }

    /**
     * Calculates the total Stress and Strain limits for a character based on all their Facets and Annexes.
     * @param {object} character - The character object.
     * @returns {Promise<object>} An object with totalMaxStress, totalStressStrainLimit, and a breakdown by die.
     */
    async calculateTotalLimits(character) {
        let totalMaxStress = 0;
        let totalStressStrainLimit = 0;
        const dice = {};

        if (!character) return { totalMaxStress, totalStressStrainLimit, dice };

        // 1. Process Facets from FacetWeb/Tapestry
        if (character.facetweb && character.facetweb.Stats) {
            const Facets = this.t13ne.getModule('Facets');
            for (const statPair of character.facetweb.Stats) {
                // Yang Facet
                const yangFacet = await Facets.getFacet(statPair.Facet);
                if (yangFacet) {
                    const boon = (statPair.Facet_Boon || 0) + (character.scaleModifier || 0);
                    const diceStr = await T13Boons.getDiceForBoon(boon);
                    const limits = this.parseDiceLimits(diceStr);
                    const dieId = `Facet:${yangFacet.FacetName}`;
                    dice[dieId] = { boon, dice: diceStr, ...limits };
                    totalMaxStress += limits.maxStress;
                    totalStressStrainLimit += limits.stressStrainLimit;
                }

                // Yin Facet
                const yinFacet = await Facets.getFacet(statPair.Antifacet);
                if (yinFacet) {
                    const boon = (statPair.Antifacet_Boon || 0) + (character.scaleModifier || 0);
                    const diceStr = await T13Boons.getDiceForBoon(boon);
                    const limits = this.parseDiceLimits(diceStr);
                    const dieId = `Facet:${yinFacet.FacetName}`;
                    dice[dieId] = { boon, dice: diceStr, ...limits };
                    totalMaxStress += limits.maxStress;
                    totalStressStrainLimit += limits.stressStrainLimit;
                }
            }
        }

        // 2. Process Annexes
        const allAnnexes = [character.masterAnnex, ...(character.subAnnexes || [])].filter(Boolean);
        for (const annex of allAnnexes) {
            const boon = await this._getAnnexBoon(annex, character);
            const diceStr = await T13Boons.getDiceForBoon(boon);
            const limits = this.parseDiceLimits(diceStr);
            const dieId = `Annex:${annex.name}`;
            dice[dieId] = { boon, dice: diceStr, ...limits };
            totalMaxStress += limits.maxStress;
            totalStressStrainLimit += limits.stressStrainLimit;
        }

        return { totalMaxStress, totalStressStrainLimit, dice };
    }

    /**
     * Helper to calculate the Boon of an Annex for a given character.
     * This is a complex calculation based on T13 rules.
     * @param {object} annex 
     * @param {object} character 
     * @returns {Promise<number>}
     */
    async _getAnnexBoon(annex, character) {
        if (annex.boon) return annex.boon; // For Lite Chars or pre-calculated

        if (!character.facetweb) return 13; // Fallback if char has no stats

        const T13 = this.t13ne;
        if (!T13) return 13;

        const profs = await annex.getProficiencyDetails();
        const associations = annex.knot.getAssociations();
        const processedProfs = new Set();
        let totalValue = 0;

        const addValueForProf = async (prof) => {
            if (!prof || processedProfs.has(prof.id)) return;
            const facetName = prof.tags?.facets?.[0];
            if (facetName) {
                const facetData = await character.facetweb.getFacetBoon(facetName);
                const boon = (facetData.Boon || 13) + (character.scaleModifier || 0);
                totalValue += T13Boons.getBoonValue(boon);
                processedProfs.add(prof.id);
            }
        };

        await addValueForProf(profs.find(p => associations.get(p.id) & T13.Knots.TIE.ROOT));
        await addValueForProf(profs.find(p => associations.get(p.id) & T13.Knots.TIE.CHANNEL));

        if (totalValue === 0) return 13; // Fallback for annexes without clear root/channel
        return T13Boons.getBoonReduced(totalValue);
    }

    /**
     * Resolves the result of a Strain Die roll.
     * @param {object} character 
     * @param {string} dieId 
     * @param {number} stressSpent 
     * @param {number} rollResult 
     */
    async resolveStrain(character, dieId, stressSpent, rollResult) {
        const state = character.stressState[dieId]; // Assume exists if we strained
        if (!state) return;

        if (rollResult < stressSpent) {
            // Gain 1 Strain (or Shock if fully strained)
            if (state.strains >= state.stressStrainLimit) {
                this.addShock(character, dieId, 1);
            } else {
                state.strains += 1;
                Logger.message(`T13NE_Stress: ${character.name} gained 1 Strain on ${dieId}.`);
            }
            // Relieve all spent stress
            this.relieveStress(character, dieId, stressSpent);
        } else {
            // Relieve stress down to limit
            const targetStress = state.stressStrainLimit;
            if (state.stress > targetStress) {
                state.stress = targetStress;
                Logger.message(`T13NE_Stress: ${character.name} relieved stress on ${dieId} down to limit ${targetStress}.`);
            }
        }
    }
}

export default new T13NE_Stress();




