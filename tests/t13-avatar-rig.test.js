import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AvatarEngine, makeHumanoidVariant, PROSTHETIC_TYPES, SKIN_TONES } from '../src/t13ne/procgen/avatar/AvatarEngine.js';
const CompanionAvatarEngine = AvatarEngine;
import { BODY_PLANS, COMPONENT_TYPES } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';
import { ATLAS_SIZE } from '../src/t13ne/procgen/avatar/AvatarAtlas.js';

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
    const offset = (head.y * ATLAS_SIZE + head.x) * 4;
    const expected = SKIN_TONES[3];
    for (let i = 0; i < 3; i++) {
        const channel = (expected >> (16 - 8 * i)) & 255;
        assert.ok(Math.abs(pixels[offset + i] - channel) <= 16);
    }
});

test('humanoid landmarks and head are proportioned to measured body height', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { height: 1, build: 1, musculature: 0, litheness: 0, prosthetics: [] });
        mesh.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
        const height = bounds.max.y - bounds.min.y;
        const boneY = name => mesh.skeleton.bones.find(b => b.name === name).getWorldPosition(new THREE.Vector3()).y - bounds.min.y;
        const head = BODY_PLANS.HUMANOID.components.find(c => c.id === 'head').box;
        assert.ok(height > 1.7 && height < 1.85);
        assert.ok(head.size[1] / height > 0.125 && head.size[1] / height < 0.145, 'head is roughly one seventh of height');
        assert.ok(boneY('hips') / height > 0.50 && boneY('hips') / height < 0.56);
        assert.ok(boneY('leg_l_joint_1') / height > 0.27 && boneY('leg_l_joint_1') / height < 0.31);
        assert.ok(boneY('arm_l') / height > 0.76 && boneY('arm_l') / height < 0.82);
        assert.ok(boneY('arm_l_joint_1') / height > 0.59 && boneY('arm_l_joint_1') / height < 0.65);
        assert.ok(boneY('arm_l_joint_2') / height > 0.44 && boneY('arm_l_joint_2') / height < 0.50);
    }
});

test('humanoid neck has an octagonal cross section rather than rectangular corners', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const engine = new Engine();
        const neck = BODY_PLANS.HUMANOID.components.find(c => c.id === 'neck').box;
        const geo = engine._roundedSpec(neck.size, neck.center, 0);
        const p = geo.attributes.position;
        const points = Array.from({ length: p.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(p, i));
        const halfWidth = neck.size[0] / 2, halfDepth = neck.size[2] / 2;
        assert.ok(points.some(v => Math.abs(Math.abs(v.x) - halfWidth) < 1e-6 && Math.abs(v.z) < 1e-6));
        assert.ok(points.some(v => Math.abs(Math.abs(v.z) - halfDepth) < 1e-6 && Math.abs(v.x) < 1e-6));
        assert.ok(points.every(v => Math.abs(v.x) < halfWidth * 0.99 || Math.abs(v.z) < halfDepth * 0.99));
    }
});

test('humanoid thighs are wider than lower legs and the ankle tapers', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { height: 1, build: 1, musculature: 0, litheness: 0 });
        const p = mesh.geometry.attributes.position, skin = mesh.geometry.attributes.skinIndex;
        const thighIndex = mesh.skeleton.bones.findIndex(b => b.name === 'leg_l');
        const calfIndex = mesh.skeleton.bones.findIndex(b => b.name === 'leg_l_joint_1');
        const widthAt = (index, low, high) => {
            const xs = [];
            for (let i = 0; i < p.count; i++) {
                if (skin.getX(i) === index && p.getY(i) >= low && p.getY(i) <= high) xs.push(p.getX(i));
            }
            assert.ok(xs.length);
            return Math.max(...xs) - Math.min(...xs);
        };
        const thigh = widthAt(thighIndex, 0.70, 0.85);
        const calf = widthAt(calfIndex, 0.25, 0.40);
        const ankle = widthAt(calfIndex, 0.065, 0.08);
        assert.ok(thigh > calf * 1.2);
        assert.ok(calf > ankle * 1.15);
    }
});

