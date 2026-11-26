import test from 'node:test';
import assert from 'node:assert/strict';
import { systemBodyCount, systemHudText } from '../src/t13ne/scenes/SystemHud.js';

test('system HUD includes distinct names and counts stars, planets and moons', () => {
    const system = { name: 'Common', systemNameFull: ['Common', 'Formal', 'Common'], stars: [{}, {}] };
    const planets = [{ moons: [{}, {}] }, { moons: [] }];
    assert.equal(systemBodyCount(system, planets), 6);
    assert.equal(systemHudText(system, planets), 'SYSTEM: Common | Formal (6 Bodies)');
});

test('system HUD handles missing optional names, stars and moons', () => {
    assert.equal(systemHudText({ name: 'Sol' }, [{}]), 'SYSTEM: Sol (2 Bodies)');
    assert.equal(systemHudText({}, []), 'SYSTEM: Unknown (1 Bodies)');
});
