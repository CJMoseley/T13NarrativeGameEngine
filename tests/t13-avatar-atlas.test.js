import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AvatarAtlas, ATLAS_CAPACITY, ATLAS_SIZE, ATLAS_VERSION, LEGACY_ATLAS_SIZE, TILE, mapUVsToRegion } from '../src/t13ne/procgen/avatar/AvatarAtlas.js';
import { AvatarEngine, makeFaceVariant, makeHumanoidVariant } from '../src/t13ne/procgen/avatar/AvatarEngine.js';
import { AvatarSkinPainter } from '../src/t13ne/procgen/avatar/AvatarSkinPainter.js';
import { BODY_PLANS } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';
import { exportSkinDocument, importSkinDocument } from '../src/t13ne/procgen/avatar/AvatarSkinDocument.js';
import { atlasToPngBlob, pngBlobToAtlasPixels } from '../src/t13ne/procgen/avatar/AvatarAtlasIO.js';

const CompanionAvatarEngine = AvatarEngine;
const companionFaceVariant = makeFaceVariant;
const CompanionPainter = AvatarSkinPainter;
const exportCompanionSkin = exportSkinDocument;
const importCompanionSkin = importSkinDocument;
const companionToPng = atlasToPngBlob;
const companionFromPng = pngBlobToAtlasPixels;

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
        assert.ok(mesh.children.filter(child => child.isMesh).every(child => child.name === 'avatar-face-feature'));
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
    assert.ok(mesh.children.filter(child => child.isMesh).every(child => child.name === 'avatar-face-feature'));
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

test('a large brush at a face edge never paints neighbouring face tiles', () => {
    for (const [Engine, Painter] of [[AvatarEngine, AvatarSkinPainter], [CompanionAvatarEngine, CompanionPainter]]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
        const atlas = mesh.userData.avatarAtlas;
        const rect = atlas.regions['head:skin'];
        const x = rect.x + TILE - 1;
        const y = rect.y + TILE - 1;
        const before = new Uint8Array(atlas.pixels);
        const hit = { object: mesh, uv: new THREE.Vector2((x + 0.5) / ATLAS_SIZE, 1 - (y + 0.5) / ATLAS_SIZE) };
        assert.equal(new Painter(mesh).paint(hit, { colour: 0xff00ff, radius: 8 }), true);
        let changed = 0;
        for (let py = 0; py < ATLAS_SIZE; py++) {
            for (let px = 0; px < ATLAS_SIZE; px++) {
                const index = (py * ATLAS_SIZE + px) * 4;
                if (atlas.pixels[index] === before[index] && atlas.pixels[index + 1] === before[index + 1] && atlas.pixels[index + 2] === before[index + 2]) continue;
                changed++;
                assert.ok(px >= rect.x && px < rect.x + TILE && py >= rect.y && py < rect.y + TILE, `changed pixel ${px},${py} is in selected face`);
            }
        }
        assert.ok(changed > 1);
    }
});

test('painting a facial child changes only the hit face tile', () => {
    for (const [Engine, Painter] of [[AvatarEngine, AvatarSkinPainter], [CompanionAvatarEngine, CompanionPainter]]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
        const feature = mesh.children.find(child => child.name === 'avatar-face-feature');
        assert.ok(feature);
        const uv = feature.geometry.attributes.uv;
        const point = new THREE.Vector2(
            (uv.getX(0) + uv.getX(1) + uv.getX(2)) / 3,
            (uv.getY(0) + uv.getY(1) + uv.getY(2)) / 3
        );
        const x = Math.floor(point.x * ATLAS_SIZE);
        const y = Math.floor((1 - point.y) * ATLAS_SIZE);
        const atlas = mesh.userData.avatarAtlas;
        const rect = Object.values(atlas.regions).find(r =>
            x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
        assert.ok(rect);
        const faceX = rect.x + Math.floor((x - rect.x) / TILE) * TILE;
        const faceY = rect.y + Math.floor((y - rect.y) / TILE) * TILE;
        const before = new Uint8Array(atlas.pixels);
        assert.equal(new Painter(mesh).paint({ object: feature, uv: point }, { colour: 0xff00ff, radius: 32 }), true);
        let changed = 0;
        for (let py = 0; py < ATLAS_SIZE; py++) {
            for (let px = 0; px < ATLAS_SIZE; px++) {
                const index = (py * ATLAS_SIZE + px) * 4;
                if (atlas.pixels[index] === before[index] && atlas.pixels[index + 1] === before[index + 1] && atlas.pixels[index + 2] === before[index + 2]) continue;
                changed++;
                assert.ok(px >= faceX && px < faceX + TILE && py >= faceY && py < faceY + TILE);
            }
        }
        assert.ok(changed > 1);
    }
});

test('every generated geometry receives a distinct atlas region', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        for (const plan of Object.values(BODY_PLANS)) {
            const engine = new Engine();
            const part = engine._part;
            const keys = [];
            engine._part = function (...args) {
                const result = part.apply(this, args);
                keys.push([...this.atlas.regions.keys()].at(-1));
                return result;
            };
            const mesh = engine.generateProceduralAvatar(plan);
            assert.equal(new Set(keys).size, keys.length, `${plan.name} reuses a region`);
            assert.equal(Object.keys(mesh.userData.avatarAtlas.regions).length, keys.length + 2);
        }
    }
});

