import CodexLoader from '../modules/CodexLoader.js';
import Logger from '@/js/core/Logger.js';

/**
 * Module for handling T13NE Pacts, including data loading and membership management.
 */
class T13NE_Pacts {
    constructor() {
        this.pactAnnexTypes = [];
        this.pactMemberships = [];
        this.initialized = false;
    }

    /**
     * Initializes the Pacts module by loading data from the codex.
     */
    async initialize() {
        if (this.initialized) return;
        try {
            this.pactAnnexTypes = await CodexLoader.getData('pactAnnexes');
            this.pactMemberships = await CodexLoader.getData('pactMemberships');
            this.initialized = true;
            Logger.message('T13NE_Pacts: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_Pacts: Initialization failed: ${error}`);
        }
    }

    /**
     * Returns all loaded pact annex types.
     * @returns {Array}
     */
    getPactAnnexTypes() {
        return this.pactAnnexTypes || [];
    }

    /**
     * Returns all loaded pact memberships.
     * @returns {Array}
     */
    getPactMemberships() {
        return this.pactMemberships || [];
    }

    /**
     * Retrieves a specific pact membership type by name.
     * @param {string} type - The membership type name (e.g., 'Belonging').
     * @returns {object|null}
     */
    getPactMembership(type) {
        if (!this.pactMemberships) return null;
        return this.pactMemberships.find(m => m.Type === type) || null;
    }

    /**
     * Retrieves a specific pact annex type by name.
     * @param {string} type - The pact type name (e.g., 'Guild').
     * @returns {object|null}
     */
    getPactType(type) {
        if (!this.pactAnnexTypes) return null;
        return this.pactAnnexTypes.find(p => p.Type === type) || null;
    }

    /**
     * Adds a character to a pact with a specific membership tier.
     * @param {object} character - The character object.
     * @param {object} pact - The pact object (Descendant).
     * @param {string} membershipType - The type of membership (e.g., 'Belonging').
     * @param {number} tier - The tier of membership.
     * @param {string} role - The role of the character in the pact.
     * @returns {boolean} True if successful.
     */
    joinPact(character, pact, membershipType = 'Belonging', tier = 0, role = '') {
        if (!character || !pact) {
            Logger.warn('T13NE_Pacts: Invalid character or pact for joinPact.');
            return false;
        }

        // Ensure character has pacts array
        if (!character.pacts) character.pacts = [];

        // Find membership data for validation or rules
        const membershipData = this.getPactMembership(membershipType);

        // Update character's pact record
        const charPactRecord = {
            pactId: pact.id || pact.name,
            membership: membershipType,
            tier: tier,
            role: role,
            joinedAt: Date.now()
        };

        const existingIdx = character.pacts.findIndex(p => p.pactId === (pact.id || pact.name));
        if (existingIdx !== -1) {
            character.pacts[existingIdx] = charPactRecord;
        } else {
            character.pacts.push(charPactRecord);
        }

        // Update Pact entity's PactAnnex
        if (pact.masterAnnex && pact.masterAnnex.annexType === 'Pact') {
            pact.masterAnnex.addMember(character.id || character.name, membershipType, tier, role);
        }

        Logger.message(`T13NE_Pacts: ${character.name} joined ${pact.name} as ${membershipType} (Tier ${tier}).`);
        return true;
    }
}

export default new T13NE_Pacts();