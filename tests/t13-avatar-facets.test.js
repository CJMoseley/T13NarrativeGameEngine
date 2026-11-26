import test from 'node:test';
import assert from 'node:assert/strict';
import {
    FACET_INDEX,
    NEUTRAL_BOON,
    INCHES_TO_CM,
    HUMAN_NEUTRAL_HEIGHT_CM,
    bodyFromFacets,
    facetBoonsFromStats,
    adjectiveForBoon,
    appearanceFromFacets,
    applyVividness,
    tintSkin,
    materialForFormation,
    FORMATION_MATERIALS,
    resolveFormation,
    calculateSpeciesSize,
    formatHeightCm,
    descendantAvatarData
} from '../src/t13ne/procgen/avatar/AvatarFacetBody.js';
import { AvatarEngine, makeHumanoidVariant } from '../src/t13ne/procgen/avatar/AvatarEngine.js';
import { BODY_PLANS } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';
import { ATLAS_SIZE, FORMATION_PALETTES } from '../src/t13ne/procgen/avatar/AvatarAtlas.js';
import T13Boons from '../src/t13ne/modules/mechanics/t13ne-boon.js';

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
    assert.equal(materialForFormation('Zeal'), 'belief');
    assert.equal(materialForFormation('Gossamer'), 'gas');
    assert.equal(Object.keys(FORMATION_MATERIALS).length, 24);
});

test('tintSkin is identity at zero and moves toward olive for positive Miasma', () => {
    const skin = 0xd9a07a;
    const olive = 0x7d8a3c;
    const distance = (a, b) => [16, 8, 0].reduce((sum, s) => sum + Math.abs(((a >> s) & 255) - ((b >> s) & 255)), 0);
    assert.equal(tintSkin(skin, 0), skin);
    const sick = tintSkin(skin, 1);
    assert.ok(distance(sick, olive) < distance(skin, olive), 'skin moves closer to olive');
});

test('T13Boons.getBoonValue matches the authoritative Boons table and Human size converts inches to cm', () => {
    assert.equal(T13Boons.getBoonValue(0), 0);
    assert.equal(T13Boons.getBoonValue(1), 2);
    assert.equal(T13Boons.getBoonValue(12), 59);
    assert.equal(T13Boons.getBoonValue(13), 66);
    assert.equal(T13Boons.getBoonValue(14), 74);
    assert.equal(T13Boons.getBoonValue(26), 203);
    assert.equal(T13Boons.getBoonValue(37), 373);
    assert.equal(HUMAN_NEUTRAL_HEIGHT_CM, 66 * INCHES_TO_CM);

    // Without a species rule, retain existing Nature-to-height behavior
    const unconfigured = calculateSpeciesSize({ boons: { [FACET_INDEX.NATURE]: 26 } });
    assert.equal(unconfigured.ruleApplied, false);
    assert.equal(unconfigured.heightCm, null);
    assert.equal(unconfigured.heightScale, 1.1);

    // Human rule converts Nature Boon's T13 Value from inches to centimetres
    const humanAvg = calculateSpeciesSize({ boons: { [FACET_INDEX.NATURE]: 13 }, species: { name: 'Human' } });
    assert.equal(humanAvg.ruleApplied, true);
    assert.equal(humanAvg.heightCm, 167.64);
    assert.equal(humanAvg.heightScale, 1);
    assert.equal(formatHeightCm(humanAvg.heightCm), '167.6 cm');

    const humanTall = calculateSpeciesSize({ boons: { [FACET_INDEX.NATURE]: 14 }, species: { name: 'Human' } });
    assert.equal(humanTall.heightCm, 187.96);
    assert.ok(humanTall.heightScale > 1.1);
});

test('species size matrix applies ordered phenotype adjustments and Character Formation overrides species Formation', () => {
    const customSpecies = {
        name: 'Kestrelian',
        formation: 'Quiet',
        sizeMatrix: {
            baseHeightCm: 200,
            boonSpanCm: 20,
            referenceHeightCm: 200,
            adjustments: [
                { match: { caste: 'warden' }, offsetBeforeCm: 10, multiplier: 1.1, offsetAfterCm: 5 },
                { match: { sex: 'alpha' }, offsetBeforeCm: 0, multiplier: 1.05, offsetAfterCm: -2 },
                { match: { sex: 'unmatched' }, offsetBeforeCm: 500, multiplier: 2, offsetAfterCm: 500 }
            ]
        }
    };

    // Species Formation applies when Character has none; no universal sex modifier is assumed
    const plain = calculateSpeciesSize({
        boons: { [FACET_INDEX.NATURE]: 13 },
        character: { sex: 'female' },
        species: customSpecies
    });
    assert.equal(plain.heightCm, 200);
    assert.equal(plain.formation, 'Quiet');
    assert.equal(plain.material, 'wood');

    // Ordered application: ((200 + 10) * 1.1 + 5) = 236 -> (236 * 1.05 - 2) = 245.8
    const adjusted = calculateSpeciesSize({
        boons: { [FACET_INDEX.NATURE]: 13 },
        character: { incarna: 'Trial', caste: 'Warden', sex: 'Alpha' },
        species: customSpecies
    });
    assert.equal(adjusted.heightCm, 245.8);
    assert.ok(Math.abs(adjusted.heightScale - 245.8 / 200) < 1e-6);
    assert.equal(adjusted.formation, 'Trial');
    assert.equal(adjusted.material, 'metal');

    assert.deepEqual(resolveFormation({ incarna: 'Rook' }, { formation: 'Quiet' }), { formation: 'Rook', material: 'armour' });
});

