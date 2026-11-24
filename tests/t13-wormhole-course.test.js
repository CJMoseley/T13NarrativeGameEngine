import test from 'node:test';
import assert from 'node:assert/strict';
import {
    octaveReducedRatio,
    consonance,
    harmonicInstability,
    forkCount,
    keySegments,
    buildWormholeCourse
} from '../src/t13ne/modules/minigames/adapters/wormhole/wormholeCourse.js';
import { SONG_SECTIONS, SONG_TOTAL_BEATS, MODE_TONICS } from '../src/t13ne/modules/minigames/adapters/wormhole/wormholeSong.js';
import { courseErrors } from '../src/t13ne/modules/minigames/core/courseContract.js';

const easy = [{ pips: '2' }];
const medium = [{ pips: '8' }, { pips: '8' }];
const hard = [{ pips: '15' }, { pips: '15' }, { pips: '15' }];
const stageCardsByKey = { intro: easy, verse: hard, chorus: hard, bridge: medium, solo: hard, outro: easy };

const build = (tuning = [1, 1], cards = stageCardsByKey) => buildWormholeCourse({ stageCardsByKey: cards, tuning });
const first = (course, songId) => course.sections.find(s => s.songSection === songId);
const segments = (course, songId) => course.sections.filter(s => s.songSection === songId);

test('octaveReducedRatio folds a ratio into one octave and reduces it', () => {
    assert.deepEqual(octaveReducedRatio(1, 2), [1, 1]);
    assert.deepEqual(octaveReducedRatio(2, 1), [1, 1]);
    assert.deepEqual(octaveReducedRatio(3, 2), [3, 2]);
    assert.deepEqual(octaveReducedRatio(2, 3), [4, 3]);
    assert.deepEqual(octaveReducedRatio(6, 4), [3, 2]);
});

test('consonance ranks a unison above 2:3 above 7:5', () => {
    const unison = consonance([1, 1], [1, 1]);
    const twoThirds = consonance([1, 1], [2, 3]);
    const sevenFifths = consonance([1, 1], [7, 5]);
    assert.equal(unison, 1);
    assert.ok(unison > twoThirds && twoThirds > sevenFifths);
});

test('consonance is measured against the engine tuning', () => {
    assert.equal(consonance([3, 2], [3, 2]), 1);
    assert.ok(consonance([1, 1], [3, 2]) < 1);
});

test('consonance and tuning reject ratios that are not positive integer pairs', () => {
    assert.throws(() => consonance([1, 1], [0, 2]), RangeError);
    assert.throws(() => consonance([1.5, 1], [1, 1]), RangeError);
    assert.throws(() => consonance([1, 1], [1]), RangeError);
});

test('harmonicInstability is zero for an easy Stage or a unison, and stays within 0 to 1', () => {
    assert.equal(harmonicInstability(0, 0.1), 0);
    assert.equal(harmonicInstability(1, 1), 0);
    const value = harmonicInstability(1, 0.2);
    assert.ok(value >= 0 && value <= 1);
});

test('forkCount is zero below the threshold and grows with instability up to the maximum', () => {
    assert.equal(forkCount(0.49), 0);
    assert.equal(forkCount(0.5), 1);
    assert.equal(forkCount(0.9), 2);
    assert.equal(forkCount(1), 2);
});

test('the mode table gives each mode its tonic above C, in just intonation', () => {
    assert.deepEqual(Object.keys(MODE_TONICS).sort(), ['Aeolian', 'Dorian', 'Ionian', 'Lydian', 'Mixolydian', 'Phrygian']);
    assert.deepEqual(MODE_TONICS.Ionian, { tonic: 'C', ratio: [1, 1] });
    assert.deepEqual(MODE_TONICS.Mixolydian, { tonic: 'G', ratio: [3, 2] });
    assert.deepEqual(MODE_TONICS.Aeolian, { tonic: 'A', ratio: [5, 3] });
});

test('every song section splits into key segments that sum to its beats', () => {
    for (const song of SONG_SECTIONS) {
        const parts = keySegments(song);
        assert.equal(parts.reduce((sum, p) => sum + p.beats, 0), song.beats, song.id);
        assert.equal(parts[0].offset, 0);
    }
});

test('keySegments rejects unknown modes and key plans that do not match the section length', () => {
    assert.throws(() => keySegments({ id: 'x', beats: 8, keys: [{ mode: 'Locrian', beats: 8 }] }), /Unknown mode "Locrian"/);
    assert.throws(() => keySegments({ id: 'x', beats: 8, keys: [{ mode: 'Ionian', beats: 4 }] }), /sum to 4, expected 8/);
    assert.throws(() => keySegments({ id: 'x', beats: 8, keys: [] }), /needs at least one key/);
});

test('the default course follows the song structure and totals 288 beats', () => {
    const course = build();
    assert.equal(course.totalTicks, SONG_TOTAL_BEATS);
    assert.equal(SONG_TOTAL_BEATS, 288);
    const songOrder = [...new Set(course.sections.map(s => s.songSection))];
    assert.deepEqual(songOrder, SONG_SECTIONS.map(s => s.id));
    assert.deepEqual(courseErrors(course), []);
});

test('choruses and verses repeat their stage, and the intro does not', () => {
    const course = build();
    assert.equal(first(course, 'intro').repeat, false);
    assert.equal(first(course, 'chorus-2').repeat, true);
    assert.equal(first(course, 'verse-2').repeat, true);
});

