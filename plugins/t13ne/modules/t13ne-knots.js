// Knots are combinations of threads that create everything else in the game.
// They are essentially bundles of proficiencies, texts, and other game elements.

import Logger from '@plugins/t13ne/core/Logger.js';
import T13NE_Sway from '../modules/t13ne-sway.js';
import T13Name from '../modules/t13ne-names.js';

/**
 * TIE constants for defining knot relationships using a bitmask.
 * These are based on the definitions in class-t13-ne-knots.php.
 */
export const TIE = {
    UNKNOTTED: 0,
    THREAD: 1 << 0,  // 1
    TEXT: 1 << 1,  // 2
    T13: 1 << 2,  // 4
    SECRET: 1 << 3,  // 8
    ROOT: 1 << 4,  // 16
    CHANNEL: 1 << 5,  // 32
    VALUE: 1 << 6,  // 64
    BOON: 1 << 7,  // 128
    BANE: 1 << 8,  // 256
    GNARL: 1 << 9,  // 512
    TANGLE: 1 << 10, // 1024
    UMBRAL: 1 << 11, // 2048
    NIMBED: 1 << 12, // 4096
    TRIGGER: 1 << 13, // 8192
    EDGE: 1 << 14, // 16384
    GLOW: 1 << 15, // 32768
    PERSONA: 1 << 16, // 65536
    CORE: 1 << 17, // 131072
    RESOLVED: 1 << 18, // 262144
    MONSTER: 1 << 19, // 524288
    SUCCESS: 1 << 20, // 1048576
    FAILURE: 1 << 21, // 2097152
    WOUND: 1 << 22, // 4194304
    CARD: 1 << 23, // 8388608
    LITE: 1 << 24, // 16777216
    CONFLICT: 1 << 25, // 33554432
    LINK: 1 << 26, // 67108864
    EVENT: 1 << 27, // 134217728
    HITCH: 1 << 28, // 268435456
    MEMBER: 1 << 29, // 536870912
    RESERVED: 1 << 30  // 1073741824
};

/**
 * The Knot class manages the associations between proficiency IDs (or other elements)
 * and their roles within the knot, defined by the TIE bitmask.
 */
export class Knot {
    #associations = new Map(); // profId -> mask

    constructor(initialData = []) {
        for (const item of initialData) {
            if (item && typeof item.profId !== 'undefined' && typeof item.knot !== 'undefined') {
                this.assign(item.profId, item.knot);
            }
        }
    }

    assign(profId, roleMask) {
        const current = this.#associations.get(profId) ?? 0;
        this.#associations.set(profId, current | roleMask);
    }

