import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AvatarAtlas, ATLAS_CAPACITY, ATLAS_SIZE, ATLAS_VERSION } from '../src/t13ne/procgen/avatar/AvatarAtlas.js';
import { AvatarEngine, makeFaceVariant, makeHumanoidVariant } from '../src/t13ne/procgen/avatar/AvatarEngine.js';
import { AvatarEngine as CompanionAvatarEngine, makeFaceVariant as companionFaceVariant } from '../ttrpg-companion/src/t13ne/procgen/avatar/AvatarEngine.js';
import { AvatarSkinPainter } from '../src/t13ne/procgen/avatar/AvatarSkinPainter.js';
import { BODY_PLANS } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';
import { exportSkinDocument, importSkinDocument } from '../src/t13ne/procgen/avatar/AvatarSkinDocument.js';
import { exportSkinDocument as exportCompanionSkin, importSkinDocument as importCompanionSkin } from '../ttrpg-companion/src/t13ne/procgen/avatar/AvatarSkinDocument.js';

test('atlas regions have integer coordinates, stay in bounds and never overlap', () => {
    const atlas = new AvatarAtlas();
    for (let i = atlas.regions.size; i < ATLAS_CAPACITY; i++) atlas.region(`part${i}:skin`);
    const rects = [...atlas.regions.values()];
    for (const [i, rect] of rects.entries()) {
        assert.ok(Number.isInteger(rect.x) && Number.isInteger(rect.y));
        assert.ok(rect.x >= 0 && rect.x + rect.w <= ATLAS_SIZE);
        assert.ok(rect.y >= 0 && rect.y + rect.h <= ATLAS_SIZE);
        for (const other of rects.slice(i + 1)) {
            assert.ok(rect.x + rect.w <= other.x || other.x + other.w <= rect.x ||
                rect.y + rect.h <= other.y || other.y + other.h <= rect.y);
        }
    }
    assert.throws(() => atlas.region('overflow:skin'), /atlas is full/);
});

test('all body plans get a bounded atlas; humanoid clothes are painted on the body', () => {
    for (const plan of Object.values(BODY_PLANS)) {
        const mesh = new AvatarEngine().generateProceduralAvatar(plan);
        const { regions, version } = mesh.userData.avatarAtlas;
        assert.equal(version, ATLAS_VERSION);
        assert.ok(Object.keys(regions).length <= ATLAS_CAPACITY);
        const uv = mesh.geometry.attributes.uv;
        for (let i = 0; i < uv.count; i++) {
            assert.ok(uv.getX(i) >= 0 && uv.getX(i) <= 1);
            assert.ok(uv.getY(i) >= 0 && uv.getY(i) <= 1);
        }
        assert.equal(mesh.children.filter(child => child.isMesh).length, 0);
    }
    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
    const regions = mesh.userData.avatarAtlas.regions;
    for (const key of ['spine:cloth:top', 'arm_l:cloth:top', 'hips:cloth:bottom', 'leg_r:cloth:bottom', 'head:skin', 'arm_l:skin']) {
        assert.ok(regions[key], key);
    }
});

test('cultural coverage can replace the neutral outfit without adding meshes', () => {
    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, {
        clothingCoverage: { hips: 'wrap' },
        clothing: { wrap: { colour: 0xff0000, pattern: 'plain' } }
    });
    const { regions, pixels } = mesh.userData.avatarAtlas;
    assert.ok(regions['spine:skin']);
    const wrap = regions['hips:cloth:wrap'];
    assert.ok(wrap);
    const offset = (wrap.y * ATLAS_SIZE + wrap.x) * 4;
    assert.ok(pixels[offset] > 220);
    assert.equal(pixels[offset + 1], 0);
    assert.equal(pixels[offset + 2], 0);
    assert.equal(mesh.children.filter(child => child.isMesh).length, 0);
});