test('humanoid head and hair cap have a raised crown and tapered jaw', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const engine = new Engine();
        const geometry = engine._boxSpec([2, 2, 2], [0, 0, 0], true);
        const positions = geometry.attributes.position;
        const points = Array.from({ length: positions.count }, (_, i) =>
            new THREE.Vector3().fromBufferAttribute(positions, i));
        assert.ok(points.some(p => Math.abs(p.x) < 1e-6 && Math.abs(p.z) < 1e-6 && Math.abs(p.y - 1) < 1e-6));
        assert.ok(points.some(p => p.x > 0.5 && p.z > 0.5 && p.y < 0.8 && p.y > 0.7), 'crown corners slope down');
        assert.ok(points.some(p => p.x > 0.6 && p.z > 0.6 && p.y > -0.8 && p.y < -0.7), 'jaw corners slope up');
        assert.equal(geometry.parameters.widthSegments, 4);
        const mesh = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID);
        assert.ok(mesh.children.some(child => child.geometry?.attributes.faceFeature?.getX(0) === 7 &&
            child.geometry.parameters.widthSegments === 4), 'hair cap uses the faceted silhouette');
    }
});

test('humanoid torso narrows towards the waist and has bevelled corners', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const engine = new Engine();
        const spec = BODY_PLANS.HUMANOID.components.find(component => component.id === 'spine').box;
        const geometry = engine._torsoSpec(spec, 'spine');
        const p = geometry.attributes.position;
        const halfHeight = spec.size[1] / 2;
        const atY = (y) => Array.from({ length: p.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(p, i))
            .filter(point => Math.abs(point.y - (spec.center[1] + y)) < 1e-5);
        const top = atY(halfHeight);
        const bottom = atY(-halfHeight);
        assert.ok(top.length && bottom.length);
        assert.ok(Math.max(...top.map(v => Math.abs(v.x))) > Math.max(...bottom.map(v => Math.abs(v.x))) * 1.2);
        assert.ok(top.some(v => Math.abs(v.z) > 0.01 && Math.abs(v.x) > 0.01 &&
            Math.abs(v.x) < Math.max(...top.map(point => Math.abs(point.x))) * 0.95));
    }
});

test('humanoid waist overlaps the pelvis and leg pivots are enclosed at rest and when posed', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { height: 1, build: 1, musculature: 0, litheness: 0 });
        const positions = mesh.geometry.attributes.position;
        const indices = mesh.geometry.attributes.skinIndex;
        const bounds = (name) => {
            const index = mesh.skeleton.bones.findIndex(bone => bone.name === name);
            assert.ok(index >= 0);
            const box = new THREE.Box3();
            for (let i = 0; i < positions.count; i++) {
                if (indices.getX(i) === index) box.expandByPoint(new THREE.Vector3().fromBufferAttribute(positions, i));
            }
            return box;
        };
        const pelvis = bounds('hips');
        const torso = bounds('spine');
        assert.ok(pelvis.max.y - torso.min.y > 0.005, 'torso overlaps the pelvis');
        for (const side of ['l', 'r']) {
            const bone = mesh.skeleton.bones.find(b => b.name === `leg_${side}`);
            const pivot = bone.getWorldPosition(new THREE.Vector3());
            assert.ok(pelvis.containsPoint(pivot), `${side} hip pivot lies inside the pelvis`);
            assert.ok(bounds(bone.name).max.y > pelvis.min.y, `${side} thigh overlaps the pelvis`);
            bone.rotation.x = 0.6;
            mesh.updateMatrixWorld(true);
            assert.ok(pivot.distanceTo(bone.getWorldPosition(new THREE.Vector3())) < 1e-6, 'leg rotates about its enclosed hip pivot');
        }
    }
});

test('humanoid rest pose hangs the arms down rather than out in a T', () => {
    const mesh = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { prosthetics: [] });
    const box = new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
    const halfSpan = Math.max(Math.abs(box.min.x), Math.abs(box.max.x));
    assert.ok(halfSpan < 0.4, `arms stay near the body (half span ${halfSpan.toFixed(2)})`);
    assert.ok(box.min.y < 0.8, 'fingertips reach at least to mid thigh');
});

test('humanoid hands are proportioned to the head and forearm and attach at the wrist', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { height: 1, build: 1, musculature: 0, litheness: 0 });
        const position = mesh.geometry.attributes.position;
        const skinIndex = mesh.geometry.attributes.skinIndex;
        for (const side of ['l', 'r']) {
            const arm = BODY_PLANS.HUMANOID.components.find(component => component.id === `arm_${side}`);
            const head = BODY_PLANS.HUMANOID.components.find(component => component.id === 'head');
            const index = mesh.skeleton.bones.findIndex(bone => bone.name === `arm_${side}_joint_2`);
            assert.ok(index >= 0);
            const wrist = new THREE.Vector3();
            mesh.skeleton.bones[index].getWorldPosition(wrist);
            const box = new THREE.Box3();
            for (let vertex = 0; vertex < position.count; vertex++) {
                if (skinIndex.getX(vertex) === index) box.expandByPoint(new THREE.Vector3().fromBufferAttribute(position, vertex));
            }
            const size = box.getSize(new THREE.Vector3());
            const forearmLength = new THREE.Vector3(...arm.segments[1]).length();
            assert.ok(size.y / head.box.size[1] > 0.6 && size.y / head.box.size[1] < 0.8);
            assert.ok(size.y / forearmLength > 0.55 && size.y / forearmLength < 0.75);
            assert.ok(size.x / size.y > 0.4 && size.x / size.y < 0.55);
            assert.ok(size.z < size.x * 0.5, 'the hand is flatter than it is wide');
            assert.ok(Math.abs(box.max.y - wrist.y) < 1e-5);
            assert.ok(box.min.y < 0.75 && box.min.y > 0.60, 'fingertips reach the thigh');
        }
    }
});

