/**
 * Planet-surface adapter. Builds a course from terrain sections with no wormhole, song or ship terms.
 * It must pass the same courseErrors contract as the wormhole adapter.
 * Calibration values are placeholders for the Author to tune.
 */
import { planSections } from '../../core/sectionPlan.js';
import { assertValidCourse } from '../../core/courseContract.js';
import { stageDifficultyRatio } from '../../../systems/ordeals/t13ne-stage-difficulty.js';

export const PLANET_SECTIONS = [
    { id: 'open-ground', kind: 'open', ticks: 60, stageKey: 'open-ground' },
    { id: 'ridge', kind: 'ridge', ticks: 80, stageKey: 'ridge' },
    { id: 'run-in', kind: 'open', ticks: 60, stageKey: 'run-in' }
];

export const PLANET_CALIBRATION = {
    maxAlternates: 2,
    speedFirm: 1.0,
    speedLoose: 0.6,
    speedRubble: 0.4
};

/**
 * @param {object} args
 * @param {Record<string, Array<{pips: (string|number)}>>} args.stageCardsByKey Difficulty cards per stage key.
 * @param {Array<object>} [args.sections]
 * @param {object} [args.calibration]
 * @returns {object} A validated course.
 */
export function buildPlanetCourse({ stageCardsByKey, sections = PLANET_SECTIONS, calibration = PLANET_CALIBRATION }) {
    const difficultyByKey = {};
    for (const section of sections) {
        if (section.stageKey === undefined || difficultyByKey[section.stageKey] !== undefined) continue;
        const cards = stageCardsByKey && stageCardsByKey[section.stageKey];
        if (!cards) throw new Error(`No Stage cards supplied for "${section.stageKey}"`);
        difficultyByKey[section.stageKey] = stageDifficultyRatio(cards);
    }

    const totalTicks = sections.reduce((sum, s) => sum + s.ticks, 0);
    const planned = planSections(sections, difficultyByKey, totalTicks);

    const course = {
        totalTicks,
        sections: planned.map(section => ({
            ...section,
            lanes: buildLanes(section.difficulty, calibration)
        }))
    };
    return assertValidCourse(course);
}

function buildLanes(difficulty, calibration) {
    const lanes = [
        { id: 'firm', surface: 'firm', traversable: true, speedFactor: calibration.speedFirm, main: true }
    ];
    const alternates = Math.round(difficulty * calibration.maxAlternates);
    for (let k = 1; k <= alternates; k++) {
        if (k % 2 === 1) {
            lanes.push({ id: `loose-${k}`, surface: 'loose', traversable: true, speedFactor: calibration.speedLoose });
        } else {
            lanes.push({ id: `rubble-${k}`, surface: 'rubble', traversable: false, speedFactor: calibration.speedRubble });
        }
    }
    return lanes;
}
