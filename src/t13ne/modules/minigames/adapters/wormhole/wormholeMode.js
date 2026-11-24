/**
 * Mode rules for the Wormhole Racers adapter.
 * An engine can only tune to a note in its own mode, and a wormhole resonates only at notes in its mode.
 * Pitches are just-intonation ratios folded into one octave, so 2/1 and 1/1 count as the same note.
 */
import { MODE_TONICS, MODE_INTERVALS } from './wormholeSong.js';

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

export function assertRatio(ratio, name) {
    if (!Array.isArray(ratio) || ratio.length !== 2 || !ratio.every(n => Number.isInteger(n) && n > 0)) {
        throw new RangeError(`${name} must be a pair of positive integers, such as [2, 3]`);
    }
}

/**
 * Reduces a ratio to lowest terms and folds it into one octave, so 1:2 counts as a unison.
 * @param {number} p
 * @param {number} q
 * @returns {[number, number]}
 */
export function octaveReducedRatio(p, q) {
    assertRatio([p, q], 'ratio');
    let num = p;
    let den = q;
    const g = gcd(num, den);
    num /= g;
    den /= g;
    while (num >= 2 * den) den *= 2;
    while (num < den) num *= 2;
    const g2 = gcd(num, den);
    return [num / g2, den / g2];
}

const noteKey = ([p, q]) => `${p}/${q}`;
const noteValue = ([p, q]) => p / q;

/**
 * The absolute notes of a mode: its interval ratios applied to its root, folded into one octave.
 * @param {string} modeName
 * @param {[number, number]} [root] Absolute ratio of the mode's tonic above C. Defaults to the mode's own tonic.
 * @returns {Array<[number, number]>} Distinct notes, lowest first.
 */
export function modeNotes(modeName, root) {
    const mode = MODE_TONICS[modeName];
    const intervals = MODE_INTERVALS[modeName];
    if (!mode || !intervals) throw new Error(`Unknown mode "${modeName}"`);
    const base = root ?? mode.ratio;
    assertRatio(base, 'root');
    const notes = new Map();
    for (const [a, b] of intervals) {
        const note = octaveReducedRatio(base[0] * a, base[1] * b);
        notes.set(noteKey(note), note);
    }
    return [...notes.values()].sort((x, y) => noteValue(x) - noteValue(y));
}

/**
 * @param {[number, number]} ratio
 * @param {Array<[number, number]>} notes
 * @returns {boolean} Whether the ratio, folded into one octave, is one of the notes.
 */
export function isInMode(ratio, notes) {
    const note = octaveReducedRatio(ratio[0], ratio[1]);
    return notes.some(n => noteKey(n) === noteKey(note));
}

/**
 * @param {Array<[number, number]>} engineNotes
 * @param {Array<[number, number]>} wormholeNotes
 * @returns {Array<[number, number]>} Notes both modes share.
 */
export function sharedNotes(engineNotes, wormholeNotes) {
    const engineKeys = new Set(engineNotes.map(noteKey));
    return wormholeNotes.filter(n => engineKeys.has(noteKey(n)));
}

/**
 * @param {Array<[number, number]>} engineNotes
 * @param {Array<[number, number]>} wormholeNotes
 * @returns {number} Share of the wormhole's notes the engine mode can reach, from 0 to 1.
 */
export function modeOverlap(engineNotes, wormholeNotes) {
    return sharedNotes(engineNotes, wormholeNotes).length / wormholeNotes.length;
}

/**
 * An engine can only be tuned to a note in its own mode.
 * @param {[number, number]} tuning
 * @param {string} engineMode Mode name of the engine.
 */
export function assertTuningInMode(tuning, engineMode) {
    if (!isInMode(tuning, modeNotes(engineMode))) {
        throw new RangeError(`Tuning ${tuning[0]}:${tuning[1]} is not a note in the ${engineMode} mode`);
    }
}