test('humanoid hair is visible at the front rather than hidden inside the head', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
        mesh.updateMatrixWorld(true);
        const origin = mesh.skeleton.bones.find(bone => bone.name === 'head').getWorldPosition(new THREE.Vector3());
        const head = BODY_PLANS.HUMANOID.components.find(component => component.id === 'head').box;
        const ray = new THREE.Raycaster(new THREE.Vector3(0, origin.y + head.size[1] * 0.9, 2), new THREE.Vector3(0, 0, -1));
        const hit = ray.intersectObject(mesh)[0];
        assert.ok(hit?.uv);
        const rect = mesh.userData.avatarAtlas.regions['head:hair'];
        const x = hit.uv.x * ATLAS_SIZE, y = (1 - hit.uv.y) * ATLAS_SIZE;
        assert.ok(x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h);
    }
});

test('facial features are separate rigged meshes and smiles move mouth corners only', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID);
        const features = mesh.children.filter(child => child.name === 'avatar-face-feature');
        const corners = features.filter(child => child.geometry.attributes.faceFeature.getX(0) === 3);
        const brows = features.filter(child => child.geometry.attributes.faceFeature.getX(0) === 2);
        assert.equal(corners.length, 2);
        assert.equal(brows.length, 2);
        for (const feature of features) {
            assert.equal(feature.skeleton, mesh.skeleton);
            assert.equal(feature.morphTargetInfluences, mesh.morphTargetInfluences);
        }
        const head = mesh.skeleton.bones.find(bone => bone.name === 'head');
        assert.ok(head);
        const feature = corners[0];
        mesh.updateMatrixWorld(true);
        mesh.skeleton.update();
        const before = feature.getVertexPosition(0, new THREE.Vector3());
        head.rotation.y = 0.5;
        mesh.updateMatrixWorld(true);
        mesh.skeleton.update();
        const after = feature.getVertexPosition(0, new THREE.Vector3());
        assert.ok(before.distanceTo(after) > 0.01, 'facial geometry follows the head bone');
        for (const name of ['mouthSmileLeft', 'mouthSmileRight']) {
            const index = mesh.morphTargetDictionary[name];
            assert.ok(mesh.geometry.morphAttributes.position[index].array.every(value => value === 0));
            const shifts = corners.map(child => child.geometry.morphAttributes.position[index].array);
            assert.ok(shifts.some(array => array.some(value => value !== 0)));
        }
        for (const corner of corners) {
            const pos = corner.geometry.attributes.position;
            const side = pos.getX(0) < 0 ? 'Left' : 'Right';
            const deltas = corner.geometry.morphAttributes.position[mesh.morphTargetDictionary[`mouthSmile${side}`]];
            const xs = Array.from({ length: pos.count }, (_, i) => pos.getX(i));
            const inner = side === 'Left' ? Math.max(...xs) : Math.min(...xs);
            for (let i = 0; i < pos.count; i++) {
                if (Math.abs(pos.getX(i) - inner) < 1e-6) assert.ok(Math.abs(deltas.getY(i)) < 1e-6, 'inner mouth edge stays connected');
            }
        }
        for (const name of ['browDownLeft', 'browDownRight']) {
            const index = mesh.morphTargetDictionary[name];
            assert.ok(brows.some(child => child.geometry.morphAttributes.position[index].array.some(value => value !== 0)));
        }
    }
});

