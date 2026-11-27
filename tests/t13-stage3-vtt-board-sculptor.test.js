import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import {
    VTTBoardController,
    classifyReachBand,
    measureBoardDistance,
    snapBoardPosition
} from '../src/t13ne/modules/vtt/VTTBoardController.js';
import {
    buildVttToken,
    disposeVttToken,
    setTokenSpeakingState,
    updateTokenStatusPips
} from '../src/t13ne/modules/vtt/VTTTokenBuilder.js';
import { AvatarEngine } from '../src/t13ne/procgen/avatar/AvatarEngine.js';
import { BODY_PLANS } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';
import { ATLAS_SIZE, TILE } from '../src/t13ne/procgen/avatar/AvatarAtlas.js';
import {
    applySculptProfile,
    countMeshTriangles,
    generateUVOverlayBuffer,
    getAccessories,
    paintProceduralBrush,
    removeAccessory,
    setAccessory,
    validateTriangleBudget
} from '../src/t13ne/procgen/avatar/AvatarSculptor.js';
import { exportSkinDocument, importSkinDocument } from '../src/t13ne/procgen/avatar/AvatarSkinDocument.js';
import { buildUHPPPropMesh, toVttPropTokenSpec } from '../src/t13ne/procgen/uhpp/UHPPPropBuilder.js';

test('VTTBoardController handles 2D/3D/Psychosocial modes, horizontal GridHelper, snapping, Reach ruler, and pointer drag', () => {
    const committedMoves = [];
    const board = new VTTBoardController({
        onTokenMoveCommit: (tokenId, pos) => committedMoves.push({ tokenId, pos })
    });

    // GridHelper must sit flat on XZ plane (rotation.x === 0, not Math.PI / 2)
    assert.ok(board.gridHelper);
    assert.equal(board.gridHelper.rotation.x, 0);

    // View mode switching
    const cam2d = board.setViewMode('2d-topdown');
    assert.equal(cam2d.isOrthographicCamera, true);
    const cam3d = board.setViewMode('3d-orbit');
    assert.equal(cam3d.isPerspectiveCamera, true);
    board.setViewMode('psychosocial');
    assert.equal(board.viewMode, 'psychosocial');
    board.setViewMode('2d-topdown');

    // Snapping & Reach measurement
    const sq = snapBoardPosition({ x: 1.4, y: 0, z: -2.6 }, { gridType: 'square', gridSize: 1, snapEnabled: true });
    assert.deepEqual(sq, { x: 1, y: 0, z: -3 });
    const hex = snapBoardPosition({ x: 0.4, y: 0, z: 0.2 }, { gridType: 'hex', gridSize: 1, snapEnabled: true });
    assert.ok(Number.isFinite(hex.x) && Number.isFinite(hex.z));
    const dist = measureBoardDistance({ x: 0, z: 0 }, { x: 3, z: 4 }, { gridSize: 1 });
    assert.equal(dist.worldUnits, 5);
    assert.equal(dist.reachBand, 'Near');
    assert.equal(classifyReachBand(1), 'Close');
    assert.equal(classifyReachBand(10), 'Far');
    assert.equal(classifyReachBand(20), 'Distant');

    // Token raycast drag-and-drop in 2D top-down camera
    const tokenBox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.9), new THREE.MeshLambertMaterial({ color: 0x38bdf8 }));
    tokenBox.position.set(0, 0, 0);
    board.scene.add(tokenBox);
    board.registerTokenObject('hero-1', tokenBox);
    board.orthoCamera.updateMatrixWorld(true);

    const start = board.handlePointerDown({ x: 0, y: 0 });
    assert.equal(start?.action, 'drag-start');
    assert.equal(start?.tokenId, 'hero-1');

    board.handlePointerMove({ x: 0.25, y: -0.15 });
    const end = board.handlePointerUp({ x: 0.25, y: -0.15 });
    assert.equal(end?.action, 'drag-end');
    assert.equal(committedMoves.length, 1);
    assert.equal(committedMoves[0].tokenId, 'hero-1');

    // Zones & role-filtered fog-of-war
    board.syncZones({ z1: { id: 'z1', kind: 'Hazard', bounds: { x: 2, z: 2, width: 3, depth: 3 } } });
    assert.equal(board.zoneGroup.children.length, 1);
    board.syncFogOfWar({ enabled: true, hiddenCells: [{ x: 1, z: 1 }, { x: 2, z: 1 }] }, 'player');
    assert.equal(board.fogGroup.children.length, 2);
    assert.equal(board.fogGroup.children[0].material.opacity, 1);
    board.syncFogOfWar({ enabled: true, hiddenCells: [{ x: 1, z: 1 }] }, 'referee');
    assert.equal(board.fogGroup.children[0].material.transparent, true);

    board.dispose();
});

