/**
 * Song structure for the Wormhole Racers adapter.
 * Section order follows src/t13ne/04_Wormhole_Mechanics.md.
 * Beat splits and key plans are placeholders for the Author to tune.
 *
 * A key is a mode on its root. The root defaults to the mode's own tonic, and a key may transpose it with `root`.
 * A section may keep one key, modulate once, or change key several times.
 * Each key segment has its own resonance, so a modulation can change the tunnel surfaces mid-section.
 * Choruses share one Stage key, so the Stage is drawn once and repeated.
 * A section's Stage is separate from its musical key, so a repeated Stage may use a different key.
 */

export const SONG_TOTAL_BEATS = 288;

/**
 * Tonic of each mode in the Wormhole mechanics table, as a just-intonation ratio above C.
 * Ratios are placeholders for the Author to tune against the engine tuning.
 * @type {Record<string, {tonic: string, ratio: [number, number]}>}
 */
export const MODE_TONICS = {
    Ionian: { tonic: 'C', ratio: [1, 1] },
    Dorian: { tonic: 'D', ratio: [9, 8] },
    Phrygian: { tonic: 'E', ratio: [5, 4] },
    Lydian: { tonic: 'F', ratio: [4, 3] },
    Mixolydian: { tonic: 'G', ratio: [3, 2] },
    Aeolian: { tonic: 'A', ratio: [5, 3] }
};

/**
 * Interval ratios of each mode, relative to its tonic, from the Modes and Ratios table in the wormhole mechanics.
 * @type {Record<string, Array<[number, number]>>}
 */
export const MODE_INTERVALS = {
    Ionian: [[1, 1], [9, 8], [5, 4], [4, 3], [3, 2], [5, 3], [15, 8], [2, 1]],
    Dorian: [[1, 1], [9, 8], [6, 5], [4, 3], [3, 2], [5, 3], [9, 5], [2, 1]],
    Phrygian: [[1, 1], [16, 15], [6, 5], [4, 3], [3, 2], [8, 5], [9, 5], [2, 1]],
    Lydian: [[1, 1], [9, 8], [5, 4], [45, 32], [3, 2], [5, 3], [15, 8], [2, 1]],
    Mixolydian: [[1, 1], [9, 8], [5, 4], [4, 3], [3, 2], [5, 3], [9, 5], [2, 1]],
    Aeolian: [[1, 1], [9, 8], [6, 5], [4, 3], [3, 2], [8, 5], [9, 5], [2, 1]]
};

/**
 * @typedef {{mode: string, beats: number, root?: [number, number]}} KeySegment
 * @typedef {{id: string, kind: string, beats: number, stageKey: string, keys: KeySegment[]}} SongSection
 */

/** Chorus 3 and 4 lift a whole step from the verses: Mixolydian on A, whose root is 27/16 above C. @type {SongSection[]} */
export const SONG_SECTIONS = [
    { id: 'intro', kind: 'intro', beats: 16, stageKey: 'intro', keys: [{ mode: 'Ionian', beats: 16 }] },
    { id: 'verse-1', kind: 'verse', beats: 40, stageKey: 'verse', keys: [{ mode: 'Mixolydian', beats: 40 }] },
    { id: 'chorus-1', kind: 'chorus', beats: 32, stageKey: 'chorus', keys: [{ mode: 'Ionian', beats: 32 }] },
    { id: 'verse-2', kind: 'verse', beats: 40, stageKey: 'verse', keys: [{ mode: 'Mixolydian', beats: 40 }] },
    { id: 'chorus-2', kind: 'chorus', beats: 32, stageKey: 'chorus', keys: [{ mode: 'Ionian', beats: 32 }] },
    {
        id: 'bridge',
        kind: 'bridge',
        beats: 24,
        stageKey: 'bridge',
        keys: [{ mode: 'Phrygian', beats: 12 }, { mode: 'Lydian', beats: 12 }]
    },
    {
        id: 'solo',
        kind: 'solo',
        beats: 24,
        stageKey: 'solo',
        keys: [{ mode: 'Dorian', beats: 8 }, { mode: 'Mixolydian', beats: 8 }, { mode: 'Lydian', beats: 8 }]
    },
    { id: 'chorus-3', kind: 'chorus', beats: 32, stageKey: 'chorus', keys: [{ mode: 'Mixolydian', beats: 32, root: [27, 16] }] },
    { id: 'chorus-4', kind: 'chorus', beats: 32, stageKey: 'chorus', keys: [{ mode: 'Mixolydian', beats: 32, root: [27, 16] }] },
    { id: 'outro', kind: 'outro', beats: 16, stageKey: 'outro', keys: [{ mode: 'Ionian', beats: 16 }] }
];
