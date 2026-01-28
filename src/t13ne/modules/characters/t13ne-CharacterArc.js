import CodexLoader from "@/src/t13ne/modules/codex/CodexLoader.js";
import Logger from "@/src/t13ne/core/Logger.js";

/**
 * Represents a specific Character Arc instance.
 */
export class CharacterArc {
    constructor(data) {
        this.id = data.id || `arc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.characterId = data.characterId;
        this.name = data.name || 'Untitled Arc';
        this.type = data.type || 'Solo'; // Composition Type: Solo, Duet, Trio, etc.
        this.key = data.key || 'C'; // The musical key of the arc (from Character Geometry)
        this.tempo = data.tempo || 'Moderate';
        this.currentBar = data.currentBar || 1;
        this.currentBeat = data.currentBeat || 1;
        this.pitches = data.pitches || []; // Planned sequence of pitches
        this.activePitch = data.activePitch || null; // Current pitch being voiced
        this.notes = data.notes || []; // Notes applied to the arc (Character, Setting, Story, Blue)
        this.history = data.history || []; // History of beats/bars
    }
}

/**
 * Module for handling T13NE Character Arcs, Compositions, and Progressions.
 */
class T13NE_CharacterArcModule {
    constructor() {
        this.compositions = [];
        this.tempos = [];
        this.pitches = [];
        this.intervals = [];
        this.characterEffects = [];
        this.t13ne = null;
        this.initialized = false;
        
        // Standard Chromatic Scale for interval calculation
        this.chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        try {
            // Load definitions from Codex
            this.compositions = await CodexLoader.getData('drama', 'characterCompositions.json') || [];
            this.tempos = await CodexLoader.getData('drama', 'compositionTempos.json') || [];
            this.pitches = await CodexLoader.getData('geometry', 'pitches.json') || [];
            this.intervals = await CodexLoader.getData('geometry', 'interval_ratios.json') || [];
            this.characterEffects = await CodexLoader.getData('drama', 'character_effects.json') || [];
            this.progressions = await CodexLoader.getData('geometry', 'progressions.json') || [];
            
            this.initialized = true;
            Logger.message('T13NE_CharacterArc: Initialized.');
        } catch (error) {
            Logger.error(`T13NE_CharacterArc: Initialization failed: ${error}`);
        }
    }

    /**
     * Creates a new Character Arc for a character.
     * @param {object} character - The character object.
     * @param {string} [type='Solo'] - The type of composition (Solo, Duet, etc.).
     * @param {string} [name=''] - Optional name for the arc.
     * @returns {CharacterArc} The created arc.
     */
    createArc(character, type = 'Solo', name = '') {
        if (!character) return null;
        
        // Determine Key from Character Geometry if available
        let key = 'C';
        if (character.geometry && character.geometry.Key) {
            key = character.geometry.Key;
        } else if (character.geometry && character.geometry.Geo && character.geometry.Geo.Key) {
             key = character.geometry.Geo.Key;
        }

        const arc = new CharacterArc({
            characterId: character.id || character.name,
            name: name || `${character.name}'s ${type}`,
            type: type,
            key: key
        });

        if (!character.arcs) character.arcs = [];
        character.arcs.push(arc);
        
        Logger.message(`T13NE_CharacterArc: Created arc '${arc.name}' for ${character.name}.`);
        return arc;
    }

    /**
     * Retrieves a specific arc for a character.
     * @param {object} character 
     * @param {string} arcId 
     * @returns {CharacterArc|null}
     */
    getArc(character, arcId) {
        if (!character || !character.arcs) return null;
        return character.arcs.find(a => a.id === arcId);
    }

    /**
     * Advances the arc to the next beat or bar.
     * @param {object} character 
     * @param {string} arcId 
     * @returns {object} Result { success, message, arc }
     */
    advanceArc(character, arcId) {
        const arc = this.getArc(character, arcId);
        if (!arc) return { success: false, message: "Arc not found" };

        // Archive current state
        arc.history.push({
            bar: arc.currentBar,
            beat: arc.currentBeat,
            pitch: arc.activePitch,
            notes: [...arc.notes] // Snapshot of notes at this beat
        });

        arc.currentBeat++;
        // Default 4/4 time signature assumption for now, could be dynamic based on Composition Type
        if (arc.currentBeat > 4) {
            arc.currentBeat = 1;
            arc.currentBar++;
        }
        
        // Clear transient notes if necessary, or keep them. For now we keep them attached to the arc.
        
        return { success: true, message: `Advanced to Bar ${arc.currentBar}, Beat ${arc.currentBeat}`, arc };
    }

    /**
     * Adds a Note to the arc (Character, Setting, Story, Blue).
     * @param {object} character 
     * @param {string} arcId 
     * @param {string} noteType 
     * @param {string} content 
     */
    addNote(character, arcId, noteType, content) {
        const arc = this.getArc(character, arcId);
        if (!arc) return { success: false, message: "Arc not found" };

        const note = {
            id: `note_${Date.now()}`,
            type: noteType, // Character, Setting, Story, Blue
            content: content,
            bar: arc.currentBar,
            beat: arc.currentBeat
        };
        
        arc.notes.push(note);
        return { success: true, message: "Note added", note };
    }
    
    /**
     * Sets the active pitch for the current beat/bar and calculates effects.
     * @param {object} character 
     * @param {string} arcId 
     * @param {string} pitch 
     */
    calculatePitchEffects(character, arcId, pitch) {
        const arc = this.getArc(character, arcId);
        if (!arc) return { success: false, message: "Arc not found" };
        
        const pitchData = this.pitches.find(p => p.data.Pitch === pitch || p.data.Alt === pitch)?.data;
        if (!pitchData) {
            return { success: false, message: `Pitch '${pitch}' not found in codex.` };
        }

        const interval1 = this.calculateInterval(arc.key, pitch);
        const effect1 = this.getEffectForInterval(interval1);
        
        let interval2 = null;
        let effect2 = null;

        // If not a unison or tritone, there's an inverted interval
        if (interval1 > 0 && interval1 !== 6) {
            interval2 = 12 - interval1;
            effect2 = this.getEffectForInterval(interval2);
        } else if (interval1 === 0) {
            // Unison vs Octave
            interval2 = 12;
            effect2 = this.getEffectForInterval(interval2);
        }
        
        const message = `Pitch set to ${pitch}. Potential effects: ${effect1.Name} or ${effect2 ? effect2.Name : 'none'}. House: ${pitchData.House}.`;

        return { 
            success: true, 
            message: message, 
            pitch: pitchData,
            effects: [
                { interval: interval1, effect: effect1 },
                ...(effect2 ? [{ interval: interval2, effect: effect2 }] : [])
            ]
        };
    }

    /**
     * Calculates the semi-tone interval between two keys/pitches.
     * @param {string} key1 - Base key (Character Key)
     * @param {string} key2 - Target pitch
     * @returns {number} Interval (0-11)
     */
    calculateInterval(key1, key2) {
        if (!key1 || !key2) return 0;
        // Normalize keys (handle flats if necessary, though T13 usually uses sharps in examples)
        // Simple normalization: Db->C#, Eb->D#, Gb->F#, Ab->G#, Bb->A#
        const normalize = (k) => {
            const map = {'Db':'C#', 'Eb':'D#', 'Gb':'F#', 'Ab':'G#', 'Bb':'A#'};
            return map[k] || k;
        };

        const k1 = normalize(key1);
        const k2 = normalize(key2);
        
        const idx1 = this.chromaticScale.indexOf(k1);
        const idx2 = this.chromaticScale.indexOf(k2);
        
        if (idx1 === -1 || idx2 === -1) return 0;
        
        let interval = idx2 - idx1;
        if (interval < 0) interval += 12;
        return interval;
    }

    /**
     * Returns the narrative effect for a given interval.
     * @param {number} interval 
     * @returns {string} Description of effect
     */
    getEffectForInterval(interval) {
        if (!this.intervals || !this.characterEffects) {
            Logger.warn('CharacterArc module data not fully loaded for getEffectForInterval.');
            return { Name: 'Unknown', Description: 'Module data not loaded.' };
        }
        // Find the interval object in this.intervals that matches the interval number.
        const intervalData = this.intervals.find(i => i.data.Interval === interval);
        if (!intervalData || !intervalData.data) {
            return { Name: 'Unknown', Description: `No interval data found for interval number ${interval}.` };
        }

        const effectId = intervalData.data.Effect;
        const effectData = this.characterEffects.find(e => e.data.Effect === effectId);

        if (!effectData || !effectData.data) {
            return { Name: 'Unknown', Description: `Interval effect ID ${effectId} not found in character_effects.json.` };
        }
        
        // Return the whole effect object for more context, plus the interval description
        return { ...effectData.data, IntervalDescription: intervalData.data.Description };
    }

    /**
     * Finds a progression by name.
     * @param {string} progressionName 
     * @returns {object|null}
     */
    getProgression(progressionName) {
        if (!this.progressions || this.progressions.length === 0) return null;
        // Find a progression where the name starts with the provided name, case-insensitive
        return this.progressions.find(p => p.data.Name.toLowerCase().startsWith(progressionName.toLowerCase()))?.data || null;
    }
}

export default new T13NE_CharacterArcModule();






