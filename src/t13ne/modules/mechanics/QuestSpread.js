/**
 * Interpret six cards bottom-to-top. Each card's two Tao bits form the
 * corresponding lines of the situation and solution hexagrams.
 */
export function interpretQuestSpread(spread, hexagrams) {
    if (!spread || spread.spreadDefinition?.id !== 'quest-6-card' ||
        !Array.isArray(spread.cards) || spread.cards.length !== 6) {
        throw new TypeError('Quest interpretation requires a six-card Quest spread.');
    }
    if (!Array.isArray(hexagrams)) throw new TypeError('Quest interpretation requires hexagrams.');
    const logical = [0, 0];
    for (let index = 0; index < 6; index++) {
        const tao = spread.cards[index]?.card?.data?.Tao;
        if (!Array.isArray(tao) || tao.length !== 2 || tao.some(bit => bit !== 0 && bit !== 1)) {
            throw new TypeError(`Quest card ${index + 1} requires two binary Tao values.`);
        }
        logical[0] |= tao[0] << index;
        logical[1] |= tao[1] << index;
    }
    const lookup = value => {
        const matches = hexagrams.filter(record => record?.Hexagram?.Logical === value);
        if (matches.length !== 1) throw new Error(`Expected one hexagram for logical value ${value}.`);
        return matches[0];
    };
    const situation = lookup(logical[0]);
    const solution = lookup(logical[1]);
    const changingMask = logical[0] ^ logical[1];
    const lines = spread.cards.map((entry, index) => {
        const number = index + 1;
        const changing = Boolean(changingMask & (1 << index));
        return {
            number, card: entry.card, position: entry.position,
            situationTao: (logical[0] >> index) & 1,
            solutionTao: (logical[1] >> index) & 1,
            changing,
            quest: changing
                ? situation.Hexagram_Quest?.Line_Quests?.find(line => line.Line === number)?.Quest ?? null
                : null
        };
    });
    return { situation, solution, changingMask, lines };
}
