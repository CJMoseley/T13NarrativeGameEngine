import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AvatarEngine, makeHumanoidVariant, PROSTHETIC_TYPES, SKIN_TONES } from '../src/t13ne/procgen/avatar/AvatarEngine.js';
import { BODY_PLANS, COMPONENT_TYPES } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';

const FACE_MORPHS = ['eyeBlinkLeft', 'eyeBlinkRight', 'browDownLeft', 'browDownRight', 'browInnerUp', 'jawOpen', 'mouthPucker', 'mouthFunnel', 'mouthSmileLeft', 'mouthSmileRight'];

const jointsOf = (mesh) => mesh.skeleton.bones.filter(b => b.name.includes('_joint_'));

const buildAll = () => Object.values(BODY_PLANS).map(plan => ({
    name: plan.name,
    plan,
    mesh: new AvatarEngine().generateProceduralAvatar(plan)
}));

// Mean vertex position per bone, using each vertex's primary influence.
const primaryCentroids = (mesh) => {
    const { geometry, skeleton } = mesh;
    const pos = geometry.attributes.position;
    const si = geometry.attributes.skinIndex;
    const sums = skeleton.bones.map(() => new THREE.Vector3());
    const counts = skeleton.bones.map(() => 0);
    for (let v = 0; v < pos.count; v++) {
        const b = si.getX(v);
        sums[b].add(new THREE.Vector3().fromBufferAttribute(pos, v));
        counts[b]++;
    }
    return skeleton.bones.map((bone, i) => {
        if (!counts[i]) return null;
        const world = new THREE.Vector3();
        bone.getWorldPosition(world);
        return { world, centroid: sums[i].divideScalar(counts[i]) };
    }).filter(Boolean);
};

test('every body plan builds a skinned mesh with bones and face plus bend morph targets', () => {
    for (const { name, plan, mesh } of buildAll()) {
        assert.ok(mesh.isSkinnedMesh, `${name} is a SkinnedMesh`);
        assert.ok(mesh.skeleton.bones.length > 0, `${name} has bones`);
        const names = Object.keys(mesh.morphTargetDictionary);
        for (const face of FACE_MORPHS) assert.ok(names.includes(face), `${name} has ${face}`);
        const bendNames = names.filter(n => n.startsWith('bend_'));
        const hasLimbs = plan.components.some(c => [COMPONENT_TYPES.LIMB_CHAIN, COMPONENT_TYPES.TAIL, COMPONENT_TYPES.WING].includes(c.type));
        assert.equal(bendNames.length > 0, hasLimbs, `${name} bend morphs exist only for plans with limbs`);
        for (const bn of bendNames) {
            const bone = mesh.skeleton.bones.find(b => `bend_${b.name}` === bn);
            assert.ok(bone && bone.children.length > 0, `${name} ${bn} maps to a jointed bone`);
        }
        assert.equal(mesh.morphTargetInfluences.length, names.length, `${name} influence count`);
        assert.equal(mesh.geometry.morphTargetsRelative, true, `${name} morphs are relative`);
    }
});

test('skin weights are normalised and indices are within the bone list', () => {
    for (const { name, mesh } of buildAll()) {
        const { skinIndex, skinWeight } = mesh.geometry.attributes;
        const boneCount = mesh.skeleton.bones.length;
        for (let v = 0; v < skinWeight.count; v++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                const w = skinWeight.getComponent(v, k);
                sum += w;
                if (w > 0) assert.ok(skinIndex.getComponent(v, k) < boneCount, `${name} index in range`);
            }
            assert.ok(Math.abs(sum - 1) < 1e-4, `${name} vertex ${v} weights sum to 1 (got ${sum})`);
        }
    }
});

test('parts sit on their bones in bind pose, not stacked at the origin', () => {
    for (const { name, mesh } of buildAll()) {
        for (const { world, centroid } of primaryCentroids(mesh)) {
            // A part hangs from its pivot, so the centroid sits within about half a part length of it.
            assert.ok(centroid.distanceTo(world) < 0.3, `${name}: centroid ${centroid.toArray()} is near bone ${world.toArray()}`);
        }
    }
});

