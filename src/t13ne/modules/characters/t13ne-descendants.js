import { SuperKnot } from "/src/t13ne/modules/mechanics/t13ne-knots.js";
import T13SwayAccount from '/src/t13ne/modules/mechanics/T13SwayAccount.js';
import T13NE from '/src/t13ne/T13NE.js';
import T13Dice from '/src/t13ne/modules/mechanics/t13ne-dice.js';
import Logger from "/src/t13ne/core/Logger.js";

/**
 * Represents a Descendant in the T13NE system (Items, Locations, Connections, etc.).
 * Extends SuperKnot to allow for complex knotwork associations.
 */
export class Descendant extends SuperKnot {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.descendantType = data.descendantType || 'Item'; // Item, Location, Connection, etc.
        this.incarna = data.incarna ?? null;
        this.locationType = data.locationType || null; // Specifics for Location descendants
        this.wounds = data.wounds || []; // Ensure wounds are loaded or initialized
        this.traumas = data.traumas || []; // Ensure traumas are loaded or initialized

        // Descendants can hold Sway (e.g. Wallets, Batteries, Places of Power)
        this.swayAccount = new T13SwayAccount(data.sway || {});

        // Ownership and State
        this.equipped = data.equipped || false;
        this.wielder = data.wielder || null; // The Character or Entity wielding this
    }

    /**
     * Checks if the descendant is a Location.
     * @returns {boolean}
     */
    isLocation() {
        return this.descendantType === 'Location' || (this.masterAnnex && this.masterAnnex.annexType === 'Size');
    }

    /**
     * Checks if the descendant is a Pact (Group).
     * @returns {boolean}
     */
    isPact() {
        return this.descendantType === 'Pact' || (this.masterAnnex && this.masterAnnex.annexType === 'Pact');
    }

    /**
     * Factory method to generate a random Descendant.
     * @param {CodexLoader} codexLoader 
     * @param {object} options 
     */
    static async generate(codexLoader, options = {}) {
        const funcName = 'Descendant.generate';
        Logger.start(funcName, options);
        const type = options.descendantType || 'Item';
        const Facets = T13NE.getModule('Facets');
        if (!Facets) throw new Error('Descendant.generate: Facets module is required.');
        let facet;
        if (options.incarna !== undefined && options.incarna !== null) {
            let identifier = options.incarna;
            if (typeof identifier === 'string' && /^\d+$/.test(identifier)) identifier = Number(identifier);
            if (typeof identifier !== 'string' && typeof identifier !== 'number') {
                throw new Error('Descendant.generate: Incarna must identify a Facet.');
            }
            facet = await Facets.getFacet(identifier);
            if (!facet) throw new Error(`Descendant.generate: Unknown Incarna Facet '${options.incarna}'.`);
        } else {
            const facetsArr = await Facets.getFacetsArr();
            if (!facetsArr.length) throw new Error('Descendant.generate: No Facets are available.');
            facet = facetsArr[T13Dice.RNG(0, facetsArr.length - 1)];
        }
        const NameGenerator = T13NE.getModule('NameGenerator');
        const AnnexFactory = T13NE.getModule('AnnexFactory');

        let nameInput = options.name;
        if (!nameInput && NameGenerator) {
            nameInput = await NameGenerator.generate({ type: 'Descendant', subtype: type, facet: facet.FacetName }, Date.now());
        }

        if (!nameInput) nameInput = [`Random ${facet.FacetName} ${type}`, `Random ${facet.FacetName} ${type}`, ''];
        const displayName = Array.isArray(nameInput) ? nameInput[0] : nameInput;
        Logger.message(`${funcName}: Generated Name: ${displayName}`);

        const data = {
            name: nameInput,
            description: `A procedurally generated ${type} related to ${facet.FacetName}.`,
            descendantType: type,
            tags: { facets: [facet.FacetName] },
            ...options,
            incarna: facet.FacetName
        };

        Logger.message(`${funcName}: Creating Master Annex for ${type}...`);
        if (options.masterAnnex) {
            data.masterAnnex = options.masterAnnex;
        } else if (type === 'Pact') {
            const { PactAnnex } = await import("/src/t13ne/modules/mechanics/t13ne-knots.js");
            data.masterAnnex = new PactAnnex(codexLoader, {
                name: `${displayName} Pact`,
                description: `A collective pact of ${facet.FacetName}.`,
                tags: { facets: [facet.FacetName] }
            });
        } else if (type === 'Location') {
            const { SizeAnnex } = await import("/src/t13ne/modules/mechanics/t13ne-knots.js");
            data.masterAnnex = new SizeAnnex(codexLoader, {
                name: `${displayName} Size`,
                size: options.size || 0,
                tags: { facets: [facet.FacetName] }
            });
        } else {
            if (AnnexFactory) {
                data.masterAnnex = await AnnexFactory.create({
                    name: `${facet.FacetName} Function`,
                    description: 'Generated functionality.',
                    tags: { facets: [facet.FacetName] },
                    proficiencies: [{ facet: facet.FacetName }, { facet: facet.FacetName }]
                });
            } else {
                const { Annex } = await import("/src/t13ne/modules/mechanics/t13ne-knots.js");
                data.masterAnnex = new Annex(codexLoader, {
                    name: `${facet.FacetName} Function`,
                    description: 'Generated functionality.',
                    tags: { facets: [facet.FacetName] }
                });
            }
        }

        const descendant = new Descendant(codexLoader, data);
        Logger.end(funcName, descendant);
        return descendant;
    }
}
