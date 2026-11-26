/**
 * Geometry keys expose their frequency on Key; synthetic keys may be flat.
 */
export function musicKeyFrequency(keyData) {
    const frequency = keyData?.Key?.Frequency ?? keyData?.Frequency;
    if (!Number.isFinite(frequency) || frequency <= 0) {
        throw new RangeError('Music key must have a positive finite frequency.');
    }
    return frequency;
}