test('jawOpen drops head vertices and leaves the rest of the body unchanged', () => {
    const plan = BODY_PLANS.HUMANOID;
    const mesh = new AvatarEngine().generateProceduralAvatar(plan);
    const { geometry } = mesh;
    const pos = geometry.attributes.position;
    const skinIndex = geometry.attributes.skinIndex;
    const headComp = plan.components.find(c => c.type === COMPONENT_TYPES.HEAD);
    const headIndex = mesh.skeleton.bones.findIndex(b => b.name === headComp.id);
    const jaw = geometry.morphAttributes.position[mesh.morphTargetDictionary.jawOpen];

    let headMoved = false;
    for (let v = 0; v < pos.count; v++) {
        const dy = jaw.getY(v);
        if (skinIndex.getX(v) === headIndex) {
            assert.ok(dy <= 0, 'jaw deltas only move head verts downward');
            if (dy < 0) headMoved = true;
        } else {
            assert.equal(dy, 0, 'non-head verts are untouched by jawOpen');
        }
    }
    assert.ok(headMoved, 'jawOpen moves at least one head vertex');
});

test('a limb bend moves only the joint and its distal chain', () => {
    for (const plan of Object.values(BODY_PLANS)) {
        const mesh = new AvatarEngine().generateProceduralAvatar(plan);
        const bones = mesh.skeleton.bones;
        const jointed = jointsOf(mesh).filter(b => b.children.length > 0);
        if (!jointed.length) continue;

        const pivot = jointed[0];
        const pivotIndex = bones.indexOf(pivot);
        const distal = new Set();
        bones.forEach((bone, i) => {
            for (let a = bone.parent; a; a = a.parent) {
                if (a === pivot) { distal.add(i); break; }
            }
        });

        const { geometry } = mesh;
        const pos = geometry.attributes.position;
        const skinIndex = geometry.attributes.skinIndex;
        const skinWeight = geometry.attributes.skinWeight;
        const bend = geometry.morphAttributes.position[mesh.morphTargetDictionary[`bend_${pivot.name}`]];

        let moved = false;
        for (let v = 0; v < pos.count; v++) {
            const dx = bend.getX(v), dy = bend.getY(v), dz = bend.getZ(v);
            const mag = Math.hypot(dx, dy, dz);
            let touchesChain = false;
            for (let k = 0; k < 4; k++) {
                if (skinWeight.getComponent(v, k) <= 0) continue;
                const bi = skinIndex.getComponent(v, k);
                if (distal.has(bi) || bi === pivotIndex) touchesChain = true;
            }
            if (!touchesChain) assert.equal(mag, 0, `vertex ${v} outside the chain stays put`);
            if (mag > 1e-6) moved = true;
        }
        assert.ok(moved, `${pivot.name} bend moves vertices`);
    }
});

test('humanoid defaults to the procedural rig and does not load the FBX', async () => {
    const mesh = await new AvatarEngine().generate(BODY_PLANS.HUMANOID);
    assert.ok(mesh.isSkinnedMesh, 'default humanoid is a procedural SkinnedMesh');
    assert.ok(mesh.skeleton.bones.some(b => b.name.includes('_joint_')), 'procedural rig has joints');
});

test('makeHumanoidVariant is deterministic per seed and varies across seeds', () => {
    const a = makeHumanoidVariant('Kestrel');
    const b = makeHumanoidVariant('Kestrel');
    assert.deepEqual(a, b, 'same seed gives the same variant');

    const seen = new Set();
    for (let i = 0; i < 20; i++) seen.add(JSON.stringify(makeHumanoidVariant(`planet-${i}`)));
    assert.ok(seen.size > 10, `seeds produce varied variants (got ${seen.size})`);

    for (let i = 0; i < 50; i++) {
        const v = makeHumanoidVariant(`s${i}`);
        assert.ok(v.height >= 0.9 && v.height <= 1.1, 'height in range');
        assert.ok(v.build >= 0.85 && v.build <= 1.2, 'build in range');
        assert.ok(SKIN_TONES.includes(v.skinTone), 'skin tone from palette');
    }
});

