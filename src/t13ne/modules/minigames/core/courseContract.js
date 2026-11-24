/**
 * Genre-neutral course contract.
 * A course is a timeline of sections. Each section offers surface lanes, and exactly one lane is the main lane.
 * The main lane is listed first and is always traversable, so a course can always be completed.
 * Adapters build courses that pass this contract. The contract knows no genre terms.
 */

/**
 * @param {object} course
 * @returns {string[]} Every problem found. An empty array means the course is valid.
 */
export function courseErrors(course) {
    const errors = [];
    if (!course || typeof course !== 'object') return ['Course must be an object'];
    if (!Number.isInteger(course.totalTicks) || course.totalTicks <= 0) {
        errors.push('totalTicks must be a positive integer');
    }
    if (!Array.isArray(course.sections) || course.sections.length === 0) {
        errors.push('Course needs at least one section');
        return errors;
    }

    const seenSectionIds = new Set();
    let cursor = 0;

    course.sections.forEach((section, index) => {
        const label = `Section ${index}`;
        if (typeof section.id !== 'string' || section.id === '') {
            errors.push(`${label} needs an id`);
        } else if (seenSectionIds.has(section.id)) {
            errors.push(`Duplicate section id "${section.id}"`);
        } else {
            seenSectionIds.add(section.id);
        }

        if (!Number.isInteger(section.ticks) || section.ticks <= 0) {
            errors.push(`${label} needs a positive integer tick count`);
        }
        if (section.startTick !== cursor) {
            errors.push(`${label} starts at ${section.startTick}, expected ${cursor} (ticks must be contiguous)`);
        }
        if (Number.isInteger(section.ticks) && section.ticks > 0) cursor += section.ticks;

        if (typeof section.difficulty !== 'number' || section.difficulty < 0 || section.difficulty > 1) {
            errors.push(`${label} difficulty must be a number from 0 to 1`);
        }

        errors.push(...laneErrors(section.lanes, label));
    });

    if (Number.isInteger(course.totalTicks) && cursor !== course.totalTicks) {
        errors.push(`Sections cover ${cursor} ticks, expected ${course.totalTicks}`);
    }
    return errors;
}

function laneErrors(lanes, label) {
    const errors = [];
    if (!Array.isArray(lanes) || lanes.length === 0) {
        return [`${label} needs at least one lane`];
    }

    const mainIndexes = lanes.map((lane, i) => (lane && lane.main === true ? i : -1)).filter(i => i >= 0);
    if (mainIndexes.length !== 1) {
        errors.push(`${label} must have exactly one main lane, found ${mainIndexes.length}`);
    } else {
        if (mainIndexes[0] !== 0) errors.push(`${label} main lane must be listed first`);
        if (lanes[mainIndexes[0]].traversable !== true) errors.push(`${label} main lane must be traversable`);
    }

    const seenLaneIds = new Set();
    lanes.forEach((lane, i) => {
        const laneLabel = `${label} lane ${i}`;
        if (!lane || typeof lane !== 'object') {
            errors.push(`${laneLabel} must be an object`);
            return;
        }
        if (typeof lane.id !== 'string' || lane.id === '') {
            errors.push(`${laneLabel} needs an id`);
        } else if (seenLaneIds.has(lane.id)) {
            errors.push(`${label} has duplicate lane id "${lane.id}"`);
        } else {
            seenLaneIds.add(lane.id);
        }
        if (typeof lane.surface !== 'string' || lane.surface === '') {
            errors.push(`${laneLabel} needs a surface`);
        }
        if (typeof lane.traversable !== 'boolean') {
            errors.push(`${laneLabel} traversable must be a boolean`);
        }
        if (typeof lane.speedFactor !== 'number' || !Number.isFinite(lane.speedFactor) || lane.speedFactor <= 0) {
            errors.push(`${laneLabel} speedFactor must be a positive number`);
        }
    });
    return errors;
}

/**
 * @param {object} course
 * @returns {object} The same course, when valid.
 * @throws {Error} Listing every problem found.
 */
export function assertValidCourse(course) {
    const errors = courseErrors(course);
    if (errors.length > 0) throw new Error(`Invalid course: ${errors.join('; ')}`);
    return course;
}