    untie(profId, roleMask) {
        if (!this.#associations.has(profId)) return;
        const current = this.#associations.get(profId);
        const updated = current & ~roleMask;

        if (updated === 0) {
            this.#associations.delete(profId);
        } else {
            this.#associations.set(profId, updated);
        }
    }

    get(profId) {
        return this.#associations.get(profId);
    }

    getTiedProficiencies() {
        return Array.from(this.#associations.keys());
    }

    getAssociations() {
        return new Map(this.#associations);
    }

    serialize() {
        return Array.from(this.#associations.entries());
    }

    static deserialize(data) {
        const knot = new Knot();
        knot.#associations = new Map(data);
        return knot;
    }
}

/**
 * KnotWork is an abstract base class for structures built from Knots, like Annexes and Hitches.
 */
class KnotWork {
    constructor(codexLoader, { name, description = '', knotData = [], proficiencyId = null, tags = {}, fullName = null, altName = null }) {
        if (!codexLoader) {
            throw new Error("A codexLoader instance is required to create KnotWork.");
        }
        this.codexLoader = codexLoader;

        const t13n = new T13Name(name);
        this.name = t13n.common;

        // Ensure fullName includes construction details (e.g., "Character: [Name]")
        let typePrefix = this.constructor.name.replace(/^T13(NE_)?/, '');
        if (typePrefix === 'Annex') typePrefix = this.annexType || 'Annex';

        const defaultFullName = `${typePrefix}: ${this.name}`;

        this.fullName = fullName || (t13n.full !== this.name ? t13n.full : defaultFullName);
        this.altName = altName || t13n.aliases;
        this.t13Name = t13n.asArray;

        this.description = description;
        this.knot = new Knot(knotData);
        this.proficiencyId = proficiencyId; // The ID of the proficiency representing this KnotWork
        this.id = proficiencyId || `knot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        this.wounds = []; // Initialize wounds array for all KnotWorks (though mostly used by SuperKnots)

        // Initialize tags with defaults from T13 Core logic (class-t13-ne-elements.php)
        this.tags = {
            facets: tags.facets || ['All Facets'],
            genres: tags.genres || ['T13 Core'],
            eras: tags.eras || ['Timeless'],
            scopes: tags.scopes || ['Developmental'],
            ...tags
        };
    }

    async getProficiencyDetails() {
        const profIds = this.knot.getTiedProficiencies();
        const promises = profIds.map(id => this.codexLoader.getProficiency(id));
        const profs = await Promise.all(promises);
        return profs.filter(p => p !== null);
    }

    /**
     * Retrieves the proficiency object that represents this KnotWork itself, based on a specific TIE flag.
     * This is a helper for subclasses.
     * @protected
     * @param {number} flag - The unique TIE flag for the self-reference (e.g., TIE.GNARL or TIE.HITCH).
     * @returns {Promise<object|null>} A promise that resolves to the proficiency object, or null if not found.
     */
    async _getSelfProficiencyByFlag(flag) {
        const selfReferenceMask = flag | TIE.T13;
        let selfId = null;

        for (const [profId, mask] of this.knot.getAssociations().entries()) {
            if ((mask & selfReferenceMask) === selfReferenceMask) {
                selfId = profId;
                break; // Found it
            }
        }

        if (selfId) {
            return await this.codexLoader.getProficiency(selfId);
        }

        return null;
    }

    /**
     * Returns a structured object of the knot's composition for UI display.
     * @returns {Promise<object>}
     */
    async getNarrativeDetails() {
        const details = {
            root: [],
            channel: [],
            umbrals: [],
            nimbeds: [],
            tangle: []
        };

        const profs = await this.getProficiencyDetails();
        const associations = this.knot.getAssociations();

        for (const p of profs) {
            const mask = associations.get(p.id);
            const item = { id: p.id, name: p.name, facet: p.tags?.facets?.[0] };
            
            if (mask & TIE.ROOT) details.root.push(item);
            if (mask & TIE.CHANNEL) details.channel.push(item);
            if (mask & TIE.UMBRAL) details.umbrals.push(item);
            if (mask & TIE.NIMBED) details.nimbeds.push(item);
            // Tangle logic: usually Root if not explicitly set, or TANGLE flag
            if (mask & TIE.TANGLE) details.tangle.push(item);
        }
        return details;
    }
}


/**
 * An Annex is a list of Proficiencies tied together to create a larger ability
 * like a Skill, Talent, or Power.
 */
export class Annex extends KnotWork {
    constructor(codexLoader, { name, description, proficiencies, statblock = null, proficiencyId = null, tags = {}, fullName = null, altName = null, annexType = null }) {
        super(codexLoader, { name, description, knotData: proficiencies, proficiencyId, tags, fullName, altName });
        this.statblock = statblock;
        this.annexType = annexType || this.determineAnnexType();
    }

    determineAnnexType() {
        const profCount = this.knot.getTiedProficiencies().length;
        if (profCount <= 1) return 'Proficiency';
        if (profCount === 2) return 'Skill';
        if (profCount >= 3 && profCount <= 5) return 'Talent';
        if (profCount > 5) return 'Power';
        return 'Unknown';
    }

    /**
     * Factory method to create the correct Annex subclass from raw data.
     * @param {CodexLoader} codexLoader - The codex loader instance.
     * @param {object} rawData - The raw annex data object, likely from PHP.
     * @returns {Annex|PersonalityAnnex|PactAnnex|ConflictAnnex}
     */
    static create(codexLoader, rawData) {
        const rawName = rawData.Name || rawData.name || 'Unnamed Annex';
        const t13n = new T13Name(rawName);
        const annexType = rawData.Annex_Type || rawData.annex_type || rawData.annexType; // e.g., 7 for Personality
        const lowerName = t13n.common.toLowerCase();

        // Prepare proficiencies from knot if available (handling serialized Map entries)
        let proficiencies = rawData.proficiencies;
        if (!proficiencies && rawData.knot && Array.isArray(rawData.knot)) {
            // Convert [[profId, mask], ...] to [{profId, knot: mask}, ...]
            proficiencies = rawData.knot.map(([profId, mask]) => ({ profId, knot: mask }));
        }

        const proficiencyId = rawData.proficiencyId || null;

        // Map PHP Terms to JS tags
        const rawTerms = rawData.Terms || rawData.tags || {};
        const tags = {
            facets: rawTerms.Facet || rawTerms.facets,
            genres: rawTerms.Genre || rawTerms.genres,
            eras: rawTerms.Era || rawTerms.eras,
            scopes: rawTerms.Scope || rawTerms.scopes
        };

        // Check for Personality Annex based on type, name, or specific properties
        if (annexType === 7 || annexType === 'Personality' || lowerName.includes('personality') || rawData.personas || rawData.cores || rawData.hitches) {
            return new PersonalityAnnex(codexLoader, {
                name: rawName,
                description: rawData.Description || rawData.description,
                statblock: rawData.Statblock || rawData.statblock,
                personas: rawData.personas || [],
                cores: rawData.cores || [],
                hitches: rawData.hitches || [],
                proficiencies, // Pass reconstructed knot data if available
                proficiencyId,
                tags,
                fullName: rawData.FullName || rawData.fullName,
                altName: rawData.Alt_Name || rawData.altName
            });
        }

        // Check for Pact Annex
        if (annexType === 5 || annexType === 'Pact' || lowerName.includes('pact') || rawData.members) {
            return new PactAnnex(codexLoader, {
                name: rawName,
                description: rawData.Description || rawData.description,
                statblock: rawData.Statblock || rawData.statblock,
                members: rawData.members || [],
                proficiencies,
                proficiencyId,
                tags,
                fullName: rawData.FullName || rawData.fullName,
                altName: rawData.Alt_Name || rawData.altName
            });
        }

        // Check for Conflict Annex
        if (annexType === 8 || annexType === 'Conflict' || lowerName.includes('conflict') || rawData.conflictSides) {
            return new ConflictAnnex(codexLoader, {
                name: rawName,
                description: rawData.Description || rawData.description,
                statblock: rawData.Statblock || rawData.statblock,
                conflictSides: rawData.conflictSides || [],
                proficiencies,
                proficiencyId,
                tags,
                fullName: rawData.FullName || rawData.fullName,
                altName: rawData.Alt_Name || rawData.altName
            });
        }

        // Check for Size Annex
        if (annexType === 6 || annexType === 'Size' || lowerName.includes('size annex')) {
            return new SizeAnnex(codexLoader, {
                name: rawName,
                description: rawData.Description || rawData.description,
                statblock: rawData.Statblock || rawData.statblock,
                size: rawData.Size || rawData.size || 0,
                proficiencies,
                proficiencyId,
                tags,
                fullName: rawData.FullName || rawData.fullName,
                altName: rawData.Alt_Name || rawData.altName
            });
        }

        // Default to a standard Annex for Skill, Talent, Power, etc.
        // Note: The calling code is responsible for transforming raw PHP proficiencies 
        // into the {profId, knot} format expected by the constructor.
        return new Annex(codexLoader, {
            name: rawName,
            description: rawData.Description || rawData.description,
            statblock: rawData.Statblock || rawData.statblock,
            proficiencies: proficiencies || [],
            proficiencyId,
            tags,
            fullName: rawData.FullName || rawData.fullName,
            altName: rawData.Alt_Name || rawData.altName,
            annexType: rawData.annexType || rawData.Annex_Type
        });
    }

    /**
     * Creates a new proficiency in the codex that represents this Annex.
     * This is a key part of the T13NE system where complex entities become simple, reusable parts.
     */
    async saveAsProficiency() {
        if (this.proficiencyId) {
            Logger.warn(`Annex '${this.name}' has already been saved as proficiency ID '${this.proficiencyId}'.`);
            return this.proficiencyId;
        }

        const profs = await this.getProficiencyDetails();
        // Merge existing tags with derived facets
        const facetIds = [...new Set([...(this.tags.facets || []), ...profs.flatMap(p => p.tags.facets || [])])];

        const profData = {
            name: `${this.name} (${this.annexType})`,
            description: this.description || `An annex combining ${profs.map(p => p.name).join(', ')}.`,
            tags: {
                ...this.tags,
                facets: facetIds
                // We could add a special tag to identify it as an Annex-proficiency
            },
            sourceAnnex: {
                name: this.name,
                type: this.annexType,
                proficiencies: this.knot.serialize()
            }
        };

        const newId = await this.codexLoader.createKnot(profData);
        this.proficiencyId = newId;

        // Self-reference: Assign the new Proficiency ID as the GNARL and T13 tie of this Annex
        this.knot.assign(newId, TIE.GNARL | TIE.T13);

        // Update the proficiency with the modified knot data (containing the self-reference)
        if (typeof this.codexLoader.updateProficiency === 'function') {
            await this.codexLoader.updateProficiency(newId, {
                sourceAnnex: {
                    name: this.name,
                    type: this.annexType,
                    proficiencies: this.knot.serialize()
                }
            });
        }

        Logger.message(`Saved Annex '${this.name}' as new Proficiency with ID ${newId} (Self-tied as GNARL | T13)`);
        return newId;
    }

    /**
     * Retrieves the proficiency object that represents this Annex itself.
     * This relies on the self-referential GNARL | T13 tie created during saveAsProficiency.
     * @returns {Promise<object|null>} A promise that resolves to the proficiency object, or null if not found.
     */
    async getSelfProficiency() {
        return await this._getSelfProficiencyByFlag(TIE.GNARL);
    }

    /**
     * Generates a narrative name and description for the Annex using AI.
     * Uses Annex_Root, Annex_Channel, and other facet texts.
     * @param {object} aiService - The AI Service module.
     * @param {object} facetsModule - The Facets module to look up Root/Channel texts.
     */
    async generateNarrative(aiService, facetsModule) {
        if (!aiService || !facetsModule) return;

        const profs = await this.getProficiencyDetails();
        const associations = this.knot.getAssociations();

        let rootText = '';
        let channelText = '';
        let flavorText = [];
        let attackText = [];

        for (const p of profs) {
            const mask = associations.get(p.id);
            const facetName = p.tags?.facets?.[0];
            if (!facetName) continue;

            const facetData = await facetsModule.getFacet(facetName);
            if (!facetData) continue;

            if (mask & TIE.ROOT) {
                rootText = facetData.Annex_Root_Text || facetData.Annex_Root || facetName;
                if (facetData.Attack) {
                    attackText.push(`Root Attack (${facetData.Attack}): ${facetData.Attack_Text || ''}`);
                }
            }
            if (mask & TIE.CHANNEL) {
                channelText = facetData.Annex_Channel_Text || facetData.Annex_Channel || facetName;
                if (facetData.Attack) {
                    attackText.push(`Channel Attack (${facetData.Attack}): ${facetData.Attack_Text || ''}`);
                }
            }
            if (mask & TIE.NIMBED) {
                flavorText.push(`Nimbed (${facetData.Nimbed || 'Benefit'}): ${facetData.Nimbed_Text || ''}`);
            }
            if (mask & TIE.UMBRAL) {
                flavorText.push(`Umbral (${facetData.Umbral || 'Cost'}): ${facetData.Umbral_Text || ''}`);
            }
        }

        // Fallback if not explicitly tied
        if (!rootText && profs.length > 0) {
            const f = await facetsModule.getFacet(profs[0].tags?.facets?.[0]);
            if (f) {
                rootText = f.Annex_Root_Text || f.FacetName;
                if (f.Attack) attackText.push(`Potential Attack (${f.Attack}): ${f.Attack_Text || ''}`);
            }
        }

        const prompt = `Name and describe a character ability (Annex) of type ${this.annexType}.
        Root Concept: ${rootText}
        Channeling Action: ${channelText}
        Qualities: ${flavorText.join(', ')}
        Combat Potential: ${attackText.join(' | ')}
        
        Respond with ONLY a valid JSON object: { "name": "Creative Name", "description": "Flavorful description." }`;

        try {
            const response = await aiService.generateText(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.name) this.name = data.name;
                if (data.description) this.description = data.description;
            }
        } catch (e) {
            Logger.warn("Annex AI naming failed", e);
        }
    }
}

/**
 * Personality Annex - Combines Personas, Cores, and Hitches.
 */
export class PersonalityAnnex extends Annex {
    constructor(codexLoader, { name, description, personas = [], cores = [], hitches = [], statblock = null, proficiencies = null, proficiencyId = null, tags = {}, fullName = null, altName = null }) {
        // If proficiencies (knot data) are provided (e.g. from load), use them. Otherwise build from components.
        const knotData = proficiencies || [
            ...(personas || []).map(id => ({ profId: id, knot: TIE.PERSONA })),
            ...(cores || []).map(id => ({ profId: id, knot: TIE.CORE })),
            ...(hitches || []).map(id => ({ profId: id, knot: TIE.HITCH }))
        ];

        super(codexLoader, { name, description, proficiencies: knotData, statblock, proficiencyId, tags, fullName, altName });
        this.annexType = 'Personality';
    }

    determineAnnexType() {
        return 'Personality';
    }
}

/**
 * Pact Annex - Represents a group or pact membership.
 */
export class PactAnnex extends Annex {
    constructor(codexLoader, { name, description, pactType = 'Group', members = [], statblock = null, proficiencies = null, proficiencyId = null, tags = {}, fullName = null, altName = null }) {
        const knotData = proficiencies || (members || []).map(m => ({ profId: m.charId, knot: TIE.MEMBER }));

        super(codexLoader, { name, description, proficiencies: knotData, statblock, proficiencyId, tags, fullName, altName });
        this.annexType = 'Pact';
        this.pactType = pactType;
        this.members = members || []; // Array of { charId, membershipType, tier, role }
    }

    addMember(charId, membershipType = 'Belonging', tier = 0, role = '') {
        const existing = this.members.find(m => m.charId === charId);
        if (existing) {
            existing.membershipType = membershipType;
            existing.tier = tier;
            existing.role = role;
        } else {
            this.members.push({ charId, membershipType, tier, role });
            this.knot.assign(charId, TIE.MEMBER);
        }
    }

    determineAnnexType() {
        return 'Pact';
    }
}

/**
 * Conflict Annex - Represents a conflict or plot element.
 */
export class ConflictAnnex extends Annex {
    constructor(codexLoader, { name, description, conflictSides = [], statblock = null, proficiencies = null, proficiencyId = null, tags = {}, fullName = null, altName = null }) {
        const knotData = proficiencies || (conflictSides || []).map(id => ({ profId: id, knot: TIE.CONFLICT }));

        super(codexLoader, { name, description, proficiencies: knotData, statblock, proficiencyId, tags, fullName, altName });
        this.annexType = 'Conflict';
    }

    determineAnnexType() {
        return 'Conflict';
    }
}

/**
 * Size Annex - Represents the scale or size of a Character or Descendant.
 */
export class SizeAnnex extends Annex {
    constructor(codexLoader, { name, description, size = 0, statblock = null, proficiencies = null, proficiencyId = null, tags = {}, fullName = null, altName = null }) {
        super(codexLoader, { name, description, proficiencies: proficiencies || [], statblock, proficiencyId, tags, fullName, altName });
        this.annexType = 'Size';
        this.size = size;

        if (!this.description) {
            this.description = `Size Annex: ${this.getSizeName()} (Size ${this.size}).`;
        }
    }

    determineAnnexType() {
        return 'Size';
    }

    getSizeName() {
        return T13NE_Sway.getSizeDescription(this.size);
    }

    /**
     * Retrieves the Reach and Reaction Time modifiers for this size.
     * @returns {Promise<{reach: number, reactionTime: number}>}
     */
    async getSizeModifiers() {
        const sizeData = await this.codexLoader.getData('descendantSizes');

        if (sizeData && Array.isArray(sizeData)) {
            const entry = sizeData.find(s => s.Size == this.size);
            if (entry) {
                return {
                    reach: parseInt(entry.Reach, 10) || 0,
                    reactionTime: parseInt(entry.Reaction_Time || entry.RT, 10) || 0
                };
            }
        }

        // Fallback calculation
        return {
            reach: this.size,
            reactionTime: Math.max(0, Math.floor(this.size / 2))
        };
    }
}

/**
 * A Hitch is a list of Proficiencies with a single Boon that defines the Hitch. 
 * Often represents a complication, disadvantage, or narrative hook.
 */
export class Hitch extends KnotWork {
    constructor(codexLoader, { name, description, proficiencies = [], bane, root, channel, gnarls = [], triggers = [], tags = {}, fullName = null, altName = null }) {
        const knotData = [...(proficiencies || [])];
        if (root) knotData.push({ profId: root, knot: TIE.ROOT });
        if (channel) knotData.push({ profId: channel, knot: TIE.CHANNEL });

        super(codexLoader, { name, description, knotData, tags, fullName, altName });

        this.bane = bane;

        gnarls.forEach(g => this.knot.assign(g, TIE.GNARL));
        triggers.forEach(t => this.knot.assign(t, TIE.TRIGGER));
    }

    async saveAsProficiency() {
        if (this.proficiencyId) return this.proficiencyId;

        const profs = await this.getProficiencyDetails();
        const facetIds = [...new Set([...(this.tags.facets || []), ...profs.flatMap(p => p.tags.facets || [])])];

        const profData = {
            name: `${this.name} (Hitch)`,
            description: this.description,
            tags: {
                ...this.tags,
                facets: facetIds
            },
            sourceHitch: {
                name: this.name,
                bane: this.bane,
                proficiencies: this.knot.serialize()
            }
        };

        const newId = await this.codexLoader.createKnot(profData);
        this.proficiencyId = newId;

        // Self-reference: Assign the new Proficiency ID as the HITCH and T13 tie.
        this.knot.assign(newId, TIE.HITCH | TIE.T13);

        // Update the proficiency with the modified knot data (containing the self-reference)
        if (typeof this.codexLoader.updateProficiency === 'function') {
            await this.codexLoader.updateProficiency(newId, {
                sourceHitch: {
                    name: this.name,
                    bane: this.bane,
                    proficiencies: this.knot.serialize()
                }
            });
        }

        Logger.message(`Saved Hitch '${this.name}' as new Proficiency with ID ${newId} (Self-tied as HITCH | T13)`);

        return newId;
    }

    /**
     * Retrieves the proficiency object that represents this Hitch itself.
     * This relies on the self-referential HITCH | T13 tie created during saveAsProficiency.
     * @returns {Promise<object|null>} A promise that resolves to the proficiency object, or null if not found.
     */
    async getSelfProficiency() {
        return await this._getSelfProficiencyByFlag(TIE.HITCH);
    }

    /**
     * Generates a narrative name and description for the Hitch using AI.
     * Uses Bane to determine severity (Quirk/Flaw/Woe) and tied proficiencies for context.
     * @param {object} aiService - The AI Service module.
     * @param {object} facetsModule - The Facets module to look up Root/Channel texts.
     */
    async generateNarrative(aiService, facetsModule) {
        if (!aiService || !facetsModule) return;

        const profs = await this.getProficiencyDetails();
        const associations = this.knot.getAssociations();

        let rootText = '';
        let channelText = '';
        let triggerText = [];
        let gnarlText = [];

        // Determine Tier based on Bane
        let tier = 'Quirk';
        let intensity = 'Minor annoyance';
        if (this.bane > 10) {
            tier = 'Flaw';
            intensity = 'Significant problem';
        }
        if (this.bane > 20) {
            tier = 'Woe';
            intensity = 'Devastating or life-defining problem';
        }

        for (const p of profs) {
            const mask = associations.get(p.id);
            if (mask & TIE.TRIGGER) triggerText.push(p.name);
            if (mask & TIE.GNARL) gnarlText.push(p.name);
        }

        // Fallback if not explicitly tied but tags exist
        if (!rootText && this.tags.facets && this.tags.facets.length > 0) {
            const f = await facetsModule.getFacet(this.tags.facets[0]);
            if (f) {
                rootText = f.Hitch || f.FacetName;
                channelText = f.Hitch_Text || '';
                // Add specific Hitch Rules text if available for the tier
                if (f.Hitch_Rules && f.Hitch_Rules[tier]) {
                    intensity += `. ${f.Hitch_Rules[tier]}`;
                }
            }
        }

        const prompt = `Name and describe a character Hitch (Flaw/Disadvantage).
        Type: ${tier} (${intensity})
        Core Concept: ${rootText}
        Manifestation: ${channelText}
        Triggers: ${triggerText.join(', ') || 'General circumstances'}
        Complications (Gnarls): ${gnarlText.join(', ') || 'None'}
        
        Respond with ONLY a valid JSON object: { "name": "Creative Name", "description": "Flavourful description." }`;

        try {
            const response = await aiService.generateText(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.name) this.name = data.name;
                if (data.description) this.description = data.description;
            }
        } catch (e) {
            Logger.warn("Hitch AI naming failed", e);
        }
    }
}

/**
 * A SuperKnot is a complex KnotWork that ties together other KnotWorks (Annexes and Hitches).
 * It serves as the base class for Descendants and Characters.
 */
export class SuperKnot extends KnotWork {
    constructor(codexLoader, { name, description, masterAnnex = null, subAnnexes = [], hitches = [], descendants = [], statblock = null, proficiencyId = null, knotData = [], creator = null, tags = {}, fullName = null, altName = null }) {
        super(codexLoader, { name, description, knotData, proficiencyId, tags, fullName, altName });
        this.creator = creator;
        this.statblock = statblock;
        this.masterAnnex = masterAnnex;
        this.subAnnexes = subAnnexes || [];
        this.hitches = hitches || [];
        this.descendants = descendants || [];
        this.wounds = []; // Explicitly initialize wounds for SuperKnots (Characters/Descendants)
        this.traumas = []; // Initialize traumas array for SuperKnots

        // If we are creating a new instance (not loading), try to tie known IDs immediately
        if (!proficiencyId && !knotData.length) {
            if (this.masterAnnex && this.masterAnnex.proficiencyId) {
                this.knot.assign(this.masterAnnex.proficiencyId, TIE.ROOT);
            }
            this.subAnnexes.forEach(annex => {
                if (annex.proficiencyId) this.knot.assign(annex.proficiencyId, TIE.T13);
            });
            this.hitches.forEach(hitch => {
                if (hitch.proficiencyId) this.knot.assign(hitch.proficiencyId, TIE.HITCH);
            });
        }
    }

    addMasterAnnex(annex) {
        this.masterAnnex = annex;
        if (annex.proficiencyId) {
            this.knot.assign(annex.proficiencyId, TIE.ROOT);
        }
    }

    addSubAnnex(annex) {
        this.subAnnexes.push(annex);
        if (annex.proficiencyId) {
            this.knot.assign(annex.proficiencyId, TIE.T13);
        }
    }

    addHitch(hitch) {
        this.hitches.push(hitch);
        if (hitch.proficiencyId) {
            this.knot.assign(hitch.proficiencyId, TIE.HITCH);
        }
    }

    addDescendant(descendant) {
        if (descendant instanceof SuperKnot) {
            descendant.creator = this; // Set the creator to the current SuperKnot instance
            this.descendants.push(descendant);
            // Logic to tie proficiency ID would go here if saving immediately
        }
    }

    /**
     * Recursively saves components and then the SuperKnot itself.
     */
    async saveAsProficiency() {
        if (this.proficiencyId) return this.proficiencyId;

        // Save Master Annex
        if (this.masterAnnex) {
            if (!this.masterAnnex.proficiencyId) await this.masterAnnex.saveAsProficiency();
            this.knot.assign(this.masterAnnex.proficiencyId, TIE.ROOT);
        }

        // Save Sub Annexes
        for (const annex of this.subAnnexes) {
            if (!annex.proficiencyId) await annex.saveAsProficiency();
            this.knot.assign(annex.proficiencyId, TIE.T13);
        }

        // Save Hitches
        for (const hitch of this.hitches) {
            if (!hitch.proficiencyId) await hitch.saveAsProficiency();
            this.knot.assign(hitch.proficiencyId, TIE.HITCH);
        }

        const profs = await this.getProficiencyDetails();
        const facetIds = [...new Set([...(this.tags.facets || []), ...profs.flatMap(p => p.tags.facets || [])])];

        const profData = {
            name: `${this.name} (${this.constructor.name})`,
            description: this.description,
            tags: {
                ...this.tags,
                facets: facetIds
            },
            sourceSuperKnot: {
                name: this.name,
                type: this.constructor.name,
                proficiencies: this.knot.serialize()
            }
        };

        const newId = await this.codexLoader.createKnot(profData);
        this.proficiencyId = newId;

        // Self-reference
        this.knot.assign(newId, TIE.LINK | TIE.T13);

        if (typeof this.codexLoader.updateProficiency === 'function') {
            await this.codexLoader.updateProficiency(newId, {
                sourceSuperKnot: {
                    name: this.name,
                    type: this.constructor.name,
                    proficiencies: this.knot.serialize()
                }
            });
        }

        Logger.message(`Saved ${this.constructor.name} '${this.name}' as new Proficiency with ID ${newId}`);
        return newId;
    }

    async getSelfProficiency() {
        return await this._getSelfProficiencyByFlag(TIE.LINK);
    }

    /**
     * Retrieves the Reach and Reaction Time modifiers for this SuperKnot based on its Size Annex.
     * @returns {Promise<{reach: number, reactionTime: number}>}
     */
    async getSizeModifiers() {
        const sizeAnnex = this.subAnnexes.find(annex => annex instanceof SizeAnnex || annex.annexType === 'Size');
        if (sizeAnnex) {
            return await sizeAnnex.getSizeModifiers();
        }
        return { reach: 0, reactionTime: 0 };
    }

    /**
     * Generates a narrative name and description for the SuperKnot (Descendant/Character/Plot) using AI.
     * @param {object} aiService - The AI Service module.
     * @param {object} facetsModule - The Facets module.
     */
    async generateNarrative(aiService, facetsModule) {
        if (!aiService || !facetsModule) return;

        let typeContext = this.constructor.name;
        let facetContext = '';
        let extraContext = [];
        let facetName = this.tags.facets?.[0];

        // Try to get facet from Master Annex if available
        if (this.masterAnnex && this.masterAnnex.tags?.facets?.[0]) {
            facetName = this.masterAnnex.tags.facets[0];
        }

        let facetData = null;
        if (facetName) {
            facetData = await facetsModule.getFacet(facetName);
        }

        // Determine Context based on Type
        if (this.constructor.name === 'Character' || this.charType) {
            typeContext = `Character (${this.charType || 'Extra'})`;
            if (facetData && facetData.Persona) {
                extraContext.push(`Archetype: ${facetData.Persona.Name}`);
                extraContext.push(`Motivation: ${facetData.Persona.Motivation}`);
            }
        } else if (this.constructor.name === 'Plot' || this.plotType) {
            typeContext = `Plot (${this.plotType || 'Story'})`;
            if (this.conflict) extraContext.push(`Conflict: ${this.conflict}`);
        } else {
            // Descendant / Location logic
            if (this.masterAnnex) {
                if (this.masterAnnex.annexType === 'Size') {
                    typeContext = 'Location';
                    if (facetData) extraContext.push(`Location Type: ${facetData.Location} (${facetData.Location_Text})`);
                    if (this.masterAnnex.size) extraContext.push(`Size: ${T13NE_Sway.getSizeDescription(this.masterAnnex.size, 'Chi', 'Location')} (Level ${this.masterAnnex.size})`);
                } else if (this.masterAnnex.annexType === 'Pact') {
                    typeContext = 'Pact/Group';
                    extraContext.push(`Pact Details: ${this.masterAnnex.description}`);
                    if (this.masterAnnex.size) extraContext.push(`Size: ${T13NE_Sway.getSizeDescription(this.masterAnnex.size, 'Chi', 'Group')}`);
                } else {
                    typeContext = `Item/Descendant (${this.masterAnnex.annexType})`;
                    if (facetData) extraContext.push(`Descendant Type: ${facetData.Descendants} (${facetData.Descendants_Text})`);
                    if (this.masterAnnex.size) extraContext.push(`Size: ${T13NE_Sway.getSizeDescription(this.masterAnnex.size, 'Chi', 'Small')}`);
                }
            }
        }

        if (facetData) facetContext = `Thematic Influence: ${facetData.FacetName}`;

        const prompt = `Name and describe a ${typeContext}.
        ${facetContext}
        ${extraContext.join('\n')}
        ${this.description ? `Current Draft: ${this.description}` : ''}
        
        Respond with ONLY a valid JSON object: { "name": "Creative Name", "description": "Flavorful description." }`;

        try {
            const response = await aiService.generateText(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.name) this.name = data.name;
                if (data.description) this.description = data.description;
            }
        } catch (e) {
            Logger.warn("SuperKnot AI naming failed", e);
        }
    }
}

/**
 * A Plot is a Weaver that drives the narrative, composed of Characters, Conflicts, and other elements.
 * It extends SuperKnot to tie all its narrative components together.
 */
export class Plot extends SuperKnot {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.conflict = data.Conflict || data.conflict || null;
        this.plotRank = data.PlotRank || data.plotRank || null;
        this.plotType = data.PlotType || data.plotType || null;
    }
}