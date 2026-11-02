import test from 'node:test';
import assert from 'node:assert';
import { AgenticGematria } from './agenticGematria.js';

test('AgenticGematria calculates gematria numbers and tidy names', () => {
  assert.strictEqual(AgenticGematria.crunchNumbers(25), 7);
  assert.strictEqual(AgenticGematria.tidyName('Phantasm 123!'), 'phantasm');
  assert.strictEqual(AgenticGematria.getGeometryFromString('Phantasm'), 9);
  assert.strictEqual(AgenticGematria.getGeometryFromString('b'), 2);
  assert.strictEqual(AgenticGematria.getGeometryFromString('z'), 7);
  assert.strictEqual(AgenticGematria.getGeometryFromString('ch'), 9);
  assert.strictEqual(AgenticGematria.getGeometryFromString('th'), 3);
  assert.deepStrictEqual(AgenticGematria.tokenizeNumerology('Phantasm').map((token) => token.text), ['ph', 'a', 'n', 't', 'a', 's', 'm']);
});

test('AgenticGematria calculates full geometry and harmonics', () => {
  const res = AgenticGematria.calculateFullGeo('Phantasm');
  assert.strictEqual(res.Name, 'Phantasm');
  assert.ok(res.Geo);
  assert.ok(Array.isArray(res.GeoHarmonics.Harmonic));
  assert.ok(Array.isArray(res.GeoHarmonics.Dissonant));
});

test('AgenticGematria calculates interpersonal impressions with Phantasm boost', () => {
  const imp = AgenticGematria.calculateImpression('Phantasm', 'User');
  assert.ok(imp.Value >= 6);
  assert.strictEqual(imp.RelationshipType, 'BEST_FRIEND');

  const imp2 = AgenticGematria.calculateImpression('Scout', 'Sherlock');
  assert.ok(typeof imp2.Value === 'number');
});
