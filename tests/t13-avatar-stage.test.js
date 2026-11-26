import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AvatarStage } from '../src/t13ne/procgen/uhpp/AvatarStage.js';
import { AvatarStage as CompanionAvatarStage } from '../ttrpg-companion/src/t13ne/procgen/uhpp/AvatarStage.js';
import { FACET_INDEX } from '../src/t13ne/procgen/avatar/AvatarFacetBody.js';
import { speciesSkin } from '../src/t13ne/procgen/avatar/SpeciesSkins.js';
import { speciesSkin as companionSpeciesSkin } from '../ttrpg-companion/src/t13ne/procgen/avatar/SpeciesSkins.js';
import { exportSkinDocument } from '../src/t13ne/procgen/avatar/AvatarSkinDocument.js';
import { BODY_PLANS } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';

test('avatar stage resolves and attaches the generated mesh', async () => {
    for (const Stage of [AvatarStage, CompanionAvatarStage]) {
        const scene = new THREE.Scene();
        const context = { scene };
        const result = await new Stage().execute(context);
        assert.equal(result, context);
        assert.ok(context.avatar.isSkinnedMesh);
        assert.equal(context.avatar.parent, scene);
    }
});

test('avatar stage derives a deterministic variant from character facetweb stats', async () => {
    const stage = new AvatarStage();
    const character = {
        name: ['Test Character'],
        facetweb: { Stats: [
            { Facet: FACET_INDEX.NATURE, Facet_Boon: 26, Antifacet: FACET_INDEX.BURDEN, Antifacet_Boon: 0 }
        ] }
    };
    const variants = [];
    stage.engine.generate = async (plan, options) => {
        variants.push(options.variant);
        return new THREE.Group();
    };
    await stage.execute({ character });
    await stage.execute({ character });
    assert.deepEqual(variants[0], variants[1]);
    assert.equal(variants[0].height, 1.1);
    assert.equal(variants[0].build, 0.8);
});

test('character facet boons change the generated avatar geometry', async () => {
    const character = boon => ({
        facetweb: { Stats: [
            { Facet: FACET_INDEX.NATURE, Facet_Boon: boon, Antifacet: FACET_INDEX.BURDEN, Antifacet_Boon: 13 }
        ] }
    });
    for (const Stage of [AvatarStage, CompanionAvatarStage]) {
        const stage = new Stage();
        const short = await stage.execute({ character: character(0), avatarSeed: 'same' });
        const tall = await stage.execute({ character: character(26), avatarSeed: 'same' });
        short.avatar.geometry.computeBoundingBox();
        tall.avatar.geometry.computeBoundingBox();
        const height = avatar => avatar.geometry.boundingBox.max.y - avatar.geometry.boundingBox.min.y;
        assert.ok(height(tall.avatar) > height(short.avatar));
    }
});

test('avatar stage preserves explicit options and propagates errors', async () => {
    const stage = new AvatarStage();
    const variant = { height: 0.95 };
    stage.engine.generate = async (plan, options) => {
        assert.equal(options.variant, variant);
        assert.equal(options.style, 'procedural');
        throw new Error('generation failed');
    };
    const character = { facetweb: { Stats: [] } };
    await assert.rejects(stage.execute({ character, avatarOptions: { variant, style: 'procedural' } }), /generation failed/);
    await assert.rejects(stage.execute({ character: { facetweb: { Stats: {} } } }), /Stats must be an array/);
});

test('avatar stage seeds facial variation even without character stats', async () => {
    for (const Stage of [AvatarStage, CompanionAvatarStage]) {
        const stage = new Stage();
        const variants = [];
        stage.engine.generate = async (plan, options) => {
            variants.push(options.variant);
            return new THREE.Group();
        };
        await stage.execute({ character: { name: 'Same' } });
        await stage.execute({ character: { name: 'Same' } });
        await stage.execute({ character: { name: 'Different' } });
        assert.deepEqual(variants[0].face, variants[1].face);
        assert.notDeepEqual(variants[0].face, variants[2].face);
    }
});