test('a multi-key section splits into segments with the same Stage and difficulty', () => {
    const course = build();
    const parts = segments(course, 'solo');
    assert.deepEqual(parts.map(p => p.id), ['solo.1', 'solo.2', 'solo.3']);
    assert.deepEqual(parts.map(p => p.mode), ['Dorian', 'Mixolydian', 'Lydian']);
    assert.deepEqual(parts.map(p => p.ticks), [8, 8, 8]);
    assert.ok(parts.every(p => p.repeat === false && p.difficulty === parts[0].difficulty && p.stageKey === 'solo'));
});

test('verses repeat the same progression by default, as most pop verses do', () => {
    const verses = SONG_SECTIONS.filter(s => s.kind === 'verse');
    assert.ok(verses.length >= 2);
    for (const verse of verses.slice(1)) {
        assert.deepEqual(verse.keys, verses[0].keys, verse.id);
    }
});

test('a repeated Stage may take a different key from its earlier use', () => {
    const course = build();
    const chorus1 = first(course, 'chorus-1');
    const chorus3 = first(course, 'chorus-3');
    assert.equal(chorus1.stageKey, chorus3.stageKey);
    assert.equal(chorus1.difficulty, chorus3.difficulty);
    assert.equal(chorus3.repeat, true);
    assert.notDeepEqual(chorus1.resonance, chorus3.resonance);
    assert.notEqual(chorus1.mode, chorus3.mode);
});

test('a modulation inside a section changes the surface of each segment', () => {
    const course = build([1, 1]);
    const instabilities = segments(course, 'solo').map(p => p.instability);
    assert.ok(new Set(instabilities).size > 1);
});

test('a multi-key section keeps every segment contiguous and inside the song timeline', () => {
    const course = build();
    const solo = segments(course, 'solo');
    assert.equal(solo.length, 3);
    assert.equal(solo[0].startTick + solo[0].ticks, solo[1].startTick);
    assert.equal(solo[1].startTick + solo[1].ticks, solo[2].startTick);
    assert.equal(solo[2].startTick + solo[2].ticks, first(course, 'chorus-3').startTick);
});

test('the tunnel never branches, whatever the tuning: segments and spines stay identical', () => {
    const tunings = [[1, 1], [3, 2], [5, 3], [5, 2]];
    const baseline = build([1, 1]);
    for (const tuning of tunings) {
        const course = build(tuning);
        assert.deepEqual(course.sections.map(s => [s.id, s.startTick, s.ticks]), baseline.sections.map(s => [s.id, s.startTick, s.ticks]));
        for (const s of course.sections) {
            assert.equal(s.lanes[0].id, 'spine');
            assert.equal(s.lanes[0].surface, 'solid');
            assert.equal(s.lanes[0].traversable, true);
            assert.equal(s.lanes[0].shieldHold, true);
            for (const fork of s.lanes.slice(1)) assert.match(fork.id, /^fork\d+$/);
        }
    }
});

test('a changed tuning changes the chorus instability and the verse instability', () => {
    const base = build([1, 1]);
    const retuned = build([3, 2]);
    assert.equal(first(base, 'chorus-1').instability, 0);
    assert.ok(first(retuned, 'chorus-1').instability > 0.5);
    assert.ok(first(base, 'verse-1').instability > first(retuned, 'verse-1').instability);
});

test('forks are only added where instability reaches the threshold', () => {
    const course = build([1, 1]);
    assert.equal(first(course, 'chorus-1').lanes.length, 1);
    assert.ok(first(course, 'verse-1').lanes.length > 1);
});

test('high instability turns odd forks unsolid, which the shield cannot hold on', () => {
    const course = build([5, 2]);
    const verse = first(course, 'verse-1');
    assert.ok(verse.instability >= 0.8);
    const fork1 = verse.lanes.find(l => l.id === 'fork1');
    assert.equal(fork1.surface, 'unsolid');
    assert.equal(fork1.traversable, false);
    assert.equal(fork1.shieldHold, false);
    assert.equal(verse.lanes[0].traversable, true);
});

test('lower instability forks alternate fast and slow, and both stay traversable', () => {
    const course = build([1, 1]);
    const verse = first(course, 'verse-1');
    const [fork1, fork2] = verse.lanes.slice(1);
    assert.equal(fork1.surface, 'fast');
    assert.equal(fork2.surface, 'slow');
    assert.ok(fork1.speedFactor > 1 && fork2.speedFactor < 1);
    assert.equal(fork1.traversable, true);
    assert.equal(fork2.traversable, true);
});

test('harder sections place walls further out and add more twists', () => {
    const course = build();
    const intro = first(course, 'intro');
    const verse = first(course, 'verse-1');
    assert.ok(verse.wallPlacementFraction > intro.wallPlacementFraction);
    assert.ok(verse.twistsPerSection > intro.twistsPerSection);
    for (const s of course.sections) {
        assert.ok(s.wallPlacementFraction >= 0 && s.wallPlacementFraction <= 1);
    }
});

test('a missing Stage card set is rejected', () => {
    assert.throws(() => buildWormholeCourse({ stageCardsByKey: { intro: easy } }), /No Stage cards supplied for "verse"/);
});

test('a bad tuning is rejected', () => {
    assert.throws(() => build([0, 1]), RangeError);
});
