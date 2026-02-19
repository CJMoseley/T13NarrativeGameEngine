import { LoreData } from '../lore/LoreData.js';
import ProcGen from '../ProcGen.js';
import Logger from '../../core/Logger.js';

/**
 * Handles procedural music generation based on galactic coordinates and game state.
 * Source: [Documentation Sections: Music, Scales, Chords, Color Mapping]
 */
export class MusicGenerator {
    constructor() {
        if (!LoreData.isLoaded()) {
            throw new Error("MusicGenerator cannot be instantiated before LoreData is loaded.");
        }
        this.scales = Object.keys(LoreData.music.SCALES);
    }

    /**
     * Determines the musical key and scale for a wormhole based on its start and end points.
     * @param {object} startCoords - {x, y, z} of the starting star.
     * @param {object} endCoords - {x, y, z} of the ending star.
     * @param {object} [speciesCore] - Optional. The core lore object for the dominant species.
     * @returns {object} An object containing the scale name, key, and the full scale data.
     */
    getWormholeSong(startCoords, endCoords, speciesCore) {
        let key, scaleName;

        if (speciesCore && speciesCore.derivedTraits) {
            // --- New Lore-Driven Music Generation ---
            key = speciesCore.derivedTraits.keyNote;

            // Find the best-fitting scale based on the species' harmonic signature
            const speciesHarmonics = speciesCore.derivedTraits.harmonicSignature.map(h => h % 12);
            let bestMatch = { name: this.scales[0], score: 0 };

            for (const name of this.scales) {
                const scaleSemitones = LoreData.music.SCALES[name].semitones;
                const matchScore = speciesHarmonics.filter(h => scaleSemitones.includes(h)).length;

                if (matchScore > bestMatch.score) {
                    bestMatch = { name, score: matchScore };
                }
            }
            scaleName = bestMatch.name;

        } else {
            // --- Fallback to original noise-based generation ---
            Logger.message("WARN: No speciesCore data provided to getWormholeSong, falling back to noise-based generation.");
            // Use noise based on the midpoint to determine the scale
            const midX = (startCoords.x + endCoords.x) / 2;
            const midY = (startCoords.y + endCoords.y) / 2;
            const scaleNoise = (ProcGen.simplex2D(midX * 0.001, midY * 0.001) + 1) / 2; // Normalize to [0, 1]
            
            scaleName = this.scales[Math.floor(scaleNoise * this.scales.length)];

            // The key is determined by the destination
            const keyNoise = (ProcGen.simplex2D(endCoords.x * 0.001, endCoords.z * 0.001) + 1) / 2; // Normalize to [0, 1]
            const keyIndex = Math.floor(keyNoise * 12);
            key = LoreData.music.TONE_COLOR_MAP[keyIndex].note;
        }

        const scaleData = LoreData.music.SCALES[scaleName];

        return {
            scaleName,
            key,
            scaleData
        };
    }

    /**
     * Generates a chord progression for a race based on the song's structure.
     * @param {object} song - The song object from getWormholeSong.
     * @returns {Array} A list of chords representing the race's musical structure.
     */
    generateChordProgression(song) {
        const progressions = song.scaleData.progressions;
        if (!progressions || progressions.length === 0) {
            return [song.scaleData.triads[0]]; // Default to the tonic if no progressions exist
        }

        // Use a deterministic seed based on song key and scale
        let seed = 0;
        const seedStr = (song.key || 'C') + (song.scaleName || 'Major');
        for (let i = 0; i < seedStr.length; i++) {
            seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
            seed |= 0;
        }

        const pseudoRand = () => {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };

        // Pick a deterministic common progression for this scale
        const progression = progressions[Math.floor(pseudoRand() * progressions.length)];
        
        // For now, we'll just return a simple verse-chorus-verse structure
        const verse = progression;
        const chorus = [song.scaleData.triads[3], song.scaleData.triads[4], song.scaleData.triads[0]]; // e.g., IV-V-I
        
        return [...verse, ...chorus, ...verse];
    }

    /**
     * Converts a sound frequency (in Hz) to a corresponding HTML hex color code.
     * This is the sigmoid smoothing function from the design document.
     * @param {number} f_sound - The frequency of the musical tone in Hz.
     * @returns {string} HTML Hex Code String (e.g., "#FF0000").
     */
    curvedFrequencyToHex(f_sound) {
        const C = 299792458;
        const f_ref_sound = 440;
        const f_ref_light_THz = 385;
        const shift_factor = (f_ref_light_THz * 1e12) / f_ref_sound;
        const f_light_Hz = f_sound * shift_factor;
        const lambda = (C / f_light_Hz) * 1e9;

        if (lambda > 780) return "#000000";
        if (lambda < 380) return "#FFFFFF";

        const lambda_min = 380;
        const lambda_max = 780;
        const normalized_lambda = (lambda - lambda_min) / (lambda_max - lambda_min);

        const R_center = 0.82;
        const G_center = 0.50;
        const B_center = 0.18;
        const width = 0.15;

        const color_curve = (center) => {
            const exponent = -0.5 * Math.pow((normalized_lambda - center) / width, 2);
            return Math.exp(exponent);
        };

        let R_raw = color_curve(R_center);
        let G_raw = color_curve(G_center);
        let B_raw = color_curve(B_center);

        const scale = 255 / Math.max(R_raw, G_raw, B_raw, 1e-6);

        const r = Math.round(Math.min(255, R_raw * scale));
        const g = Math.round(Math.min(255, G_raw * scale));
        const b = Math.round(Math.min(255, B_raw * scale));

        const componentToHex = (c) => c.toString(16).padStart(2, '0');
        return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
    }
}