test('species skins provide a stable default and support authored variants', () => {
    for (const resolve of [speciesSkin, companionSpeciesSkin]) {
        const species = { scientificName: 'Example species' };
        assert.deepEqual(resolve(species), resolve({ ...species }));
        assert.equal(resolve(species).id, 'default');
        assert.notEqual(resolve(species).skinTone, resolve({ scientificName: 'Different species' }).skinTone);
        assert.equal(resolve({ color: '#123456' }).skinTone, 0x123456);
        assert.throws(() => resolve({ color: 'rgb(1)' }), /valid RGB/);
        assert.throws(() => resolve({}), /id or name/);
        const authored = { avatarSkins: [
            { id: 'plain', skinTone: 0x123456 },
            { id: 'ceremonial', skinTone: 0x654321, clothing: { top: { colour: 0xff0000, pattern: 'plain' } } }
        ] };
        assert.equal(resolve(authored).id, 'plain');
        assert.equal(resolve(authored, 'ceremonial').skinTone, 0x654321);
        assert.throws(() => resolve(authored, 'missing'), /Unknown species skin/);
        assert.throws(() => resolve({ avatarSkins: [{ id: 'bad', skinTone: -1 }] }), /valid RGB/);
    }
});

test('avatar stage uses selected species skin while retaining seeded face and facets', async () => {
    for (const Stage of [AvatarStage, CompanionAvatarStage]) {
        const stage = new Stage();
        const species = { avatarSkins: [
            { id: 'default', skinTone: 0x123456 },
            { id: 'alternate', skinTone: 0xabcdef, hairColor: 0x654321 }
        ] };
        const context = await stage.execute({ character: { name: 'Test' }, species, skinId: 'alternate' });
        const { regions, pixels } = context.avatar.userData.avatarAtlas;
        const rect = regions['head:hair'];
        const offset = (rect.y * 256 + rect.x) * 4;
        assert.deepEqual([...pixels.slice(offset, offset + 3)], [0x65, 0x43, 0x21]);
        const skinRect = regions['head:skin'];
        const skinOffset = (skinRect.y * 256 + skinRect.x) * 4;
        assert.ok(pixels[skinOffset] >= 0xa0 && pixels[skinOffset] <= 0xb5);
        assert.ok(pixels[skinOffset + 2] >= 0xe0);
    }
});

test('avatar stage restores a compatible saved skin and rejects a different body plan', async () => {
    for (const Stage of [AvatarStage, CompanionAvatarStage]) {
        const stage = new Stage();
        const source = await stage.execute({ avatarSeed: 'source' });
        const skinDocument = exportSkinDocument(source.avatar);
        skinDocument.pixels[0] = 211;
        const restored = await stage.execute({ avatarSeed: 'different', skinDocument });
        assert.equal(restored.avatar.userData.avatarAtlas.pixels[0], 211);
        const scene = new THREE.Scene();
        await assert.rejects(stage.execute({ scene, bodyPlan: BODY_PLANS.QUADRUPED, skinDocument }), /body plan/);
        assert.equal(scene.children.length, 0);
    }
});

test('avatar stage loads a character skin and selects its saved body plan', async () => {
    for (const Stage of [AvatarStage, CompanionAvatarStage]) {
        const stage = new Stage();
        const source = await stage.execute({ bodyPlan: BODY_PLANS.QUADRUPED });
        const document = exportSkinDocument(source.avatar);
        document.pixels[0] = 123;
        const skinStore = { load: async id => {
            assert.equal(id, 'character-1');
            return { revision: 1, document };
        } };
        const restored = await stage.execute({ character: { id: 'character-1' }, skinStore });
        assert.equal(restored.avatar.userData.avatarAtlas.bodyPlan, 'Quadruped');
        assert.equal(restored.avatar.userData.avatarAtlas.pixels[0], 123);
        await assert.rejects(stage.execute({
            character: { id: 'character-1' },
            skinStore: { load: async () => { throw new Error('storage unavailable'); } }
        }), /storage unavailable/);
    }
});
