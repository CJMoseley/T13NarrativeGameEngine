import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('changing lines use the logical values of the source hexagrams', async () => {
    const source = await readFile('src/t13ne/modules/mechanics/t13ne-iching.js', 'utf8');
    const code = source.replace(/import (\w+) from [^;]+;/g,
        (_, name) => `const ${name} = globalThis.__ichingTestModules.${name};`);
    globalThis.__ichingTestModules = {
        CodexLoader: {}, T13Dice: {}, Logger: { message() {}, warn() {}, error() {} }
    };
    try {
        const iching = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
        const creative = JSON.parse(await readFile('src/t13ne/data/json/iching/hexagrams/hex_1.json', 'utf8'));
        const receptive = JSON.parse(await readFile('src/t13ne/data/json/iching/hexagrams/hex_2.json', 'utf8'));
        assert.throws(() => iching.binXor(0, 1), /initialized/);
        iching.initialized = true;
        iching.iching = [creative, receptive];
        assert.equal(iching.binXor(0, 1), 63);
        assert.equal(iching.binXor(0, 0), 0);
        const rendered = iching.displayChangingLines(0, 1, false, true);
        for (let line = 1; line <= 6; line++) {
            assert.match(rendered, new RegExp(`Line ${line}`));
        }
        assert.doesNotMatch(iching.displayChangingLines(-1, 0, true, true), /Changing Lines/);
        assert.throws(() => iching.binXor(0, 2), /indexes/);
        iching.iching[1] = { Hexagram: { Logical: 64 } };
        assert.throws(() => iching.binXor(0, 1), /six-bit/);
        iching.iching = await Promise.all(Array.from({ length: 64 }, async (_, index) =>
            JSON.parse(await readFile(`src/t13ne/data/json/iching/hexagrams/hex_${index + 1}.json`, 'utf8'))));
        const stats = Array.from({ length: 12 }, (_, index) => ({
            Facet_Boon: index < 6 ? 14 : 12, Antifacet_Boon: 13
        }));
        const calculated = iching.calculateIChing(stats);
        assert.deepEqual(calculated, [0, 1]);
        const tied = stats.map(pair => ({ ...pair, Facet_Boon: 13 }));
        assert.deepEqual(iching.calculateIChing(tied, { chooseTie: ({ index }) => index < 6 ? 1 : 0 }), [0, 1]);
        assert.throws(() => iching.calculateIChing(tied, { chooseTie: () => 2 }), /0 or 1/);
        assert.throws(() => iching.calculateIChing(stats.slice(1)), /twelve/);
        assert.throws(() => iching.calculateIChing([{ ...stats[0], Facet_Boon: NaN }, ...stats.slice(1)]), /finite/);
        const unchanging = iching.getCharacterRules([0, 0]);
        assert.equal(unchanging.unchangingPower, creative.Hexagram.Unchanging);
        assert.equal(unchanging.changingLines.length, 0);
        const changing = iching.getCharacterRules([0, 1]);
        assert.equal(changing.unchangingPower, null);
        assert.equal(changing.changingLines.length, 6);

        const tapestrySource = await readFile('src/t13ne/modules/world/T13Tapestry.js', 'utf8');
        const tapestryCode = tapestrySource.replace(/import (\w+) from [^;]+;/g,
            (_, name) => `const ${name} = globalThis.__ichingTestModules.${name};`);
        class FacetWeb {
            constructor(data) { this.Stats = data.Stats; }
            static buildStats() { return stats; }
            calculateIChing() { return iching.calculateIChing(this.Stats); }
        }
        Object.assign(globalThis.__ichingTestModules, {
            FacetWeb, T13NE_Facets: {}, T13Boons: {}, T13NE_PRNG: {}, T13Name: {}
        });
        const tapestry = (await import(`data:text/javascript;base64,${Buffer.from(tapestryCode).toString('base64')}`)).default;
        assert.deepEqual(tapestry.setStats(1, [13], [0], 0, '%').Hex, [0, 1]);
        assert.deepEqual(tapestry.setStats(1, [13], [0], 0, ['%', '%']).Hex, [0, 1]);
    } finally {
        delete globalThis.__ichingTestModules;
    }
});
