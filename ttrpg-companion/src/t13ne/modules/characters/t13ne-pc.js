import Logger from "/src/t13ne/core/Logger.js";

/**
 * T13NE PC Handler
 * Manages the display and interaction of Player Characters.
 */
export class PCController {
    constructor(character) {
        this.character = character;
    }

    /**
     * Renders a character sheet data object for the UI.
     * @returns {object}
     */
    getSheetData() {
        if (!this.character) return null;

        return {
            header: {
                name: this.character.name,
                fullName: this.character.fullName,
                type: this.character.charType,
                age: this.character.ageCategory
            },
            description: this.character.description,
            stats: this._formatStats(),
            abilities: this._formatAbilities(),
            hitches: this._formatHitches(),
            resources: this._formatResources()
        };
    }

    _formatStats() {
        if (this.character.facetweb && this.character.facetweb.Stats) {
            // Assuming T13Tapestry structure
            return this.character.facetweb.Stats.map(s => ({
                id: s.Facet,
                boon: s.Facet_Boon,
                sway: s.Facet_Sway
            }));
        }
        return [];
    }

    _formatAbilities() {
        const abilities = [];
        const annexes = [this.character.masterAnnex, ...(this.character.subAnnexes || [])].filter(Boolean);
        
        annexes.forEach(a => {
            abilities.push({
                name: a.name,
                type: a.annexType,
                description: a.description,
                boon: a.boon // If Lite or specific override
            });
        });
        return abilities;
    }

    _formatHitches() {
        if (!this.character.hitches) return [];
        return this.character.hitches.map(h => ({
            name: h.name,
            description: h.description,
            bane: h.bane
        }));
    }

    _formatResources() {
        return this.character.swayAccount ? this.character.swayAccount.getAllBalances() : {};
    }
}






