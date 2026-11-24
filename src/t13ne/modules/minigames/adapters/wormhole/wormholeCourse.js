/**
 * Wormhole Racers adapter. Builds a course from the song structure and a Stage per section.
 * The timeline is fixed by the song, so only the surfaces change with engine tuning and key.
 * Each key segment of a section becomes its own course section, so a modulation can change the surfaces mid-section.
 * Because the tunnel is linear, forks stay inside their course section and never branch across sections.
 * The engine can only tune to a note in its own mode, and a tuning outside a segment's mode adds instability.
 *
 * The consonance, instability and fork model is a platform convention and is not a rulebook formula.
 * Calibration values are placeholders for the Author to tune.
 */
import { planSections } from '../../core/sectionPlan.js';
import { assertValidCourse } from '../../core/courseContract.js';
import { stageDifficultyRatio } from '../../../systems/ordeals/t13ne-stage-difficulty.js';
import { SONG_SECTIONS, MODE_TONICS } from './wormholeSong.js';
import {
    assertRatio,
    octaveReducedRatio,
    modeNotes,
    isInMode,
    modeOverlap,
    assertTuningInMode
} from './wormholeMode.js';

export { octaveReducedRatio } from './wormholeMode.js';

export const WORMHOLE_CALIBRATION = {
    instabilityThreshold: 0.5,
    maxForksPerSection: 2,
    unsolidThreshold: 0.8,
    nominalSpeed: 1.0,
    fastSpeed: 1.3,
    slowSpeed: 0.7,
    wallBase: 0.25,
    wallRange: 0.5,
    maxTwistsPerSection: 4,
    outOfModeInstability: 0.3
};

const clamp01 = v => Math.min(1, Math.max(0, v));

/**
 * Consonance of a key's resonance measured against the engine tuning, from 0 to 1.
 * Uses the Tenney height of the octave-reduced ratio, so a unison scores 1 and complex ratios score lower.
 * @param {[number, number]} tuning Engine tuning ratio.
 * @param {[number, number]} resonance Key resonance ratio.
 * @returns {number}
 */
export function consonance(tuning, resonance) {
    assertRatio(tuning, 'tuning');
    assertRatio(resonance, 'resonance');
    const [num, den] = octaveReducedRatio(resonance[0] * tuning[1], resonance[1] * tuning[0]);
    return 1 / (1 + Math.log2(num * den));
}

/**
 * @param {number} difficulty Stage difficulty, from 0 to 1.
 * @param {number} consonanceValue From 0 to 1.
 * @returns {number} Instability from 0 to 1. Easy Stages and consonant resonances stay stable.
 */
export function harmonicInstability(difficulty, consonanceValue) {
    return clamp01(difficulty * (1 - consonanceValue));
}

/**
 * @param {number} instability From 0 to 1.
 * @param {object} [calibration]
 * @returns {number} Number of forks in the section. Forks are surfaces, never tunnel branches.
 */
export function forkCount(instability, calibration = WORMHOLE_CALIBRATION) {
    if (instability < calibration.instabilityThreshold) return 0;
    return Math.min(calibration.maxForksPerSection, Math.ceil(instability * calibration.maxForksPerSection));
}

/**
 * Splits a song section into its key segments, with each segment's offset inside the section.
 * @param {object} song A song section from wormholeSong.js.
 * @returns {Array<{mode: string, root: [number, number], transposed: boolean, beats: number, offset: number}>}
 */
export function keySegments(song) {
    if (!Array.isArray(song.keys) || song.keys.length === 0) {
        throw new Error(`Section "${song.id}" needs at least one key`);
    }
    let offset = 0;
    const segments = song.keys.map(key => {
        const mode = MODE_TONICS[key.mode];
        if (!mode) throw new Error(`Unknown mode "${key.mode}" in section "${song.id}"`);
        if (!Number.isInteger(key.beats) || key.beats <= 0) {
            throw new Error(`Key segments in section "${song.id}" need positive integer beats`);
        }
        const root = key.root ?? mode.ratio;
        assertRatio(root, `root of section "${song.id}"`);
        const transposed = root[0] !== mode.ratio[0] || root[1] !== mode.ratio[1];
        const segment = { mode: key.mode, root: [...root], transposed, beats: key.beats, offset };
        offset += key.beats;
        return segment;
    });
    if (offset !== song.beats) {
        throw new Error(`Key segments in section "${song.id}" sum to ${offset}, expected ${song.beats}`);
    }
    return segments;
}

