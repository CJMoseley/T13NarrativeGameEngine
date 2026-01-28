import { Ordeal, OrdealRound } from './t13ne-ordeals.js';
import T13NECardsAPI from "@/src/t13ne/modules/mechanics/t13ne-cards-api.js";
import Logger from "@/src/t13ne/core/Logger.js";
import T13NE from '@/src/t13ne/T13NE.js';

/**
 * Represents a Yarn-Tangling Ordeal Round.
 */
class YarnTanglingRound extends OrdealRound {
    constructor(number, stakesName) {
        super(number, stakesName);
        this.pools = new Map(); // Character ID -> Array of Cards
        this.knockedOut = new Set(); // Set of Character IDs
    }

    /**
     * Initializes a character's Yarn-Tangle Pool.
     * @param {object} character 
     */
    initPool(character) {
        if (T13NECardsAPI.isInitialized) {
            const cards = T13NECardsAPI.deck.draw(3);
            this.pools.set(character.id, cards);
            Logger.message(`YarnTanglingRound: Dealt 3 cards to ${character.name}.`);
        }
    }

    /**
     * Character draws a card into their pool.
     * @param {object} character 
     */
    drawCard(character) {
        if (T13NECardsAPI.isInitialized) {
            const card = T13NECardsAPI.deck.draw(1)[0];
            if (card) {
                const pool = this.pools.get(character.id) || [];
                pool.push(card);
                this.pools.set(character.id, pool);
            }
        }
    }

    /**
     * Character discards a card from their pool.
     * @param {object} character 
     * @param {object} card 
     */
    discardCard(character, card) {
        const pool = this.pools.get(character.id);
        if (pool) {
            const index = pool.indexOf(card);
            if (index > -1) {
                pool.splice(index, 1);
                T13NECardsAPI.discard([card]);
            }
        }
    }

    /**
     * Checks if a character has won the round (Blitz).
     * @param {object} character 
     * @returns {boolean}
     */
    checkBlitz(character) {
        const pool = this.pools.get(character.id);
        if (!pool) return false;

        const Tests = T13NE.getModule('Tests');
        if (Tests && Tests.yarnTangleCheck) {
            return Tests.yarnTangleCheck(pool);
        }
        return false;
    }

    /**
     * Attempts to Knock-Out another character.
     * @param {object} challenger 
     * @param {object} defender 
     * @returns {object} Result of the knock-out attempt.
     */
    attemptKnockOut(challenger, defender) {
        const poolC = this.pools.get(challenger.id);
        const poolD = this.pools.get(defender.id);

        if (!poolC || !poolD) return { success: false, message: "Invalid participants." };
        if (this.knockedOut.has(challenger.id) || this.knockedOut.has(defender.id)) {
            return { success: false, message: "Participant already knocked out." };
        }

        // Helper to calculate pips
        const getPips = (pool) => pool.reduce((sum, c) => sum + (parseInt(c.pips) || 0), 0);
        const pipsC = getPips(poolC);
        const pipsD = getPips(poolD);

        // Check Bust (32+ pips)
        if (pipsC >= 32) {
            this.knockedOut.add(challenger.id);
            return { success: false, message: `${challenger.name} is Bust (${pipsC} pips)!`, winner: defender };
        }
        if (pipsD >= 32) {
            this.knockedOut.add(defender.id);
            return { success: true, message: `${defender.name} is Bust (${pipsD} pips)!`, winner: challenger };
        }

        // Compare Suits count
        const getMaxSuited = (pool) => {
            const counts = {};
            pool.forEach(c => { counts[c.suit] = (counts[c.suit] || 0) + 1; });
            return Math.max(...Object.values(counts));
        };

        const suitedC = getMaxSuited(poolC);
        const suitedD = getMaxSuited(poolD);

        let winner = defender;
        let loser = challenger;

        if (suitedC > suitedD) {
            winner = challenger;
            loser = defender;
        } else if (suitedC === suitedD && pipsC > pipsD) {
            winner = challenger;
            loser = defender;
        }

        this.knockedOut.add(loser.id);
        return { success: true, message: `${winner.name} knocks out ${loser.name}!`, winner: winner, loser: loser };
    }
}

/**
 * Module for handling Yarn-Tangling Ordeals.
 */
class T13NE_YarnTangling extends Ordeal {
    constructor(config) {
        super({ ...config, type: 'YarnTangling', stakes: 'Paradoxical' });
        this.suitWins = new Map(); // Character ID -> Set of Suits won
    }

    nextRound() {
        if (this.rounds.length > 0) {
            this.rounds[this.rounds.length - 1].end();
        }

        this.currentRoundIndex++;
        const round = new YarnTanglingRound(this.currentRoundIndex, this.stakes);
        this.rounds.push(round);

        Logger.message(`YarnTanglingOrdeal ${this.id}: Started Round ${this.currentRoundIndex}.`);
        return round;
    }

    /**
     * Records a win for a character in a specific suit.
     * @param {object} character 
     * @param {string} suit 
     */
    recordWin(character, suit) {
        if (!this.suitWins.has(character.id)) {
            this.suitWins.set(character.id, new Set());
        }
        this.suitWins.get(character.id).add(suit);

        if (this.suitWins.get(character.id).size >= 4) {
            this.completeOrdeal();
            Logger.message(`YarnTanglingOrdeal ${this.id}: ${character.name} wins the Ordeal!`);
        }
    }
}

export default T13NE_YarnTangling;





