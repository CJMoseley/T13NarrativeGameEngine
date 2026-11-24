import test from 'node:test';
import assert from 'node:assert/strict';
import {
    modeNotes,
    isInMode,
    modeOverlap,
    assertTuningInMode
} from '../src/t13ne/modules/minigames/adapters/wormhole/wormholeMode.js';
import {
    buildWormholeCourse,
    consonance,
    harmonicInstability,
    keySegments,
    WORMHOLE_CALIBRATION
} from '../src/t13ne/modules/minigames/adapters/wormhole/wormholeCourse.js';
import { MODE_TONICS } from '../src/t13ne/modules/minigames/adapters/wormhole/wormholeSong.js';

const stageCardsByKey = {
    intro: [{ pips: '2' }],
    verse: [{ pips: '15' }, { pips: '15' }, { pips: '15' }],
    chorus: [{ pips: '15' }, { pips: '15' }, { pips: '15' }],
    bridge: [{ pips: '8' }, { pips: '8' }],
    solo: [{ pips: '15' }, { pips: '15' }, { pips: '15' }],
    outro: [{ pips: '2' }]
};
const first = (course, songId) => course.sections.find(s => s.songSection === songId);
const segments = (course, songId) => course.sections.filter(s => s.songSection === songId);

test('modeNotes gives the Ionian notes of C, folded into one octave', () => {
    assert.deepEqual(modeNotes('Ionian'), [[1, 1], [9, 8], [5, 4], [4, 3], [3, 2], [5, 3], [15, 8]]);
});

test('modeNotes applies the tonic to the mode intervals, so Mixolydian sits on G', () => {
    assert.deepEqual(modeNotes('Mixolydian'), [[1, 1], [9, 8], [5, 4], [27, 20], [3, 2], [27, 16], [15, 8]]);
});

test('every mode has seven distinct notes and includes its own tonic', () => {
    for (const name of Object.keys(MODE_TONICS)) {
        const notes = modeNotes(name);
        assert.equal(notes.length, 7, name);
        const tonic = MODE_TONICS[name].ratio;
        assert.ok(isInMode(tonic, notes), name);
    }
});

test('isInMode folds the ratio into one octave before checking it', () => {
    const mixolydian = modeNotes('Mixolydian');
    assert.equal(isInMode([5, 4], mixolydian), true);
    assert.equal(isInMode([9, 4], mixolydian), true);
    assert.equal(isInMode([4, 3], mixolydian), false);
});

test('modeOverlap is the share of the wormhole notes the engine mode can reach', () => {
    const ionian = modeNotes('Ionian');
    const mixolydian = modeNotes('Mixolydian');
    assert.equal(modeOverlap(ionian, ionian), 1);
    assert.equal(modeOverlap(ionian, mixolydian), 5 / 7);
});

test('an engine can only be tuned to a note in its own mode', () => {
    assert.doesNotThrow(() => assertTuningInMode([5, 4], 'Ionian'));
    assert.throws(() => assertTuningInMode([7, 5], 'Ionian'), /Tuning 7:5 is not a note in the Ionian mode/);
});

test('buildWormholeCourse rejects a tuning outside the engine mode', () => {
    assert.throws(() => buildWormholeCourse({ stageCardsByKey, tuning: [7, 5] }), /not a note in the Ionian mode/);
    assert.throws(() => buildWormholeCourse({ stageCardsByKey, tuning: [5, 3], engineMode: 'Mixolydian' }), /Mixolydian mode/);
});

test('a tuning in the engine mode is accepted, and the engine mode can change', () => {
    const course = buildWormholeCourse({ stageCardsByKey, tuning: [5, 4], engineMode: 'Mixolydian' });
    assert.equal(first(course, 'verse-1').engineMode, 'Mixolydian');
});

test('each course section reports its mode notes, whether the tuning is in it, and the overlap', () => {
    const course = buildWormholeCourse({ stageCardsByKey });
    const chorus = first(course, 'chorus-1');
    assert.equal(chorus.engineMode, 'Ionian');
    assert.equal(chorus.inMode, true);
    assert.equal(chorus.modeOverlap, 1);
    assert.deepEqual(chorus.notes, modeNotes('Ionian'));
});

test('a tuning outside a segment mode adds the out-of-mode instability', () => {
    const course = buildWormholeCourse({ stageCardsByKey, tuning: [4, 3] });
    const verse = first(course, 'verse-1');
    assert.equal(verse.inMode, false);
    const expected = Math.min(1, harmonicInstability(verse.difficulty, consonance([4, 3], verse.resonance)) + WORMHOLE_CALIBRATION.outOfModeInstability);
    assert.equal(verse.instability, expected);
});

test('the default tuning sits inside the Ionian mode, so Ionian sections keep no mode penalty', () => {
    const course = buildWormholeCourse({ stageCardsByKey });
    const ionianSections = course.sections.filter(s => s.mode === 'Ionian');
    assert.ok(ionianSections.length > 0);
    assert.ok(ionianSections.every(s => s.inMode === true));
    assert.ok(segments(course, 'solo').every(s => s.mode !== 'Ionian'));
});

test('modeNotes applies a transposed root in place of the mode tonic', () => {
    const notes = modeNotes('Mixolydian', [27, 16]);
    assert.ok(isInMode([27, 16], notes));
    assert.notDeepEqual(notes, modeNotes('Mixolydian'));
});

test('a transposed key is marked, and its resonance is its root', () => {
    const course = buildWormholeCourse({ stageCardsByKey });
    const chorus3 = first(course, 'chorus-3');
    assert.equal(chorus3.transposed, true);
    assert.deepEqual(chorus3.root, [27, 16]);
    assert.deepEqual(chorus3.resonance, [27, 16]);
    assert.deepEqual(chorus3.notes, modeNotes('Mixolydian', [27, 16]));
    assert.equal(first(course, 'verse-1').transposed, false);
});

test('chorus 3 and 4 lift together, so the final choruses share one key', () => {
    const course = buildWormholeCourse({ stageCardsByKey });
    const chorus3 = first(course, 'chorus-3');
    const chorus4 = first(course, 'chorus-4');
    assert.deepEqual(chorus4.root, chorus3.root);
    assert.equal(chorus4.mode, chorus3.mode);
});

test('a transposed chorus needs a tuning in its own mode, not just the engine mode', () => {
    const course = buildWormholeCourse({ stageCardsByKey });
    const chorus3 = first(course, 'chorus-3');
    assert.equal(chorus3.inMode, false);
    const tuned = buildWormholeCourse({ stageCardsByKey, tuning: [27, 16], engineMode: 'Mixolydian' });
    assert.equal(first(tuned, 'chorus-3').inMode, true);
    assert.equal(first(tuned, 'chorus-1').inMode, false);
});

test('a key root must be a positive ratio', () => {
    assert.throws(() => keySegments({ id: 'x', beats: 8, keys: [{ mode: 'Ionian', beats: 8, root: [0, 1] }] }), /root of section "x" must be a pair of positive integers/);
    assert.throws(() => keySegments({ id: 'x', beats: 8, keys: [{ mode: 'Ionian', beats: 8, root: [3] }] }), /root of section "x"/);
});
