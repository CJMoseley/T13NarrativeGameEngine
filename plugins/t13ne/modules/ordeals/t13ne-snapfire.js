import { Ordeal, OrdealRound } from './t13ne-ordeals.js';
import T13NECardsAPI from '../t13ne-cards-api.js';
import Logger from '@plugins/t13ne/core/Logger.js';
import T13NE from '../../T13NE.js';

/**
 * Represents a Snap-fire Ordeal Round.
 * Extends OrdealRound to include the Snap-fire card and bidding logic.
 */
class SnapfireRound extends OrdealRound {
    constructor(number, stakesName) {
        super(number, stakesName);
        this.snapfireCard = null;
        this.bids = [];
        this.winner = null;
    }

    /**
     * Starts the round by dealing the Wild Pool and the Snap-fire Card.
     */
    start() {
        super.start();
        if (T13NECardsAPI.isInitialized) {
            const draw = T13NECardsAPI.deck.draw(1);
            if (draw.length > 0) {
                this.snapfireCard = draw[0];
                Logger.message(`SnapfireRound ${this.number}: Snap-fire Card is ${this.snapfireCard.name}.`);
            }
        }
    }

    /**
     * Places a bid for the Snap-fire card.
     * @param {object} character - The character bidding.
     * @param {number} amount - The bid amount (e.g., Pips, Sway).
     * @param {string} type - The type of bid (e.g., 'Pips', 'Sway').
     */
    placeBid(character, amount, type = 'Pips') {
        this.bids.push({ character, amount, type });
        Logger.message(`SnapfireRound ${this.number}: ${character.name} bids ${amount} ${type}.`);
    }

    /**
     * Resolves the bidding to find the winner who gets the Full-Action.
     * @returns {object|null} The winning bid object.
     */
    resolveBidding() {
        if (this.bids.length === 0) return null;

        // Simple resolution: highest amount wins. 
        // In a full implementation, this would handle different bid types and tie-breaking.
        this.bids.sort((a, b) => b.amount - a.amount);
        this.winner = this.bids[0];
        
        Logger.message(`SnapfireRound ${this.number}: ${this.winner.character.name} wins the Snap-fire with ${this.winner.amount} ${this.winner.type}.`);
        return this.winner;
    }

    /**
     * Allows a character to interrupt and claim the Snap-fire card with a match.
     * @param {object} character 
     * @param {object} matchingCard 
     * @returns {boolean}
     */
    interrupt(character, matchingCard) {
        if (!this.snapfireCard) return false;
        
        // Check Pips match
        const snapPips = parseInt(this.snapfireCard.pips) || 0;
        const matchPips = parseInt(matchingCard.pips) || 0;

        if (snapPips === matchPips) {
            this.winner = { character, amount: 0, type: 'Interrupt' };
            Logger.message(`SnapfireRound ${this.number}: ${character.name} interrupts with ${matchingCard.name}!`);
            return true;
        }
        return false;
    }
}

/**
 * Module for handling Snap-fire Ordeals.
 */
class T13NE_Snapfire extends Ordeal {
    constructor(config) {
        super({ ...config, type: 'Snapfire' });
    }

    /**
     * Starts a new Snap-fire Round.
     */
    nextRound() {
        if (this.rounds.length > 0) {
            this.rounds[this.rounds.length - 1].end();
        }
        
        this.currentRoundIndex++;
        const round = new SnapfireRound(this.currentRoundIndex, this.stakes);
        round.start();
        this.rounds.push(round);
        
        Logger.message(`SnapfireOrdeal ${this.id}: Started Round ${this.currentRoundIndex}.`);
        return round;
    }
}

export default T13NE_Snapfire;