test('humanoid facial markings follow the head surface and retain the front atlas tile', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        for (const seed of ['model-maker', 'character-one', 'character-two']) {
            const engine = new Engine();
            const mesh = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID, makeHumanoidVariant(seed));
            const spec = BODY_PLANS.HUMANOID.components.find(component => component.id === 'head').box;
            const head = new THREE.Mesh(engine._boxSpec(spec.size, spec.center, true));
            head.position.copy(mesh.skeleton.bones.find(bone => bone.name === 'head').getWorldPosition(new THREE.Vector3()));
            head.updateMatrixWorld(true);
            const features = mesh.children.filter(child => [1, 2, 3, 4].includes(child.geometry?.attributes.faceFeature?.getX(0)));
            assert.equal(features.length, 7);
            for (const feature of features) {
                assert.equal(feature.geometry.type, 'BufferGeometry');
                const pos = feature.geometry.attributes.position;
                const uv = feature.geometry.attributes.uv;
                for (let i = 0; i < pos.count; i++) {
                    const ray = new THREE.Raycaster(new THREE.Vector3(pos.getX(i), pos.getY(i), 2), new THREE.Vector3(0, 0, -1));
                    const hit = ray.intersectObject(head)[0];
                    assert.ok(hit, `${seed}: feature projects onto the head`);
                    assert.ok(Math.abs(pos.getZ(i) - hit.point.z - 0.001 * engine.variant.build) < 1e-5, `${seed}: feature rests on the surface`);
                    const x = Math.floor(uv.getX(i) * ATLAS_SIZE);
                    const y = Math.floor((1 - uv.getY(i)) * ATLAS_SIZE);
                    const rect = Object.values(mesh.userData.avatarAtlas.regions).find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
                    assert.ok(rect && x >= rect.x + 16 && x < rect.x + 32 && y >= rect.y + 16, 'feature retains the original front-face tile');
                }
            }
            head.geometry.dispose();
            head.material.dispose();
        }
    }
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

test('humanoid hands use a sculpted low-poly mitten and thumb rather than a single box', () => {
    for (const Engine of [AvatarEngine, CompanionAvatarEngine]) {
        const mesh = new Engine().generateProceduralAvatar(BODY_PLANS.HUMANOID, { height: 1, build: 1, musculature: 0, litheness: 0 });
        const si = mesh.geometry.attributes.skinIndex;
        const wristIdx = mesh.skeleton.bones.findIndex(b => b.name === 'arm_l_joint_2');
        let wristVerts = 0;
        for (let i = 0; i < si.count; i++) {
            if (si.getX(i) === wristIdx) wristVerts++;
        }
        assert.ok(wristVerts > 30, `sculpted PS1 hand with palm and thumb has >30 vertices (got ${wristVerts})`);
    }
});

test('spider legs arch outward and upward before descending, and winged avatars build wing membranes', () => {
    const spider = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.SPIDER);
    const sPos = spider.geometry.attributes.position;
    const sBounds = new THREE.Box3().setFromBufferAttribute(sPos);
    const cephY = spider.skeleton.bones.find(b => b.name === 'cephalothorax').getWorldPosition(new THREE.Vector3()).y;
    assert.ok(sBounds.max.y > cephY + 0.1, 'spider legs arch above the cephalothorax');
    assert.ok(sBounds.min.y < 0.05 && sBounds.min.y > -0.05, 'spider feet reach the ground');
    assert.ok(sBounds.max.x - sBounds.min.x > 0.8, 'spider legs splay outward');

    const winged = new AvatarEngine().generateProceduralAvatar(BODY_PLANS.WINGED);
    const wSi = winged.geometry.attributes.skinIndex;
    const wingRootIdx = winged.skeleton.bones.findIndex(b => b.name === 'wing_l');
    let wingRootVerts = 0;
    for (let i = 0; i < wSi.count; i++) {
        if (wSi.getX(i) === wingRootIdx) wingRootVerts++;
    }
    assert.ok(wingRootVerts > 40, `wing root includes membrane + segment + cap vertices (got ${wingRootVerts})`);
});

test('every speciesfoundations and naming.json body plan resolves and builds a skinned mesh', async () => {
    const fs = await import('node:fs');
    const { resolveBodyPlan } = await import('../src/t13ne/procgen/avatar/BodyPlanSchema.js');
    const foundations = JSON.parse(fs.readFileSync(new URL('../public/data/speciesfoundations.json', import.meta.url), 'utf8'));
    const naming = JSON.parse(fs.readFileSync(new URL('../public/data/naming.json', import.meta.url), 'utf8'));
    const speciesPlans = foundations.find(e => e.id === 'BODY_PLANS').data;
    const alienPlans = naming.ALIEN_BODYPLAN;

    const expectedNonHumanoid = speciesPlans.filter(p => !p.includes('humanoid'));
    for (const label of expectedNonHumanoid) {
        const plan = resolveBodyPlan(label);
        assert.notEqual(plan.name, 'Humanoid', `${label} resolves to a non-humanoid plan (got ${plan.name})`);
        const mesh = new AvatarEngine().generateProceduralAvatar(plan);
        assert.ok(mesh.isSkinnedMesh, `${label} (${plan.name}) builds a SkinnedMesh`);
    }
    assert.equal(resolveBodyPlan('Octopod').name, 'Octopod');
    assert.equal(resolveBodyPlan('Spider').name, 'Spider');
    for (const label of [...speciesPlans, ...alienPlans, 'Winged Biped', 'Hexapod', 'Octopod', 'Myriapod']) {
        const plan = resolveBodyPlan(label);
        assert.ok(plan && plan.components.length > 0, `${label} resolves to ${plan?.name}`);
    }
});

