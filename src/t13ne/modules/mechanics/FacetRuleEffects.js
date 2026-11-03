export function getDifficultyModifiers(effects) {
    if (!Array.isArray(effects)) throw new TypeError('Difficulty effects must be an array.');
    return effects.reduce((total, effect) => {
        if (!effect || effect.kind !== 'difficulty' ||
            !Number.isFinite(effect.score) || effect.score < 0 ||
            !Number.isFinite(effect.pips) || effect.pips < 0) {
            throw new TypeError('Invalid difficulty effect; other effects require separate resolution.');
        }
        return { score: total.score + effect.score, pips: total.pips + effect.pips };
    }, { score: 0, pips: 0 });
}
