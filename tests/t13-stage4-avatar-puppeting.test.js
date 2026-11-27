import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { AvatarEngine } from '../src/t13ne/procgen/avatar/AvatarEngine.js';
import { BODY_PLANS } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';
import { MorphManager } from '../src/t13ne/procgen/avatar/MorphManager.js';
import {
    VTuberBridge,
    decodePuppetPacket,
    encodePuppetPacket,
    extractAudioPuppetFrame
} from '../src/t13ne/procgen/avatar/VTuberBridge.js';
import { AnimationBlender } from '../src/t13ne/procgen/avatar/AnimationBlender.js';
import { LiveAvatarController } from '../src/t13ne/procgen/avatar/LiveAvatarController.js';

test('VTuberBridge is safe in headless Node (no document.body touch) and extracts speech formant visemes', () => {
    const bridge = new VTuberBridge({ assetBaseUrl: '/local/mediapipe' });
    assert.equal(bridge.videoElement, null);
    assert.equal(bridge.mode, 'idle');

    // Low formant energy (250-750 Hz -> "oo"/"oh"/"aa")
    const binsLow = new Uint8Array(256).fill(0);
    for (let i = 3; i <= 7; i++) binsLow[i] = 220; // ~280-660 Hz @ 48kHz
    const frameLow = extractAudioPuppetFrame(binsLow, { timeSec: 0.05, sampleRate: 48000, fftSize: 512 });
    assert.ok(frameLow.jawOpen > 0.25);
    assert.ok(frameLow.viseme_oo > 0.2 && frameLow.viseme_oh > 0.2);

    // Mid formant energy (800-2400 Hz -> "ee")
    const binsMid = new Uint8Array(256).fill(0);
    for (let i = 10; i <= 24; i++) binsMid[i] = 230;
    const frameMid = extractAudioPuppetFrame(binsMid, { timeSec: 0.5, sampleRate: 48000, fftSize: 512 });
    assert.ok(frameMid.viseme_ee > frameMid.viseme_oo);
    assert.ok(frameMid.blink > 0 || frameLow.blink >= 0);
});

test('LiveAvatarController drives humanoid visemes + additive expressions and Insectoid/Spider mandibles', () => {
    const engine = new AvatarEngine();
    const humanoid = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID);

    const packets = [];
    const controller = new LiveAvatarController(humanoid, 'humanoid', {
        minPacketIntervalMs: 0,
        onPuppetPacket: (pkt) => packets.push(pkt)
    });

    // Apply smile expression then feed speech FFT bins -> both smile and visemes combine cleanly
    controller.morph.update({ smile: 0.7 });
    const bins = new Uint8Array(256).fill(0);
    for (let i = 3; i <= 15; i++) bins[i] = 210;
    controller.applyAudioBins(bins, 0.2);

    const visemeAaIdx = humanoid.morphTargetDictionary.viseme_aa;
    const smileLIdx = humanoid.morphTargetDictionary.mouthSmileLeft;
    assert.ok(visemeAaIdx !== undefined);
    assert.ok(humanoid.morphTargetInfluences[visemeAaIdx] > 0.1, 'Audio drives viseme_aa morph');
    assert.ok(humanoid.morphTargetInfluences[smileLIdx] > 0.5, 'Smile expression persists alongside speech visemes');
    assert.equal(packets.length, 1);
    assert.ok(JSON.stringify(packets[0]).length < 200, 'Quantized puppet packet is compact');

    // Non-humanoid Insectoid and Spider articulate mandible bones when speaking
    for (const plan of [BODY_PLANS.INSECTOID, BODY_PLANS.SPIDER]) {
        const creature = engine.generateProceduralAvatar(plan);
        const creatureCtrl = new LiveAvatarController(creature, plan.name.toLowerCase());
        creatureCtrl.applyAudioBins(bins, 0.2);
        const mL = creature.skeleton.bones.find(b => b.name === 'mandible_l');
        const mR = creature.skeleton.bones.find(b => b.name === 'mandible_r');
        assert.ok(mL && mR, `${plan.name} has articulated mandibles`);
        assert.ok(mL.rotation.y < -0.05 && mR.rotation.y > 0.05, `${plan.name} mandibles open symmetrically`);
    }
});

test('Webcam landmark fixture clamps AnimationBlender skeleton slerps and puppet packet round-trips cleanly', async () => {
    const engine = new AvatarEngine();
    const mesh = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID);
    const controller = new LiveAvatarController(mesh, 'humanoid');
    await controller.init();

    // Feed extreme/out-of-range landmark fixture -> AnimationBlender clamps within anatomical bounds
    const tracked = controller.vtuber.processLandmarkFixture({
        face: {
            head: { x: 4.5, y: -3.2, z: 2.0 },
            neck: { x: 0.2, y: 0.1, z: 0 },
            eye: { l: 0.1, r: 0.1 },
            mouth: { y: 0.85, shape: { x: 0.4, y: 0.85 } }
        },
        pose: {
            spine: { x: 0.1, y: 0.2, z: 0 },
            leftUpperArm: { x: 0.5, y: 0.2, z: -0.3 }
        }
    });
    assert.ok(tracked);
    controller.update(0.016, new THREE.Vector3(0, 0, 0));

    const headBone = mesh.skeleton.getBoneByName('head');
    const euler = new THREE.Euler().setFromQuaternion(headBone.quaternion, 'XYZ');
    assert.ok(Number.isFinite(euler.x) && Math.abs(euler.x) <= 0.8);
    assert.ok(Number.isFinite(euler.y) && Math.abs(euler.y) <= 0.8);

    // Remote quantized packet round-trip
    const encoded = encodePuppetPacket({
        jawOpen: 0.62,
        viseme_aa: 0.54,
        viseme_ee: 0.22,
        viseme_oh: 0.31,
        viseme_oo: 0.12,
        blink: 0.8,
        smile: 0.5,
        frown: 0,
        headPitch: 0.25,
        headYaw: -0.35,
        headRoll: 0.1
    });
    const decoded = decodePuppetPacket(encoded);
    assert.ok(Math.abs(decoded.jawOpen - 0.62) <= 0.015);
    assert.ok(Math.abs(decoded.headYaw + 0.35) <= 0.015);

    const receiverMesh = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID);
    const receiverCtrl = new LiveAvatarController(receiverMesh, 'humanoid');
    receiverCtrl.applyRemotePuppetPacket(encoded);
    assert.ok(receiverMesh.morphTargetInfluences[receiverMesh.morphTargetDictionary.jawOpen] > 0.5);
});
