import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateValue, tidyName } from '../src/t13ne/modules/world/t13ne-gematria.js';
import { calculateValue as companionValue } from '../ttrpg-companion/src/t13ne/modules/world/t13ne-gematria.js';
import { characterGuidance, guidanceForPrompt } from '../src/t13ne/modules/characters/t13ne-character-guidance.js';
import T13Name from '../src/t13ne/modules/characters/t13ne-names.js';
import { crunch } from '../src/t13ne/modules/world/t13ne-gematria.js';

test('gematria follows the PHP overlapping letter and digraph rules', () => {
    for (const [name, expected] of [['ch', 9], ['th', 3], ['Phantasm', 9], ['z', 7]]) {
        assert.equal(calculateValue(name), expected, name);
        assert.equal(companionValue(name), expected, name);
    }
    assert.equal(tidyName('Ægir Müller'), 'aegirmuller');
    assert.equal(calculateValue('Ægir Müller'), calculateValue('aegirmuller'));
    assert.deepEqual(new T13Name('Émile').geometryData, new T13Name('Emile').geometryData);
});

test('geometry and name scoring agree with the codex numerology table', async () => {
    const numerology = JSON.parse(await readFile(new URL('../src/t13ne/data/json/geometry/numerology.json', import.meta.url), 'utf8'));
    for (const name of ['Phantasm', 'ch', 'th', 'Ægir Müller', 'Shoshanna']) {
        const normalized = tidyName(name);
        const total = numerology.reduce((sum, { data: { Letter, Number } }) =>
            sum + (normalized.split(Letter).length - 1) * Number, 0);
        assert.equal(crunch(total), calculateValue(name), name);
        assert.equal(crunch(total), new T13Name(name).geometryData.geometryNumber, name);
    }
});

test('updated geometry traits guide character decisions and language', async () => {
    for (const path of [
        new URL('../src/t13ne/data/json/geometry/geometries.json', import.meta.url),
        new URL('../ttrpg-companion/src/t13ne/data/json/geometry/geometries.json', import.meta.url)
    ]) {
        const geometries = JSON.parse(await readFile(path, 'utf8'));
        const circle = geometries.find(entry => entry.data.Geometry === 1).data;
        const guidance = characterGuidance({ Geo: circle });
        assert.ok(guidance.negativeTraits.includes('Stubborn'));
        const prompt = guidanceForPrompt(guidance);
        assert.match(prompt, /Stubborn/);
        assert.match(prompt, /decisions, manner, word choice/);
        assert.match(prompt, /history and circumstances/);
    }
    assert.equal(guidanceForPrompt(characterGuidance(null)), '');
});
