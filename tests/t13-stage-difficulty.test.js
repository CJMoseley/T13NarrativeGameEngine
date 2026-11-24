import test from 'node:test';
import assert from 'node:assert/strict';
import { stageDifficultyRatio, MAX_CARD_PIPS } from '../src/t13ne/modules/systems/ordeals/t13ne-stage-difficulty.js';

test('Stage difficulty ratio stays between 0 and 1', () => {
    const lowest = stageDifficultyRatio([{ pips: '0' }]);
    const highest = stageDifficultyRatio([{ pips: String(MAX_CARD_PIPS) }, { pips: String(MAX_CARD_PIPS) }, { pips: String(MAX_CARD_PIPS) }]);
    assert.ok(lowest >= 0 && lowest <= 1);
    assert.equal(highest, 1);
});

test('Stage difficulty rises with summed Pips', () => {
    const easy = stageDifficultyRatio([{ pips: '5' }]);
    const harder = stageDifficultyRatio([{ pips: '5' }, { pips: '10' }]);
    assert.ok(harder > easy);
});

test('Stage difficulty needs 1 to 3 cards (Ordeal-Stages)', () => {
    assert.throws(() => stageDifficultyRatio([]), RangeError);
    assert.throws(() => stageDifficultyRatio([{ pips: '2' }, { pips: '2' }, { pips: '2' }, { pips: '2' }]), RangeError);
    assert.throws(() => stageDifficultyRatio(null), RangeError);
});
