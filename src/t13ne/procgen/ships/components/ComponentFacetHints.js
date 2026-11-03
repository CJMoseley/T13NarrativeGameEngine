const INCARNA_CANDIDATES = {
    engine: ['Zeal'],
    shield: ['Rook']
};

export function getComponentIncarnaCandidates(usage) {
    if (typeof usage !== 'string') {
        throw new TypeError('Component usage must be a string.');
    }
    const key = usage.trim().toLowerCase();
    return Object.hasOwn(INCARNA_CANDIDATES, key) ? [...INCARNA_CANDIDATES[key]] : [];
}
