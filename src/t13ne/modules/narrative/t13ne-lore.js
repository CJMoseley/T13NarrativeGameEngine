/**
 * @module Plugins/T13Ne/Narrative/Lore
 * @description
 * Manages "Lore" within the T13NE system.
 * Lore represents specific pieces of narrative information, secrets, or history
 * that characters can learn (Gain) and use.
 */

import Logger from "../../core/Logger.js";
import CodexLoader from "../codex/CodexLoader.js";
import dice from "../mechanics/t13ne-dice.js";

/**
 * Represents a single piece of Lore.
 */
export class T13Lore {
    constructor(data = {}) {
        this.topic = data.topic || "Unknown Topic"; // What is this about? (e.g., "The Baron's Secret")
        this.content = data.content || "Details missing."; // The actual info
        this.source = data.source || "Unknown"; // Where did this come from? (e.g., "Old Diary")
        this.value = data.value || 1; // Narrative value/Boon equivalent
        this.tags = data.tags || []; // e.g., ['Secret', 'History', 'Tech']
        this.id = data.id || `lore-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.acquiredAt = data.acquiredAt || Date.now();
    }
}

/**
 * Manages Lore generation and assignment.
 */
class T13LoreManager {
    constructor() {
        this.initialized = false;
        this.t13ne = null;
        this.loreTypes = []; // Loaded from JSON if available
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;

        // Load any specific lore data if it exists, otherwise we generate procedurally
        // this.loreTypes = await CodexLoader.getData('loreTypes') || [];

        this.initialized = true;
        Logger.message('T13LoreManager: Initialized.');
    }

    /**
     * Generates a piece of Lore based on parameters.
     * @param {string} type - The type of lore (e.g., 'Secret', 'History', 'Technique').
     * @param {object} context - Contextual data (Related character, Location, Plot).
     * @returns {T13Lore} The generated lore object.
     */
    generateLore(type, context = {}) {
        let topic = context.topic || "A Mystery";
        let content = "You have learned something interesting.";
        let tags = [type];
        let value = 1;

        // Basic procedural generation logic
        if (type === 'Secret') {
            const subjects = ["The Baron", "The Guild", "The Past", "The Weapon"];
            const subject = context.subject || subjects[Math.floor(Math.random() * subjects.length)];
            topic = `Secret of ${subject}`;
            content = `${subject} is hiding something dangerous.`;
            value = 3;
        } else if (type === 'History') {
            const eras = ["The Golden Age", "The War", "The Collapse"];
            const era = context.era || eras[Math.floor(Math.random() * eras.length)];
            topic = `History of ${era}`;
            content = `Details about what really happened during ${era}.`;
            value = 2;
        } else if (type === 'Technique') {
            topic = "Forgotten Technique";
            content = "A method to improve efficiency or power.";
            value = 5; // Techniques might be valuable boons
        }

        if (context.relatedTo) {
            tags.push(`Related:${context.relatedTo}`);
        }

        const lore = new T13Lore({
            topic,
            content,
            source: context.source || "Discovery",
            value,
            tags
        });

        Logger.message(`T13LoreManager: Generated Lore '${lore.topic}'.`);
        return lore;
    }

    /**
     * Grants a piece of Lore to a character (Lore Gain).
     * @param {object} character - The character receiving the lore.
     * @param {T13Lore|string} loreOrType - The Lore object or type string to generate.
     * @param {object} context - Context if generating.
     */
    gainLore(character, loreOrType, context = {}) {
        if (!character) return;

        let lore;
        if (loreOrType instanceof T13Lore) {
            lore = loreOrType;
        } else {
            lore = this.generateLore(loreOrType, context);
        }

        if (!character.lores) character.lores = [];
        character.lores.push(lore);

        Logger.message(`${character.name} gained Lore: ${lore.topic}`);

        // Potential side effects: XP, Facet adjustments, etc.
        // For now, just logging.

        return lore;
    }
}

export default new T13LoreManager();
