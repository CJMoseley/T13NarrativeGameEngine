import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPhysicalValueTest } from '../src/t13ne/modules/mechanics/PhysicalValueTest.js';
import { PhysXProvider } from '../src/t13ne/core/physics/PhysXProvider.js';

test('a combined Value can overcome resistance and apply calibrated force to PhysX', () => {
    const provider = new PhysXProvider();
    const target = {};
    const calls = [];
    provider.initialized = true;
    provider.physx = { PxForceMode: { eFORCE: 7 } };
    provider.bodies.set(target, { isStatic: false, body: { addForce: (...args) => calls.push(args) } });
    const force = { x: 3, y: 0, z: 0 };
    const run = contributions => applyPhysicalValueTest({
        contributions, resistance: 111, force, target, physics: provider
    });
    assert.deepEqual(run([66]), { actorValue: 66, resistance: 111, outcome: 'failure', forceApplied: false });
    assert.equal(run([111]).outcome, 'tie');
    assert.equal(calls.length, 0);
    assert.deepEqual(run([66, 66]), { actorValue: 132, resistance: 111, outcome: 'success', forceApplied: true });
    assert.deepEqual(calls, [[force, 7]]);
});

test('invalid inputs and unavailable physics bodies fail explicitly', () => {
    const provider = new PhysXProvider();
    const target = {};
    const options = { contributions: [66, 66], resistance: 111, force: { x: 1, y: 0, z: 0 }, target, physics: provider };
    assert.throws(() => applyPhysicalValueTest({ ...options, contributions: [NaN] }), /Values/);
    assert.throws(() => applyPhysicalValueTest({ ...options, force: { x: Infinity, y: 0, z: 0 } }), /force vector/);
    assert.throws(() => applyPhysicalValueTest(options), /not initialized/);
    provider.initialized = true;
    assert.throws(() => applyPhysicalValueTest(options), /dynamic body/);
    provider.bodies.set(target, { isStatic: true });
    assert.throws(() => applyPhysicalValueTest(options), /dynamic body/);
});
