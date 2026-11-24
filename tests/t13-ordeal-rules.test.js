import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
    MIN_STAGE_CARDS,
    MAX_STAGE_CARDS,
    MIN_OBSTACLE_DIFFICULTY_CARDS,
    MAX_OBSTACLE_DIFFICULTY_CARDS,
    suitTheme,
    sumPips,
    findStake,
    wildPoolSize
} from '../src/t13ne/modules/systems/ordeals/t13ne-ordeal-rules.js';

const stakes = JSON.parse(await readFile(new URL('../src/t13ne/data/json/ordeals/stakes.json', import.meta.url), 'utf8'));

test('Stage Difficulty is set by 1 to 3 cards (Ordeal-Stages)', () => {
    assert.equal(MIN_STAGE_CARDS, 1);
    assert.equal(MAX_STAGE_CARDS, 3);
});

test('Obstacle Difficulty is given by 1 or 2 cards after the type card (Ordeal-Rounds)', () => {
    assert.equal(MIN_OBSTACLE_DIFFICULTY_CARDS, 1);
    assert.equal(MAX_OBSTACLE_DIFFICULTY_CARDS, 2);
});

test('sumPips adds the Pips of the cards, reading string Pips values', () => {
    assert.equal(sumPips([{ pips: '7' }, { pips: '14' }]), 21);
    assert.equal(sumPips([{ pips: 5 }]), 5);
    assert.equal(sumPips([]), 0);
});

test('Suits map to the rulebook themes, with numeric card suits 1-4 in rulebook order', () => {
    assert.equal(suitTheme('1'), 'Travel');
    assert.equal(suitTheme('2'), 'Relationships');
    assert.equal(suitTheme('3'), 'Power');
    assert.equal(suitTheme('4'), 'Conflict');
    assert.equal(suitTheme('Diamonds'), 'Travel');
    assert.equal(suitTheme('♥'), 'Relationships');
    assert.equal(suitTheme('Wildcard'), 'Unknown');
});

test('findStake matches the Type field of stakes.json, case-insensitively', () => {
    assert.equal(findStake(stakes, 'High').Type, 'High');
    assert.equal(findStake(stakes, 'soul').Type, 'Soul');
    assert.equal(findStake(stakes, 'Nonexistent'), null);
    assert.equal(findStake(null, 'Low'), null);
});

test('Round Wild Pool sizes read from stakes.json match the Stakes rules', () => {
    assert.equal(wildPoolSize(findStake(stakes, 'Low')), 2);
    assert.equal(wildPoolSize(findStake(stakes, 'Medium')), 3);
    assert.equal(wildPoolSize(findStake(stakes, 'High')), 4);
    assert.equal(wildPoolSize(findStake(stakes, 'Extreme')), 5);
    assert.equal(wildPoolSize(findStake(stakes, 'Soul')), 6);
});

test('An unknown stake has no Wild Pool, so no pool is dealt', () => {
    assert.equal(wildPoolSize(findStake(stakes, 'Nonexistent')), 0);
    assert.equal(wildPoolSize(null), 0);
});
