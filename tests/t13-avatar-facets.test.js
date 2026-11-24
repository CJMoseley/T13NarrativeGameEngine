import test from 'node:test';
import assert from 'node:assert/strict';
import {
    FACET_INDEX,
    NEUTRAL_BOON,
    bodyFromFacets,
    facetBoonsFromStats,
    adjectiveForBoon,
    appearanceFromFacets,
    applyVividness,
    tintSkin,
    materialForFormation,
    FORMATION_MATERIALS
} from '../src/t13ne/procgen/avatar/AvatarFacetBody.js';

const neutral = { [FACET_INDEX.BURDEN]: NEUTRAL_BOON, [FACET_INDEX.NATURE]: NEUTRAL_BOON, [FACET_INDEX.GOSSAMER]: NEUTRAL_BOON, [FACET_INDEX.ZEAL]: NEUTRAL_BOON, [FACET_INDEX.INERTIA]: NEUTRAL_BOON };

test('neutral Archetype boons (13) give an unchanged body', () => {
    assert.deepEqual(bodyFromFacets(neutral), { height: 1, build: 1, musculature: 0, litheness: 0 });
    assert.deepEqual(bodyFromFacets({}), { height: 1, build: 1, musculature: 0, litheness: 0 });
});

test('Burden raises build, Nature raises height', () => {
    const heavy = bodyFromFacets({ ...neutral, [FACET_INDEX.BURDEN]: 26 });
    const tall = bodyFromFacets({ ...neutral, [FACET_INDEX.NATURE]: 26 });
    assert.ok(heavy.build > 1 && heavy.height === 1);
    assert.ok(tall.height > 1 && tall.build === 1);
});

test('Gossamer sets musculature, signed', () => {
    assert.ok(bodyFromFacets({ ...neutral, [FACET_INDEX.GOSSAMER]: 26 }).musculature > 0);
    assert.ok(bodyFromFacets({ ...neutral, [FACET_INDEX.GOSSAMER]: 0 }).musculature < 0);
});

test('Zeal above Inertia gives litheness, Inertia above Zeal gives momentum', () => {
    assert.ok(bodyFromFacets({ ...neutral, [FACET_INDEX.ZEAL]: 26 }).litheness > 0);
    assert.ok(bodyFromFacets({ ...neutral, [FACET_INDEX.INERTIA]: 26 }).litheness < 0);
});

test('body values stay within their documented bounds at extreme boons', () => {
    for (const boon of [0, 13, 37, 100, -50]) {
        const all = Object.fromEntries(Object.values(FACET_INDEX).map(i => [i, boon]));
        const b = bodyFromFacets(all);
        assert.ok(b.height >= 0.9 && b.height <= 1.1, `height ${b.height} at boon ${boon}`);
        assert.ok(b.build >= 0.8 && b.build <= 1.2, `build ${b.build} at boon ${boon}`);
        assert.ok(b.musculature >= -1 && b.musculature <= 1);
        assert.ok(b.litheness >= -1 && b.litheness <= 1);
    }
});

test('facetBoonsFromStats reads both sides of each opposed pair', () => {
    const boons = facetBoonsFromStats([
        { Facet: 1, Antifacet: 6, Facet_Boon: 20, Antifacet_Boon: 6 },
        { Facet: 13, Antifacet: 2, Facet_Boon: 9, Antifacet_Boon: 17 }
    ]);
    assert.deepEqual(boons, { 1: 20, 6: 6, 13: 9, 2: 17 });
});

test('adjectiveForBoon picks the highest rung at or below the boon', () => {
    assert.equal(adjectiveForBoon(FACET_INDEX.AWE, 0).Adjective, 'Soulless');
    assert.equal(adjectiveForBoon(FACET_INDEX.AWE, 13).Adjective, 'Plain');
    assert.equal(adjectiveForBoon(FACET_INDEX.AWE, 37).Adjective, 'Sublime');
    assert.equal(adjectiveForBoon(FACET_INDEX.AWE, 99).Adjective, 'Sublime');
});

test('appearanceFromFacets: high Awe increases vividness, high Miasma tints and mottles skin', () => {
    const awe = appearanceFromFacets({ [FACET_INDEX.AWE]: 30 });
    assert.ok(awe.clothingVividness > 1);
    const miasma = appearanceFromFacets({ [FACET_INDEX.MIASMA]: 30 });
    assert.ok(miasma.skinTint > 0 && miasma.mottle > 0);
    const neutralLook = appearanceFromFacets({});
    assert.equal(neutralLook.clothingVividness, 1);
    assert.equal(neutralLook.skinTint, 0);
    assert.equal(neutralLook.mottle, 0);
});

test('appearanceFromFacets names the adjective for each facet used', () => {
    const { descriptors } = appearanceFromFacets({ [FACET_INDEX.AWE]: 37, [FACET_INDEX.BURDEN]: 0 });
    assert.equal(descriptors.awe, 'Sublime');
    assert.equal(descriptors.burden, 'Incorporeal');
});

test('applyVividness leaves neutral colour alone and pushes saturated colour further', () => {
    assert.equal(applyVividness(0x808080, 1.5), 0x808080);
    assert.equal(applyVividness(0xc08060, 1), 0xc08060);
    const more = applyVividness(0xc08060, 1.5);
    assert.ok(((more >> 16) & 255) > 0xc0);
    assert.ok((more & 255) < 0x60);
});

test('Formation picks the material family, with Nature (flesh) as the fallback', () => {
    assert.equal(materialForFormation('Trial'), 'metal');
    assert.equal(materialForFormation('Quiet'), 'wood');
    assert.equal(materialForFormation('Rook'), 'armour');
    assert.equal(materialForFormation(null), 'flesh');
    assert.equal(materialForFormation('NotAFacet'), 'flesh');
    assert.equal(Object.keys(FORMATION_MATERIALS).length, 17);
});

test('tintSkin is identity at zero and moves toward olive for positive Miasma', () => {
    const skin = 0xd9a07a;
    const olive = 0x7d8a3c;
    const distance = (a, b) => [16, 8, 0].reduce((sum, s) => sum + Math.abs(((a >> s) & 255) - ((b >> s) & 255)), 0);
    assert.equal(tintSkin(skin, 0), skin);
    const sick = tintSkin(skin, 1);
    assert.ok(distance(sick, olive) < distance(skin, olive), 'skin moves closer to olive');
});