test('raycast UV paints live texture and persists through atlas injection', () => {
    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
    const painter = new AvatarSkinPainter(mesh);
    const rect = mesh.userData.avatarAtlas.regions['head:skin'];
    const x = rect.x + 5, y = rect.y + 5;
    const hit = { object: mesh, uv: new THREE.Vector2((x + 0.5) / ATLAS_SIZE, 1 - (y + 0.5) / ATLAS_SIZE) };
    const previous = mesh.material.map.version;
    assert.equal(painter.paint(hit, { colour: 0x123456, radius: 0 }), true);
    assert.ok(mesh.material.map.version > previous);
    const pixels = mesh.userData.avatarAtlas.pixels;
    assert.deepEqual([...pixels.slice((y * ATLAS_SIZE + x) * 4, (y * ATLAS_SIZE + x) * 4 + 4)], [0x12, 0x34, 0x56, 255]);
    const textureOffset = ((ATLAS_SIZE - 1 - y) * ATLAS_SIZE + x) * 4;
    assert.deepEqual([...mesh.material.map.image.data.slice(textureOffset, textureOffset + 4)], [0x12, 0x34, 0x56, 255]);
    const restored = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { atlasPixels: pixels });
    assert.deepEqual(restored.userData.avatarAtlas.pixels, pixels);
    assert.notEqual(restored.userData.avatarAtlas.pixels, pixels);
    assert.equal(painter.paint({ object: new THREE.Mesh(), uv: hit.uv }, { colour: 0 }), false);
    assert.throws(() => painter.paint(hit, { colour: -1 }), /Brush colour/);
    assert.throws(() => new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { atlasPixels: new Uint8Array(4) }), /RGBA/);
});

test('the painter accepts an actual three.js raycast intersection', () => {
    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
    mesh.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster(new THREE.Vector3(0, 1.56, 3), new THREE.Vector3(0, 0, -1));
    const hit = raycaster.intersectObject(mesh)[0];
    assert.ok(hit?.uv);
    assert.equal(new AvatarSkinPainter(mesh).paint(hit, { colour: 0xff00ff, radius: 1 }), true);
});

test('seeded facial features change geometry reproducibly without changing the atlas layout', () => {
    for (const [Engine, makeFace] of [[AvatarEngine, makeFaceVariant], [CompanionAvatarEngine, companionFaceVariant]]) {
        const face = makeFace('character-one');
        assert.deepEqual(face, makeFace('character-one'));
        assert.notDeepEqual(face, makeFace('character-two'));
        const meshes = ['character-one', 'character-one', 'character-two'].map(seed =>
            new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { face: makeFace(seed) }));
        const positions = meshes.map(mesh => [...mesh.geometry.attributes.position.array]);
        assert.deepEqual(positions[0], positions[1]);
        assert.notDeepEqual(positions[0], positions[2]);
        assert.deepEqual(meshes[0].userData.avatarAtlas.regions, meshes[2].userData.avatarAtlas.regions);
        assert.deepEqual(meshes[0].morphTargetDictionary, meshes[2].morphTargetDictionary);
    }
    assert.deepEqual(makeHumanoidVariant('character-one').face, makeFaceVariant('character-one'));
});

test('skin documents round-trip and reject incompatible layouts without changing the avatar', () => {
    for (const [Engine, exportSkin, importSkin] of [
        [AvatarEngine, exportSkinDocument, importSkinDocument],
        [CompanionAvatarEngine, exportCompanionSkin, importCompanionSkin]
    ]) {
        const source = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
        const target = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
        const document = JSON.parse(JSON.stringify(exportSkin(source)));
        document.pixels[0] = 123;
        const previous = target.material.map;
        importSkin(target, document);
        assert.equal(target.userData.avatarAtlas.pixels[0], 123);
        assert.notEqual(target.material.map, previous);
        const before = target.material.map;
        document.regions['head:skin'].x++;
        assert.throws(() => importSkin(target, document), /layout/);
        assert.equal(target.material.map, before);
        const other = new Engine().generateProceduralAvatar(BODY_PLANS.QUADRUPED);
        assert.throws(() => importSkin(other, exportSkin(source)), /body plan/);
        document.regions['head:skin'].x--;
        document.pixels[0] = 256;
        assert.throws(() => importSkin(target, document), /invalid RGBA/);
        assert.equal(target.material.map, before);
    }
});
