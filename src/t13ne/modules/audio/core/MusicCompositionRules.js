/**
 * @module Modules/Audio/MusicCompositionRules
 * @description Procedural music composition rules enforcing strict Mode adherence
 * (never "Scale" — Scale is reserved for T13), smooth voice leading, and arrangement registers.
 */

export const MODE_INTERVALS = Object.freeze({
    Ionian: [0, 2, 4, 5, 7, 9, 11],
    Dorian: [0, 2, 3, 5, 7, 9, 10],
    Phrygian: [0, 1, 3, 5, 7, 8, 10],
    Lydian: [0, 2, 4, 6, 7, 9, 11],
    Mixolydian: [0, 2, 4, 5, 7, 9, 10],
    Aeolian: [0, 2, 3, 5, 7, 8, 10],
    Locrian: [0, 1, 3, 5, 6, 8, 10],
    HarmonicMinor: [0, 2, 3, 5, 7, 8, 11],
    PhrygianDominant: [0, 1, 4, 5, 7, 8, 10],
    WholeTone: [0, 2, 4, 6, 8, 10]
});

export const ARRANGEMENT_REGISTERS = Object.freeze({
    bass: { minMidi: 28, maxMidi: 52 },
    pad: { minMidi: 48, maxMidi: 72 },
    rhythm: { minMidi: 48, maxMidi: 76 },
    lead: { minMidi: 60, maxMidi: 88 }
});

export function getModeIntervals(modeName = 'Ionian') {
    const key = Object.keys(MODE_INTERVALS).find(
        k => k.toLowerCase() === String(modeName).trim().toLowerCase()
    );
    return MODE_INTERVALS[key ?? 'Ionian'];
}

export function isPitchClassInMode(midiNote, rootPitchClass = 0, modeName = 'Ionian') {
    const intervals = getModeIntervals(modeName);
    const pc = ((Math.round(midiNote) - Math.round(rootPitchClass)) % 12 + 12) % 12;
    return intervals.includes(pc);
}

/**
 * Snaps a candidate MIDI note to the nearest pitch inside the active Mode and register.
 */
export function snapNoteToMode(midiNote, rootPitchClass = 0, modeName = 'Ionian', register = null) {
    const intervals = getModeIntervals(modeName);
    const rootPc = ((Math.round(rootPitchClass) % 12) + 12) % 12;
    const minMidi = register?.minMidi ?? 24;
    const maxMidi = register?.maxMidi ?? 96;
    const clamped = Math.max(minMidi, Math.min(maxMidi, Math.round(midiNote)));

    let best = clamped;
    let bestDist = Infinity;
    for (let cand = minMidi; cand <= maxMidi; cand++) {
        const pc = ((cand - rootPc) % 12 + 12) % 12;
        if (!intervals.includes(pc)) continue;
        const dist = Math.abs(cand - clamped);
        if (dist < bestDist) {
            bestDist = dist;
            best = cand;
        }
    }
    return best;
}

/**
 * Computes total semitone motion between two chord voicings.
 */
export function voiceLeadingCost(prevChord = [], nextChord = []) {
    if (!prevChord.length || !nextChord.length) return 0;
    let cost = 0;
    const len = Math.min(prevChord.length, nextChord.length);
    for (let i = 0; i < len; i++) {
        cost += Math.abs(nextChord[i] - prevChord[i]);
    }
    return cost;
}

/**
 * Chooses the chord inversion/octave placement of `targetPitchClasses` that minimizes
 * total voice-leading semitone movement from `prevVoicing` within `[minMidi, maxMidi]`.
 */
export function chooseSmoothVoicing(prevVoicing = [], targetPitchClasses = [0, 4, 7], { minMidi = 48, maxMidi = 72 } = {}) {
    if (!Array.isArray(targetPitchClasses) || !targetPitchClasses.length) return [];
    const normPcs = targetPitchClasses.map(pc => ((Math.round(pc) % 12) + 12) % 12);

    const candidatesForPc = (pc) => {
        const list = [];
        for (let m = minMidi; m <= maxMidi; m++) {
            if (((m % 12) + 12) % 12 === pc) list.push(m);
        }
        return list.length ? list : [Math.max(minMidi, Math.min(maxMidi, 60 + pc))];
    };

    if (!Array.isArray(prevVoicing) || prevVoicing.length === 0) {
        const base = [];
        let cursor = minMidi;
        for (const pc of normPcs) {
            const opts = candidatesForPc(pc);
            const pick = opts.find(n => n >= cursor) ?? opts[opts.length - 1];
            base.push(pick);
            cursor = pick + 1;
        }
        return base.sort((a, b) => a - b);
    }

    // Try all permutations for small chords (<= 5 voices) to find minimum voice-leading movement
    const sortedPrev = [...prevVoicing].sort((a, b) => a - b);
    const nearestTo = (pc, target) => {
        const opts = candidatesForPc(pc);
        return opts.reduce((best, cur) => (
            Math.abs(cur - target) < Math.abs(best - target) ? cur : best
        ), opts[0]);
    };

    if (normPcs.length <= 5) {
        let bestVoicing = null;
        let bestScore = Infinity;
        const permute = (arr, l = 0) => {
            if (l === arr.length) {
                const voiced = arr.map((pc, idx) => nearestTo(pc, sortedPrev[Math.min(idx, sortedPrev.length - 1)]));
                const cost = voiced.reduce((sum, n, idx) => sum + Math.abs(n - sortedPrev[Math.min(idx, sortedPrev.length - 1)]), 0);
                // Penalize duplicate MIDI notes in a chord
                const uniquePenalty = (voiced.length - new Set(voiced).size) * 24;
                if (cost + uniquePenalty < bestScore) {
                    bestScore = cost + uniquePenalty;
                    bestVoicing = voiced;
                }
                return;
            }
            for (let i = l; i < arr.length; i++) {
                [arr[l], arr[i]] = [arr[i], arr[l]];
                permute(arr, l + 1);
                [arr[l], arr[i]] = [arr[i], arr[l]];
            }
        };
        permute([...normPcs]);
        return (bestVoicing || []).sort((a, b) => a - b);
    }

    const chosen = normPcs.map((pc, idx) => nearestTo(pc, sortedPrev[Math.min(idx, sortedPrev.length - 1)]));
    return chosen.sort((a, b) => a - b);
}

/**
 * Smoothly voice-leads an entire chord progression of pitch-class arrays within a Mode.
 */
export function voiceLeadProgression(chordsOfPitchClasses = [], modeName = 'Ionian', rootPitchClass = 0, registerName = 'pad') {
    const reg = ARRANGEMENT_REGISTERS[registerName] ?? ARRANGEMENT_REGISTERS.pad;
    const snappedChords = chordsOfPitchClasses.map(chord =>
        chord.map(pc => snapNoteToMode(60 + pc, rootPitchClass, modeName, reg) % 12)
    );
    const result = [];
    let prev = [];
    for (const pcs of snappedChords) {
        const voiced = chooseSmoothVoicing(prev, pcs, reg);
        result.push(voiced);
        prev = voiced;
    }
    return result;
}
