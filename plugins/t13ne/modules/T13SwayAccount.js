// T13SwayAccount.js
import T13NE_Sway from '../modules/t13ne-sway.js';
import Logger from '@plugins/t13ne/core/Logger.js';
import T13SwayPurse from '../modules/T13SwayPurse.js';
import T13NE from '../T13NE.js';

/**
 * Manages multiple "flavors" of sway for a character or item.
 */
class T13SwayAccount {
    /**
     * @param {object} initialBalances - An object with sway types as keys and amounts as values.
     * @param {string} conversionType - The conversion type permission for this account.
     */
    constructor(initialBalances = {}, conversionType = 'Fixed') {
        this.balances = new Map(Object.entries(initialBalances));
        this.conversionType = conversionType;
    }

    add(type, amount) {
        if (amount <= 0) return;
        this.balances.set(type, (this.balances.get(type) || 0) + amount);
    }

    spend(type, amount) {
        if (amount <= 0) return true;
        const currentBalance = this.balances.get(type) || 0;
        if (currentBalance >= amount) {
            this.balances.set(type, currentBalance - amount);
            return true;
        }
        return false;
    }

    getBalance(type) {
        return this.balances.get(type) || 0;
    }

    getAllBalances() {
        return Object.fromEntries(this.balances);
    }

    /**
     * Combines two types of sway to create Chi.
     * @param {string} type1 - The first sway type.
     * @param {number} amount1 - The amount of the first sway.
     * @param {string} type2 - The second sway type.
     * @param {number} amount2 - The amount of the second sway.
     * @returns {boolean} - True if the combination was successful.
     */
    combineToChi(type1, amount1, type2, amount2) {
        if (this.getBalance(type1) < amount1 || this.getBalance(type2) < amount2) {
            return false; // Not enough sway to combine
        }

        const purse = new T13SwayPurse({ [type1]: amount1, [type2]: amount2 });

        const potency1 = T13NE_Sway.getPotencyForBoon(T13NE.getModule('Sway').getTapestry().getFacetBoon(type1.split(':')[1]));
        const potency2 = T13NE_Sway.getPotencyForBoon(T13NE.getModule('Sway').getTapestry().getFacetBoon(type2.split(':')[1]));

        const chiValue1 = T13NE_Sway.convert(potency1.toLowerCase(), 'chi', purse.get(type1));
        const chiValue2 = T13NE_Sway.convert(potency2.toLowerCase(), 'chi', purse.get(type2));

        const totalChi = Math.floor(chiValue1 + chiValue2);

        if (this.spend(type1, amount1) && this.spend(type2, amount2)) {
            this.add('Chi', totalChi);
            return true;
        }

        // If spend fails, refund the first spend
        this.add(type1, amount1);
        return false;
    }

    /**
     * Converts one Facet Sway type to another.
     * @param {string} fromSway - The starting Facet Sway type.
     * @param {string} toSway - The target Facet Sway type.
     * @param {number} amount - The amount to convert.
     * @returns {boolean} - True if the conversion was successful.
     */
    async convertSwayType(fromSway, toSway, amount) {
        if (this.conversionType === 'Fixed') {
            Logger.error('Sway conversion is Fixed for this account.');
            return false;
        }
        if (this.getBalance(fromSway) < amount) {
            return false; // Not enough sway
        }

        const fromFacet = fromSway.split(':')[1];
        const toFacet = toSway.split(':')[1];
        const fromTao = await T13NE.getModule('Sway').getTapestry().getFacetTao(fromFacet);
        const toTao = await T13NE.getModule('Sway').getTapestry().getFacetTao(toFacet);

        if (this.conversionType === 'Færy' && fromTao !== toTao) {
            Logger.error('Færy conversion requires same Tao.');
            return false;
        }

        const cost = 1; // For Transferable, Færy, and Mercurial
        const netAmount = amount - cost;

        if (netAmount <= 0) {
            return false;
        }

        if (this.spend(fromSway, amount)) {
            this.add(toSway, netAmount);
            return true;
        }
        return false;
    }
}

export default T13SwayAccount;