test('AvatarEngine wires Awe vividness, Miasma skin tint and mottle, and all 24 Formation materials onto the atlas', () => {
    for (const mat of Object.values(FORMATION_MATERIALS)) {
        assert.ok(Object.hasOwn(FORMATION_PALETTES, mat), `FORMATION_PALETTES covers ${mat}`);
    }

    const engine = new AvatarEngine();
    const avgRgb = (mesh, regionKey) => {
        const { regions, pixels } = mesh.userData.avatarAtlas;
        const rect = regions[regionKey];
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = 0; y < rect.h; y++) {
            for (let x = 0; x < rect.w; x++) {
                const o = ((rect.y + y) * ATLAS_SIZE + rect.x + x) * 4;
                r += pixels[o]; g += pixels[o + 1]; b += pixels[o + 2]; n++;
            }
        }
        return [r / n, g / n, b / n];
    };
    const pixelVariance = (mesh, regionKey) => {
        const { regions, pixels } = mesh.userData.avatarAtlas;
        const rect = regions[regionKey];
        const mean = avgRgb(mesh, regionKey);
        let sumSq = 0, n = 0;
        for (let y = 0; y < rect.h; y++) {
            for (let x = 0; x < rect.w; x++) {
                const o = ((rect.y + y) * ATLAS_SIZE + rect.x + x) * 4;
                sumSq += (pixels[o] - mean[0]) ** 2 + (pixels[o + 1] - mean[1]) ** 2 + (pixels[o + 2] - mean[2]) ** 2;
                n++;
            }
        }
        return sumSq / n;
    };
    const lumaSpread = (rgb) => Math.max(...rgb) - Math.min(...rgb);
    const rgbDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

    // High Awe increases clothing colour saturation on mapped clothing regions relative to low Awe
    const bland = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID, makeHumanoidVariant('awe-seed', { facetBoons: { [FACET_INDEX.AWE]: 0 } }));
    const vivid = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID, makeHumanoidVariant('awe-seed', { facetBoons: { [FACET_INDEX.AWE]: 30 } }));
    assert.ok(lumaSpread(avgRgb(vivid, 'spine:cloth:top')) > lumaSpread(avgRgb(bland, 'spine:cloth:top')), 'high Awe clothing is more saturated');

    // High Miasma tints skin toward sickly olive (0x7d8a3c) and increases texel variance via mottling
    const oliveRgb = [0x7d, 0x8a, 0x3c];
    const clean = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID, makeHumanoidVariant('miasma-seed', { facetBoons: { [FACET_INDEX.MIASMA]: 13 } }));
    const tainted = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID, makeHumanoidVariant('miasma-seed', { facetBoons: { [FACET_INDEX.MIASMA]: 32 } }));
    assert.ok(rgbDist(avgRgb(tainted, 'head:skin'), oliveRgb) < rgbDist(avgRgb(clean, 'head:skin'), oliveRgb), 'Miasma shifts skin closer to sickly olive');
    assert.ok(pixelVariance(tainted, 'head:skin') > pixelVariance(clean, 'head:skin'), 'Miasma mottle increases skin texel variance');

    // Formation material overrides flesh surface with material palette
    const fleshMesh = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID, makeHumanoidVariant('form-seed', { incarna: 'Nature' }));
    const metalMesh = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID, makeHumanoidVariant('form-seed', { incarna: 'Trial' }));
    const woodMesh = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID, makeHumanoidVariant('form-seed', { incarna: 'Quiet' }));
    assert.equal(fleshMesh.userData.avatarAtlas.material, 'flesh');
    assert.equal(metalMesh.userData.avatarAtlas.material, 'metal');
    assert.equal(woodMesh.userData.avatarAtlas.material, 'wood');
    assert.notDeepEqual(avgRgb(fleshMesh, 'head:skin'), avgRgb(metalMesh, 'head:skin'));
    assert.notDeepEqual(avgRgb(metalMesh, 'head:skin'), avgRgb(woodMesh, 'head:skin'));

    // Descendant helper extracts Formation material and SizeAnnex offset
    const desc = descendantAvatarData({ name: ['Iron Automaton'], incarna: 'Trial', masterAnnex: { size: 4 } });
    assert.equal(desc.material, 'metal');
    assert.equal(desc.facetBoons[FACET_INDEX.NATURE], 17);
});
