import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { planSections } from '../src/t13ne/modules/minigames/core/sectionPlan.js';
import { courseErrors, assertValidCourse } from '../src/t13ne/modules/minigames/core/courseContract.js';

const lane = (overrides = {}) => ({ id: 'main', surface: 'firm', traversable: true, speedFactor: 1, main: true, ...overrides });

const validCourse = () => ({
    totalTicks: 10,
    sections: [{ id: 's1', ticks: 10, startTick: 0, difficulty: 0.5, lanes: [lane()] }]
});

test('planSections sets start ticks and resolves difficulty per stage key', () => {
    const planned = planSections(
        [
            { id: 'a', ticks: 10, stageKey: 'x' },
            { id: 'b', ticks: 5, stageKey: 'y' },
            { id: 'c', ticks: 10, stageKey: 'x' }
        ],
        { x: 0.2, y: 0.8 },
        25
    );
    assert.deepEqual(planned.map(s => s.startTick), [0, 10, 15]);
    assert.deepEqual(planned.map(s => s.difficulty), [0.2, 0.8, 0.2]);
});

test('planSections marks a repeated stage key as a repeat, and only from its second use', () => {
    const planned = planSections(
        [
            { id: 'a', ticks: 10, stageKey: 'x' },
            { id: 'b', ticks: 5, stageKey: 'y' },
            { id: 'c', ticks: 10, stageKey: 'x' }
        ],
        { x: 0.2, y: 0.8 },
        25
    );
    assert.deepEqual(planned.map(s => s.repeat), [false, false, true]);
});

test('planSections passes kind through when given', () => {
    const [section] = planSections([{ id: 'a', ticks: 4, kind: 'verse', stageKey: 'x' }], { x: 0.5 }, 4);
    assert.equal(section.kind, 'verse');
});

test('planSections accepts a direct difficulty when no stage key is given', () => {
    const [section] = planSections([{ id: 'a', ticks: 4, difficulty: 0.3 }], {}, 4);
    assert.equal(section.difficulty, 0.3);
    assert.equal(section.repeat, false);
});

test('planSections rejects a total that does not match the section ticks', () => {
    assert.throws(() => planSections([{ id: 'a', ticks: 10, difficulty: 0.5 }], {}, 12), /expected 12/);
});

test('planSections rejects a missing stage difficulty', () => {
    assert.throws(() => planSections([{ id: 'a', ticks: 4, stageKey: 'x' }], {}, 4), /No difficulty supplied/);
});

test('planSections rejects a difficulty outside 0 to 1', () => {
    assert.throws(() => planSections([{ id: 'a', ticks: 4, stageKey: 'x' }], { x: 1.5 }, 4), /0 to 1/);
    assert.throws(() => planSections([{ id: 'a', ticks: 4, difficulty: -0.1 }], {}, 4), /0 to 1/);
});

test('planSections rejects non-positive or fractional tick counts', () => {
    assert.throws(() => planSections([{ id: 'a', ticks: 0, difficulty: 0.5 }], {}, 0), /positive integer/);
    assert.throws(() => planSections([{ id: 'a', ticks: 1.5, difficulty: 0.5 }], {}, 1.5), /positive integer/);
});

test('planSections rejects duplicate section ids', () => {
    assert.throws(
        () => planSections([{ id: 'a', ticks: 2, difficulty: 0.1 }, { id: 'a', ticks: 2, difficulty: 0.1 }], {}, 4),
        /Duplicate section id/
    );
});

test('courseErrors accepts a valid course and assertValidCourse returns it', () => {
    assert.deepEqual(courseErrors(validCourse()), []);
    const course = validCourse();
    assert.equal(assertValidCourse(course), course);
});

test('courseErrors requires the main lane to be listed first', () => {
    const course = validCourse();
    course.sections[0].lanes = [lane({ id: 'alt', main: false }), lane()];
    assert.match(courseErrors(course).join('\n'), /listed first/);
});

test('courseErrors requires exactly one main lane', () => {
    const none = validCourse();
    none.sections[0].lanes = [lane({ main: false })];
    assert.match(courseErrors(none).join('\n'), /exactly one main lane, found 0/);

    const two = validCourse();
    two.sections[0].lanes = [lane(), lane({ id: 'other' })];
    assert.match(courseErrors(two).join('\n'), /exactly one main lane, found 2/);
});

test('courseErrors requires the main lane to be traversable', () => {
    const course = validCourse();
    course.sections[0].lanes = [lane({ traversable: false })];
    assert.match(courseErrors(course).join('\n'), /must be traversable/);
});

test('courseErrors rejects gaps between sections', () => {
    const course = {
        totalTicks: 20,
        sections: [
            { id: 's1', ticks: 10, startTick: 0, difficulty: 0.5, lanes: [lane()] },
            { id: 's2', ticks: 10, startTick: 11, difficulty: 0.5, lanes: [lane({ id: 'm2' })] }
        ]
    };
    assert.match(courseErrors(course).join('\n'), /contiguous/);
});

test('courseErrors rejects a course whose sections do not cover totalTicks', () => {
    const course = validCourse();
    course.totalTicks = 12;
    assert.match(courseErrors(course).join('\n'), /Sections cover 10 ticks, expected 12/);
});

test('courseErrors rejects a non-positive speedFactor, a missing surface and duplicate lane ids', () => {
    const slow = validCourse();
    slow.sections[0].lanes = [lane({ speedFactor: 0 })];
    assert.match(courseErrors(slow).join('\n'), /speedFactor/);

    const noSurface = validCourse();
    noSurface.sections[0].lanes = [lane({ surface: '' })];
    assert.match(courseErrors(noSurface).join('\n'), /needs a surface/);

    const dupes = validCourse();
    dupes.sections[0].lanes = [lane(), lane({ main: false, traversable: true })];
    assert.match(courseErrors(dupes).join('\n'), /duplicate lane id "main"/);
});

test('courseErrors rejects a section difficulty outside 0 to 1', () => {
    const course = validCourse();
    course.sections[0].difficulty = 2;
    assert.match(courseErrors(course).join('\n'), /difficulty must be a number from 0 to 1/);
});

test('assertValidCourse throws with every problem listed', () => {
    const course = validCourse();
    course.sections[0].lanes = [];
    assert.throws(() => assertValidCourse(course), /Invalid course: .*at least one lane/);
});

test('the genre-neutral core names no wormhole, song, ship or planet terms', async () => {
    const files = [
        new URL('../src/t13ne/modules/minigames/core/sectionPlan.js', import.meta.url),
        new URL('../src/t13ne/modules/minigames/core/courseContract.js', import.meta.url)
    ];
    for (const file of files) {
        const source = await readFile(file, 'utf8');
        assert.doesNotMatch(source, /wormhole|song|ship|planet|tunnel|wall/i);
    }
});