function buildLanes(instability, forks, calibration) {
    const lanes = [
        { id: 'spine', surface: 'solid', traversable: true, speedFactor: calibration.nominalSpeed, main: true, shieldHold: true }
    ];
    for (let i = 1; i <= forks; i++) {
        const odd = i % 2 === 1;
        if (instability >= calibration.unsolidThreshold) {
            lanes.push(odd
                ? { id: `fork${i}`, surface: 'unsolid', traversable: false, speedFactor: calibration.nominalSpeed, shieldHold: false }
                : { id: `fork${i}`, surface: 'slow', traversable: true, speedFactor: calibration.slowSpeed, shieldHold: true });
        } else {
            lanes.push(odd
                ? { id: `fork${i}`, surface: 'fast', traversable: true, speedFactor: calibration.fastSpeed, shieldHold: true }
                : { id: `fork${i}`, surface: 'slow', traversable: true, speedFactor: calibration.slowSpeed, shieldHold: true });
        }
    }
    return lanes;
}

/**
 * @param {object} args
 * @param {Record<string, Array<{pips: (string|number)}>>} args.stageCardsByKey Difficulty cards per Stage key.
 * @param {[number, number]} [args.tuning=[1, 1]] Engine tuning ratio. Must be a note in the engine mode.
 * @param {string} [args.engineMode='Ionian'] Mode name of the engine.
 * @param {Array<object>} [args.sections=SONG_SECTIONS]
 * @param {object} [args.calibration=WORMHOLE_CALIBRATION]
 * @returns {object} A validated course.
 */
export function buildWormholeCourse({
    stageCardsByKey,
    tuning = [1, 1],
    engineMode = 'Ionian',
    sections = SONG_SECTIONS,
    calibration = WORMHOLE_CALIBRATION
}) {
    assertRatio(tuning, 'tuning');
    assertTuningInMode(tuning, engineMode);
    const engineNotes = modeNotes(engineMode);

    const difficultyByKey = {};
    for (const section of sections) {
        if (difficultyByKey[section.stageKey] !== undefined) continue;
        const cards = stageCardsByKey && stageCardsByKey[section.stageKey];
        if (!cards) throw new Error(`No Stage cards supplied for "${section.stageKey}"`);
        difficultyByKey[section.stageKey] = stageDifficultyRatio(cards);
    }

    const totalTicks = sections.reduce((sum, s) => sum + s.beats, 0);
    const planned = planSections(
        sections.map(s => ({ id: s.id, ticks: s.beats, kind: s.kind, stageKey: s.stageKey })),
        difficultyByKey,
        totalTicks
    );
    const songById = new Map(sections.map(s => [s.id, s]));

    const courseSections = [];
    for (const section of planned) {
        keySegments(songById.get(section.id)).forEach((segment, index) => {
            const notes = modeNotes(segment.mode, segment.root);
            const inMode = isInMode(tuning, notes);
            const c = consonance(tuning, segment.root);
            const modePenalty = inMode ? 0 : calibration.outOfModeInstability;
            const instability = clamp01(harmonicInstability(section.difficulty, c) + modePenalty);
            const forks = forkCount(instability, calibration);
            courseSections.push({
                id: `${section.id}.${index + 1}`,
                songSection: section.id,
                kind: section.kind,
                stageKey: section.stageKey,
                repeat: section.repeat,
                mode: segment.mode,
                root: segment.root,
                transposed: segment.transposed,
                ticks: segment.beats,
                startTick: section.startTick + segment.offset,
                difficulty: section.difficulty,
                resonance: segment.root,
                engineMode,
                notes,
                inMode,
                modeOverlap: modeOverlap(engineNotes, notes),
                consonance: c,
                instability,
                wallPlacementFraction: clamp01(calibration.wallBase + calibration.wallRange * section.difficulty),
                twistsPerSection: Math.round(section.difficulty * calibration.maxTwistsPerSection),
                lanes: buildLanes(instability, forks, calibration)
            });
        });
    }

    return assertValidCourse({ totalTicks, sections: courseSections });
}