test('limb scaling affects only LIMB_CHAIN length and thickness, and bend morphs hold under extreme scaling', () => {
    const engine = new AvatarEngine();
    const litheWinged = engine.generateProceduralAvatar(BODY_PLANS.WINGED, { litheness: 1, musculature: -1 });
    const stockyWinged = engine.generateProceduralAvatar(BODY_PLANS.WINGED, { litheness: -1, musculature: 1 });

    // Limb chains (arms/legs) change bone segment length with litheness, while wings stay unchanged
    const boneDist = (mesh, parentName, childName) => {
        const p = mesh.skeleton.bones.find(b => b.name === parentName).getWorldPosition(new THREE.Vector3());
        const c = mesh.skeleton.bones.find(b => b.name === childName).getWorldPosition(new THREE.Vector3());
        return p.distanceTo(c);
    };
    assert.ok(boneDist(litheWinged, 'arm_l', 'arm_l_joint_1') > boneDist(stockyWinged, 'arm_l', 'arm_l_joint_1'), 'lithe arm segment is longer');
    assert.ok(boneDist(litheWinged, 'leg_l', 'leg_l_joint_1') > boneDist(stockyWinged, 'leg_l', 'leg_l_joint_1'), 'lithe leg segment is longer');
    assert.ok(Math.abs(boneDist(litheWinged, 'wing_l', 'wing_l_joint_1') - boneDist(stockyWinged, 'wing_l', 'wing_l_joint_1')) < 1e-6, 'wing segment ignores LIMB_CHAIN scaling');

    // Quadruped tail ignores LIMB_CHAIN scaling
    const litheQuad = engine.generateProceduralAvatar(BODY_PLANS.QUADRUPED, { litheness: 1, musculature: 1 });
    const stockyQuad = engine.generateProceduralAvatar(BODY_PLANS.QUADRUPED, { litheness: -1, musculature: -1 });
    assert.ok(Math.abs(boneDist(litheQuad, 'tail', 'tail_joint_1') - boneDist(stockyQuad, 'tail', 'tail_joint_1')) < 1e-6, 'tail segment ignores LIMB_CHAIN scaling');

    // Muscular stocky thigh is thicker than low-muscle lithe thigh
    const thighWidth = (mesh) => {
        const pos = mesh.geometry.attributes.position;
        const si = mesh.geometry.attributes.skinIndex;
        const idx = mesh.skeleton.bones.findIndex(b => b.name === 'leg_l');
        const xs = [];
        for (let i = 0; i < pos.count; i++) {
            if (si.getX(i) === idx) xs.push(pos.getX(i));
        }
        return Math.max(...xs) - Math.min(...xs);
    };
    assert.ok(thighWidth(stockyWinged) > thighWidth(litheWinged) * 1.3, 'muscular momentum limb is thicker than slender lithe limb');

    // Bend morphs remain valid and isolated under extreme limb scaling, and triangle counts stay within PS1/PS2 budget
    for (const variant of [{ litheness: 1, musculature: 1 }, { litheness: -1, musculature: -1 }]) {
        const mesh = engine.generateProceduralAvatar(BODY_PLANS.HUMANOID, variant);
        const triCount = (mesh.geometry.index ? mesh.geometry.index.count : mesh.geometry.attributes.position.count) / 3;
        assert.ok(triCount < 2500, `PS1/PS2 low-poly triangle budget holds (got ${triCount})`);
        for (const [morphName, idx] of Object.entries(mesh.morphTargetDictionary)) {
            if (!morphName.startsWith('bend_')) continue;
            const attr = mesh.geometry.morphAttributes.position[idx];
            let maxDelta = 0;
            for (let v = 0; v < attr.count; v++) {
                const d = Math.hypot(attr.getX(v), attr.getY(v), attr.getZ(v));
                assert.ok(Number.isFinite(d), `${morphName} delta is finite`);
                maxDelta = Math.max(maxDelta, d);
            }
            assert.ok(maxDelta > 0.01 && maxDelta < 1.5, `${morphName} moves distal limb within sane bounds (${maxDelta.toFixed(3)})`);
        }
    }
});
