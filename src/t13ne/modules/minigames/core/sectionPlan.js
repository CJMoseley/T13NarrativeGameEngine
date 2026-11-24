/**
 * Genre-neutral sectioning of a timeline.
 * A section is a span of ticks. Its difficulty comes from a Stage key, so sections that share a key repeat it.
 * Nothing here knows about any particular game genre.
 */

/**
 * @param {Array<{id: string, ticks: number, kind?: string, stageKey?: string, difficulty?: number}>} specs
 * @param {Record<string, number>} difficultyByKey Difficulty per stage key, each from 0 to 1.
 * @param {number} totalTicks Required total of all section ticks.
 * @returns {Array<object>} Planned sections with startTick, difficulty and repeat set.
 * @throws {Error} If the specs do not describe a valid timeline.
 */
export function planSections(specs, difficultyByKey, totalTicks) {
    if (!Array.isArray(specs) || specs.length === 0) throw new Error('planSections needs at least one section');
    if (!Number.isInteger(totalTicks) || totalTicks <= 0) throw new Error('totalTicks must be a positive integer');

    const seenIds = new Set();
    const seenKeys = new Set();
    let cursor = 0;

    const sections = specs.map(spec => {
        if (typeof spec.id !== 'string' || spec.id === '') throw new Error('Every section needs an id');
        if (seenIds.has(spec.id)) throw new Error(`Duplicate section id "${spec.id}"`);
        seenIds.add(spec.id);

        if (!Number.isInteger(spec.ticks) || spec.ticks <= 0) {
            throw new Error(`Section "${spec.id}" needs a positive integer tick count`);
        }

        const difficulty = resolveDifficulty(spec, difficultyByKey);
        const repeat = spec.stageKey !== undefined && seenKeys.has(spec.stageKey);
        if (spec.stageKey !== undefined) seenKeys.add(spec.stageKey);

        const planned = {
            id: spec.id,
            ticks: spec.ticks,
            startTick: cursor,
            difficulty,
            repeat
        };
        if (spec.kind !== undefined) planned.kind = spec.kind;
        if (spec.stageKey !== undefined) planned.stageKey = spec.stageKey;

        cursor += spec.ticks;
        return planned;
    });

    if (cursor !== totalTicks) {
        throw new Error(`Section ticks sum to ${cursor}, expected ${totalTicks}`);
    }
    return sections;
}

function resolveDifficulty(spec, difficultyByKey) {
    let difficulty;
    if (spec.stageKey !== undefined) {
        if (!difficultyByKey || !(spec.stageKey in difficultyByKey)) {
            throw new Error(`No difficulty supplied for stage key "${spec.stageKey}" in section "${spec.id}"`);
        }
        difficulty = difficultyByKey[spec.stageKey];
    } else {
        difficulty = spec.difficulty;
    }
    if (typeof difficulty !== 'number' || !Number.isFinite(difficulty) || difficulty < 0 || difficulty > 1) {
        throw new Error(`Section "${spec.id}" difficulty must be a number from 0 to 1`);
    }
    return difficulty;
}