test('VTTTokenBuilder generates 3D Avatar and UHPP Prop tokens with base ring, speaking state, and status pips', async () => {
    const charToken = await buildVttToken({
        id: 'tok-hero',
        name: 'Vaelen',
        tokenType: 'character',
        allegiance: 'ally',
        incarna: 'Wyrd',
        facing: 0.5,
        status: { wounds: 2, stress: 3 }
    });
    assert.ok(charToken.getObjectByName('vtt-token-avatar')?.isSkinnedMesh);
    assert.ok(charToken.getObjectByName('vtt-allegiance-ring'));
    assert.ok(charToken.getObjectByName('vtt-facing-arrow'));
    assert.equal(charToken.getObjectByName('vtt-status-pips').children.length, 5);
    assert.equal(charToken.userData.nameplate.text, 'Vaelen');

    setTokenSpeakingState(charToken, true, 0.85);
    assert.equal(charToken.getObjectByName('vtt-speaking-ring').visible, true);
    updateTokenStatusPips(charToken, { wounds: 1, stress: 1 });
    assert.equal(charToken.getObjectByName('vtt-status-pips').children.length, 2);
    disposeVttToken(charToken);

    const propSpec = toVttPropTokenSpec({ propType: 'monolith', incarna: 'Trial', width: 1.2, height: 1.8, depth: 1.2 });
    const propToken = await buildVttToken(propSpec);
    assert.ok(propToken.getObjectByName('uhpp-prop-monolith'));
    disposeVttToken(propToken);
});

test('AvatarSculptor supports symmetric low-poly sculpting, deterministic procedural brushes, UV overlay, and accessories', () => {
    const engine = new AvatarEngine();
    const mesh = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID);
    const budget = validateTriangleBudget(mesh);
    assert.equal(budget.ok, true);

    // Sculpting with symmetry mirrors arm_l -> arm_r without cumulative drift
    const getArmCentroidX = (boneName) => {
        const pos = mesh.geometry.attributes.position;
        const si = mesh.geometry.attributes.skinIndex;
        const idx = mesh.skeleton.bones.findIndex(b => b.name === boneName);
        let sumX = 0, count = 0;
        for (let i = 0; i < pos.count; i++) {
            if (si.getX(i) === idx) { sumX += pos.getX(i); count++; }
        }
        return sumX / count;
    };
    const lx0 = getArmCentroidX('arm_l');
    const rx0 = getArmCentroidX('arm_r');
    applySculptProfile(mesh, { symmetry: true, parts: { arm_l: { offset: [-0.08, 0, 0], scale: [1.1, 1, 1.1], inflate: 0.01 } } });
    const lx1 = getArmCentroidX('arm_l');
    const rx1 = getArmCentroidX('arm_r');
    assert.ok(lx1 < lx0 - 0.05 && rx1 > rx0 + 0.05, 'Symmetric sculpting shifts left arm -X and right arm +X');
    assert.ok(Math.abs(lx1 + rx1) < 0.01, `Symmetric sculpting keeps left/right mirrored (${lx1} vs ${rx1})`);

    // Applying identical profile again produces exact same result (no drift)
    applySculptProfile(mesh, { symmetry: true, parts: { arm_l: { offset: [-0.08, 0, 0], scale: [1.1, 1, 1.1], inflate: 0.01 } } });
    assert.ok(Math.abs(getArmCentroidX('arm_l') - lx1) < 1e-6);

    // Deterministic procedural brush confined to hit face tile
    mesh.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 1.3, 2), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(mesh)[0];
    assert.ok(hit);

    const mesh2 = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID);
    mesh2.updateMatrixWorld(true);
    const hit2 = new THREE.Raycaster(new THREE.Vector3(0, 1.3, 2), new THREE.Vector3(0, 0, -1)).intersectObject(mesh2)[0];

    const brushOpts = { mode: 'scales', colour: 0x38bdf8, secondaryColour: 0x0f172a, radius: 3, seed: 'scale-seed-1' };
    assert.equal(paintProceduralBrush(mesh, hit, brushOpts), true);
    assert.equal(paintProceduralBrush(mesh2, hit2, brushOpts), true);
    assert.deepEqual(Array.from(mesh.userData.avatarAtlas.pixels), Array.from(mesh2.userData.avatarAtlas.pixels));

    // UV overlay buffer has non-zero border pixels
    const overlay = generateUVOverlayBuffer(mesh.userData.avatarAtlas);
    assert.equal(overlay.length, ATLAS_SIZE * ATLAS_SIZE * 4);
    assert.ok(overlay.some(v => v > 0));

    // Detachable accessories + extended AvatarSkinDocument round-trip
    setAccessory(mesh, 'visor', { colour: 0x22d3ee });
    setAccessory(mesh, 'armour_chest', { colour: 0x475569 });
    assert.equal(Object.keys(getAccessories(mesh)).length, 2);
    assert.ok(countMeshTriangles(mesh, { includeAccessories: false }) < 2500);

    const exported = exportSkinDocument(mesh);
    assert.ok(exported.sculpt);
    assert.ok(exported.accessories.head);

    const target = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID);
    importSkinDocument(target, exported);
    assert.equal(getAccessories(target).head.preset, 'visor');
    assert.ok(target.userData.sculptProfile.parts.arm_r);
    assert.equal(removeAccessory(target, 'head'), true);
    assert.equal(getAccessories(target).head, undefined);

    // UHPP Formation prop check
    const crystal = buildUHPPPropMesh({ propType: 'crystal', incarna: 'Phoenix', width: 1, height: 1.5, depth: 1 });
    assert.equal(crystal.userData.uhppProp.formation, 'Phoenix');
    assert.equal(crystal.userData.uhppProp.material, 'fire');
});
