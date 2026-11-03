/**
 * Resolve a direct physical Value comparison and, on success, apply the
 * caller-calibrated force once. Repeated application requires a new call.
 */
export function applyPhysicalValueTest({ contributions, resistance, force, target, physics }) {
    if (!Array.isArray(contributions) || contributions.length === 0 ||
        contributions.some(value => !Number.isFinite(value) || value < 0) ||
        !Number.isFinite(resistance) || resistance < 0) {
        throw new TypeError('Physical Value Tests require non-negative finite Values.');
    }
    if (!force || !['x', 'y', 'z'].every(axis => Number.isFinite(force[axis])) ||
        !target || !physics || typeof physics.applyForce !== 'function') {
        throw new TypeError('Physical Value Tests require a target, a finite force vector and a physics provider.');
    }
    const actorValue = contributions.reduce((sum, value) => sum + value, 0);
    if (!Number.isFinite(actorValue)) throw new RangeError('Combined Value is too large.');
    const outcome = actorValue > resistance ? 'success' : actorValue < resistance ? 'failure' : 'tie';
    if (outcome === 'success') physics.applyForce(target, force);
    return { actorValue, resistance, outcome, forceApplied: outcome === 'success' };
}
