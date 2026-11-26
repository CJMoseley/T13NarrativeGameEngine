import test from 'node:test';
import assert from 'node:assert/strict';
import { musicKeyFrequency } from '../src/t13ne/modules/audio/core/MusicKey.js';

test('music frequency reads geometry and synthetic key shapes', () => {
    assert.equal(musicKeyFrequency({ Key: { Frequency: 440 }, KeyNo: 4 }), 440);
    assert.equal(musicKeyFrequency({ Key: 'C', Frequency: 261.63 }), 261.63);
});

test('music frequency rejects missing and invalid pitches', () => {
    for (const key of [null, {}, { Frequency: 0 }, { Frequency: NaN }, { Frequency: Infinity }]) {
        assert.throws(() => musicKeyFrequency(key), /positive finite frequency/);
    }
});
