import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlanetCourse, PLANET_SECTIONS } from '../src/t13ne/modules/minigames/adapters/planetSurface/planetCourse.js';
import { buildWormholeCourse } from '../src/t13ne/modules/minigames/adapters/wormhole/wormholeCourse.js';
import { courseErrors } from '../src/t13ne/modules/minigames/core/courseContract.js';

const easy = [{ pips: '2' }];
const hard = [{ pips: '15' }, { pips: '15' }, { pips: '15' }];
const planetCards = { 'open-ground': easy, ridge: hard, 'run-in': easy };

test('a planet surface course passes the shared course contract', () => {
    const course = buildPlanetCourse({ stageCardsByKey: planetCards });
    assert.deepEqual(courseErrors(course), []);
    assert.equal(course.totalTicks, PLANET_SECTIONS.reduce((sum, s) => sum + s.ticks, 0));
});

test('a planet surface course carries no wormhole, tunnel or ship terms', () => {
    const course = buildPlanetCourse({ stageCardsByKey: planetCards });
    const text = JSON.stringify(course);
    assert.doesNotMatch(text, /wall|tunnel|modifier|spine|shield|song|beat|resonance|fork/i);
});

test('a planet surface main lane is firm and traversable at full speed', () => {
    const course = buildPlanetCourse({ stageCardsByKey: planetCards });
    for (const section of course.sections) {
        assert.equal(section.lanes[0].id, 'firm');
        assert.equal(section.lanes[0].traversable, true);
        assert.equal(section.lanes[0].speedFactor, 1);
    }
});

test('alternate lanes scale with difficulty, and loose lanes are traversable while rubble is not', () => {
    const course = buildPlanetCourse({ stageCardsByKey: planetCards });
    const easySection = course.sections.find(s => s.id === 'open-ground');
    const ridge = course.sections.find(s => s.id === 'ridge');
    assert.equal(easySection.lanes.length, 1);
    assert.equal(ridge.lanes.length, 3);
    const [, loose, rubble] = ridge.lanes;
    assert.equal(loose.surface, 'loose');
    assert.equal(loose.traversable, true);
    assert.equal(rubble.surface, 'rubble');
    assert.equal(rubble.traversable, false);
});

test('both adapters pass the same course contract', () => {
    const planet = buildPlanetCourse({ stageCardsByKey: planetCards });
    const wormhole = buildWormholeCourse({
        stageCardsByKey: { intro: easy, verse: hard, chorus: hard, bridge: hard, solo: hard, outro: easy },
        tuning: [3, 2]
    });
    assert.deepEqual(courseErrors(planet), []);
    assert.deepEqual(courseErrors(wormhole), []);
});

test('a planet surface course rejects a missing Stage card set', () => {
    assert.throws(() => buildPlanetCourse({ stageCardsByKey: { 'open-ground': easy } }), /No Stage cards supplied for "ridge"/);
});
