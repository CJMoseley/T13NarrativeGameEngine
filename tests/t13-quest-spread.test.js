import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { interpretQuestSpread } from '../src/t13ne/modules/mechanics/QuestSpread.js';

test('Quest cards form bottom-to-top situation and solution hexagrams', async () => {
    const hexagrams = await Promise.all(Array.from({ length: 64 }, async (_, index) =>
        JSON.parse(await readFile(`src/t13ne/data/json/iching/hexagrams/hex_${index + 1}.json`, 'utf8'))));
    const spread = {
        spreadDefinition: { id: 'quest-6-card' },
        cards: Array.from({ length: 6 }, (_, index) => ({
            card: { data: { Tao: [1, index === 5 ? 1 : 0] } }, position: { role: `Line ${index + 1}` }
        }))
    };
    const result = interpretQuestSpread(spread, hexagrams);
    assert.equal(result.situation.Hexagram.Number, 1);
    assert.equal(result.situation.Hexagram.Logical, 63);
    assert.equal(result.solution.Hexagram.Logical, 32);
    assert.equal(result.changingMask, 31);
    assert.deepEqual(result.lines.map(line => line.changing), [true, true, true, true, true, false]);
    assert.equal(result.lines[0].quest, result.situation.Hexagram_Quest.Line_Quests[0].Quest);
    assert.equal(result.lines[5].quest, null);
    assert.equal(result.lines[0].position.role, 'Line 1');
    assert.throws(() => interpretQuestSpread({ ...spread, cards: spread.cards.slice(1) }, hexagrams), /six-card/);
    const invalid = structuredClone(spread);
    invalid.cards[0].card.data.Tao = [2, 0];
    assert.throws(() => interpretQuestSpread(invalid, hexagrams), /binary Tao/);
    assert.throws(() => interpretQuestSpread(spread, []), /one hexagram/);
    for (let value = 0; value < 64; value++) {
        const cards = Array.from({ length: 6 }, (_, index) => ({
            card: { data: { Tao: [(value >> index) & 1, (value >> index) & 1] } }
        }));
        const identical = interpretQuestSpread({ ...spread, cards }, hexagrams);
        assert.equal(identical.situation.Hexagram.Logical, value);
        assert.equal(identical.solution.Hexagram.Logical, value);
        assert.equal(identical.changingMask, 0);
    }
});

test('Cards API exposes Quest interpretation using the initialized I-Ching module', async () => {
    let source = await readFile('src/t13ne/modules/mechanics/t13ne-cards-api.js', 'utf8');
    source = source.replace(/import \{ Card, Deck \} from [^;]+;/,
        'const { Card, Deck } = globalThis.__questModules;')
        .replace(/import \{ interpretQuestSpread \} from [^;]+;/,
            'const { interpretQuestSpread } = globalThis.__questModules;')
        .replace(/import (\w+) from [^;]+;/g,
            (_, name) => `const ${name} = globalThis.__questModules.${name};`);
    globalThis.__questModules = {
        Card: class {}, Deck: class {}, PRNG: {}, dice: {}, Logger: {}, CodexLoader: {}, interpretQuestSpread
    };
    try {
        const api = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
        const spread = {
            spreadDefinition: { id: 'quest-6-card' },
            cards: Array.from({ length: 6 }, () => ({ card: { data: { Tao: [1, 0] } } }))
        };
        assert.throws(() => api.interpretQuestSpread(spread), /initialized/);
        const records = await Promise.all([1, 2].map(async number =>
            JSON.parse(await readFile(`src/t13ne/data/json/iching/hexagrams/hex_${number}.json`, 'utf8'))));
        api.t13ne = { getModule: () => ({ initialized: true, iching: records }) };
        const quest = api.interpretQuestSpread(spread);
        assert.equal(quest.situation.Hexagram.Number, 1);
        assert.equal(quest.solution.Hexagram.Number, 2);
        assert.equal(quest.changingMask, 63);
    } finally {
        delete globalThis.__questModules;
    }
});