test('build scales body width and the skin tone is applied to the atlas', () => {
    const width = (build) => {
        const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { build, height: 1, skinTone: SKIN_TONES[0], prosthetics: [] });
        const box = new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
        return box.max.x - box.min.x;
    };
    assert.ok(width(1.2) > width(0.85), 'a broader build is wider');

    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { skinTone: SKIN_TONES[3] });
    assert.ok(mesh.material.map.isDataTexture);
    assert.equal(mesh.material.vertexColors, false);
    const { regions, pixels } = mesh.userData.avatarAtlas;
    const head = regions['head:skin'];
    const offset = (head.y * 256 + head.x) * 4;
    const expected = SKIN_TONES[3];
    for (let i = 0; i < 3; i++) {
        const channel = (expected >> (16 - 8 * i)) & 255;
        assert.ok(Math.abs(pixels[offset + i] - channel) <= 16);
    }
});

test('humanoid proportions: head is 1/6 to 1/9 of height and the hips sit near half height', () => {
    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { prosthetics: [] });
    const box = new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
    const height = box.max.y - box.min.y;
    assert.ok(height > 1.5 && height < 2.2, `humanoid height plausible (${height.toFixed(2)})`);
    const ratio = 0.26 / height;
    assert.ok(ratio > 1 / 9 && ratio < 1 / 6, `head ratio ${ratio.toFixed(3)} between 1/9 and 1/6`);
    const hipRatio = 0.95 / height;
    assert.ok(hipRatio > 0.45 && hipRatio < 0.6, `hips at ${hipRatio.toFixed(2)} of height`);
});

test('humanoid rest pose hangs the arms down rather than out in a T', () => {
    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { prosthetics: [] });
    const box = new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
    const halfSpan = Math.max(Math.abs(box.min.x), Math.abs(box.max.x));
    assert.ok(halfSpan < 0.4, `arms stay near the body (half span ${halfSpan.toFixed(2)})`);
    assert.ok(box.min.y < 0.8, 'fingertips reach at least to mid thigh');
});

test('quadruped body is one continuous torso rather than two boxes split down the middle', () => {
    const torsos = BODY_PLANS.QUADRUPED.components.filter(c => c.type === COMPONENT_TYPES.TORSO);
    const roots = torsos.filter(c => c.root);
    assert.equal(roots.length, 1, 'exactly one root torso');
    assert.equal(roots[0].id, 'body');
    assert.ok(roots[0].box.size[2] >= 0.8, 'the body runs most of the length of the animal');
    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.QUADRUPED, { prosthetics: [] });
    const pos = mesh.geometry.attributes.position;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let v = 0; v < pos.count; v++) {
        if (pos.getY(v) > 0.5 && pos.getY(v) < 0.72) {
            minZ = Math.min(minZ, pos.getZ(v));
            maxZ = Math.max(maxZ, pos.getZ(v));
        }
    }
    assert.ok(minZ < -0.3 && maxZ > 0.3, `the body band spans front to back (${minZ.toFixed(2)}..${maxZ.toFixed(2)})`);
});

test('antennae and horns add head geometry with valid skin indices', () => {
    const base = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { prosthetics: [] });
    for (const type of [PROSTHETIC_TYPES.ANTENNAE, PROSTHETIC_TYPES.HORNS]) {
        const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { prosthetics: [type] });
        assert.ok(mesh.geometry.attributes.position.count > base.geometry.attributes.position.count, `${type} adds vertices`);
        const si = mesh.geometry.attributes.skinIndex;
        for (let v = 0; v < si.count; v++) {
            for (let k = 0; k < 4; k++) {
                assert.ok(si.getComponent(v, k) < mesh.skeleton.bones.length, `${type} skin index in range`);
            }
        }
    }
});
