import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getDifficultyModifiers } from '../src/t13ne/modules/mechanics/FacetRuleEffects.js';
import { evaluateHitch } from '../src/t13ne/modules/mechanics/HitchRules.js';
import craft from '../src/t13ne/data/facets/craft.js';

test('Dice Tests apply explicit Score Difficulty effects and preserve Pip modifiers', async () => {
    const source = await readFile('src/t13ne/modules/mechanics/t13ne-tests.js', 'utf8');
    const code = source
        .replace(/import (\w+) from [^;]+;/g, (_, name) => `const ${name} = globalThis.__testModules.${name};`)
        .replace(/import \{ getDifficultyModifiers \} from [^;]+;/,
            'const getDifficultyModifiers = globalThis.__testModules.getDifficultyModifiers;');
    globalThis.__testModules = {
        getDifficultyModifiers,
        T13Dice: { RNG: () => 6 },
        T13Boons: {},
        Logger: { warn() {}, message() {}, error() {} },
        CodexLoader: {}, T13NECardsAPI: {}, T13NE_Facets: {}, T13NE_Stakes: {},
        T13NE_Sway: {}, T13NE_Stress: {}, T13NE_Resources: {}
    };
    try {
        const tests = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
        const options = { difficulty: 5, potency: 'Bold', proficiencies: 1 };
        assert.equal((await tests.performTest('Dice', {}, options)).success, true);
        const result = await tests.performTest('Dice', {}, {
            ...options, difficultyEffects: [
                { kind: 'difficulty', score: 2, pips: 1 },
                { kind: 'difficulty', score: 1, pips: 0.5 }
            ]
        });
        assert.equal(result.targetDifficulty, 8);
        assert.equal(result.success, false);
        assert.deepEqual(result.difficultyModifiers, { score: 3, pips: 1.5 });
        const masks = { ROOT: 1 << 4, GNARL: 1 << 9, TRIGGER: 1 << 13 };
        const hitch = {
            bane: 3,
            knot: { getAssociations: () => new Map([['engine', masks.ROOT | masks.GNARL | masks.TRIGGER]]) },
            codexLoader: { async getProficiency() { return { id: 'engine', tags: { facets: ['Craft'] } }; } }
        };
        const evaluated = await evaluateHitch(hitch, {
            triggerIds: ['engine'], facets: { async getFacet() { return craft; } }
        }, masks, { getBoonReduced: () => 1, getBoonDraw: () => 0.5 });
        const affected = await tests.performTest('Dice', {}, { ...options, difficultyEffects: evaluated.effects });
        assert.equal(affected.success, false);
        assert.equal(affected.targetDifficulty, 8);
        assert.deepEqual(affected.difficultyModifiers, { score: 3, pips: 1 });
        await assert.rejects(tests.performTest('Dice', {}, {
            ...options, difficultyEffects: [{ kind: 'stress', amount: 1 }]
        }), /other effects require separate resolution/);
        await assert.rejects(tests.performTest('Value', {}, { difficultyEffects: [] }), /only for Dice/);
    } finally {
        delete globalThis.__testModules;
    }
});