test('version 1 skins migrate shared colours into independent regions', () => {
    for (const [Engine, importSkin] of [[AvatarEngine, importSkinDocument], [CompanionAvatarEngine, importCompanionSkin]]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
        const atlas = mesh.userData.avatarAtlas;
        const source = new Uint8Array(LEGACY_ATLAS_SIZE * LEGACY_ATLAS_SIZE * 4);
        const head = atlas.legacyRegions['head:dark'];
        const oldOffset = (head.y * LEGACY_ATLAS_SIZE + head.x) * 4;
        source.set([13, 61, 99, 255], oldOffset);
        const document = { format: 't13-avatar-skin', version: 1, bodyPlan: atlas.bodyPlan,
            regions: structuredClone(atlas.legacyRegions), pixels: Array.from(source) };
        importSkin(mesh, document);
        const split = Object.entries(atlas.legacyRegionKeys).filter(([, key]) => key === 'head:dark');
        assert.ok(split.length > 1);
        for (const [key] of split) {
            const rect = atlas.regions[key];
            const offset = (rect.y * ATLAS_SIZE + rect.x) * 4;
            assert.deepEqual([...atlas.pixels.slice(offset, offset + 4)], [13, 61, 99, 255]);
        }
        const before = mesh.material.map;
        document.regions['head:dark'].x++;
        assert.throws(() => importSkin(mesh, document), /layout/);
        assert.equal(mesh.material.map, before);
    }
});

test('seeded facial features change geometry reproducibly without changing the atlas layout', () => {
    for (const [Engine, makeFace] of [[AvatarEngine, makeFaceVariant], [CompanionAvatarEngine, companionFaceVariant]]) {
        const face = makeFace('character-one');
        assert.deepEqual(face, makeFace('character-one'));
        assert.notDeepEqual(face, makeFace('character-two'));
        const meshes = ['character-one', 'character-one', 'character-two'].map(seed =>
            new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { face: makeFace(seed) }));
        const positions = meshes.map(mesh => mesh.children.filter(child => child.isMesh)
            .flatMap(child => [...child.geometry.attributes.position.array]));
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

test('PNG helpers reject invalid inputs and close decoded bitmaps on error', async () => {
    const original = globalThis.createImageBitmap;
    try {
        for (const [toPng, fromPng] of [[atlasToPngBlob, pngBlobToAtlasPixels], [companionToPng, companionFromPng]]) {
            assert.throws(() => toPng(new Uint8Array(4)), /512x512/);
            await assert.rejects(fromPng(new Blob([], { type: 'image/jpeg' })), /PNG/);
            let closed = false;
            globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() { closed = true; } });
            await assert.rejects(fromPng(new Blob([], { type: 'image/png' })), /512x512/);
            assert.equal(closed, true);
        }
    } finally {
        if (original === undefined) delete globalThis.createImageBitmap;
        else globalThis.createImageBitmap = original;
    }
});

test('BoxGeometry retains type across applyMatrix4 and mapUVsToRegion isolates all six box face tiles', () => {
    const atlas = new AvatarAtlas();
    const rect = atlas.region('box_check:skin');
    const box = new THREE.BoxGeometry(0.2, 0.3, 0.4, 2, 2, 2);
    assert.equal(box.type, 'BoxGeometry');
    mapUVsToRegion(box, rect);
    const mat = new THREE.Matrix4().makeTranslation(1, 2, 3).multiply(new THREE.Matrix4().makeRotationY(0.5));
    box.applyMatrix4(mat);
    assert.equal(box.type, 'BoxGeometry', 'BoxGeometry survives applyMatrix4 as BoxGeometry');

    const uv = box.attributes.uv;
    const vertsPerFace = (2 + 1) * (2 + 1);
    assert.equal(uv.count, vertsPerFace * 6);
    for (let face = 0; face < 6; face++) {
        const expectedCol = face % 3;
        const expectedRow = Math.floor(face / 3);
        for (let i = 0; i < vertsPerFace; i++) {
            const vIdx = face * vertsPerFace + i;
            const px = uv.getX(vIdx) * ATLAS_SIZE;
            const py = (1 - uv.getY(vIdx)) * ATLAS_SIZE;
            assert.ok(px >= rect.x + expectedCol * TILE + 0.49 && px <= rect.x + (expectedCol + 1) * TILE - 0.49, `face ${face} u inside tile col ${expectedCol}`);
            assert.ok(py >= rect.y + expectedRow * TILE + 0.49 && py <= rect.y + (expectedRow + 1) * TILE - 0.49, `face ${face} v inside tile row ${expectedRow}`);
        }
    }
    box.dispose();
});
