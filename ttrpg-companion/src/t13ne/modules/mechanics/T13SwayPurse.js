// T13SwayPurse.js

/**
 * A simple data object to hold multiple types and amounts of sway for a single transaction.
 */
class T13SwayPurse {
    /**
     * @param {object} initialSways - An object with sway types as keys and amounts as values.
     */
    constructor(initialSways = {}) {
        this.sways = new Map(Object.entries(initialSways));
    }

    /**
     * Adds a sway type and amount to the purse.
     * @param {string} type - The type of sway.
     * @param {number} amount - The amount.
     */
    add(type, amount) {
        this.sways.set(type, (this.sways.get(type) || 0) + amount);
    }

    /**
     * Gets the amount of a specific sway type.
     * @param {string} type - The type of sway.
     * @returns {number}
     */
    get(type) {
        return this.sways.get(type) || 0;
    }

    /**
     * Returns all sways in the purse as an object.
     * @returns {object}
     */
    getAll() {
        return Object.fromEntries(this.sways);
    }
}

export default T13SwayPurse;





