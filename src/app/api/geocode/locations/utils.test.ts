import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isInPhilippinesBounds,
  parseLocationRequestPayload,
  resolveAliasQuery,
  resolveKnownPhilippineFallback,
} from './utils';

test('parseLocationRequestPayload keeps only valid key/query pairs and caps size', () => {
  const payload = {
    locations: [
      { key: 'a', query: 'Makati' },
      { key: '', query: 'Invalid' },
      { key: 'b', query: '   Cebu City   ' },
      { query: 'Missing key' },
    ],
  };

  const parsed = parseLocationRequestPayload(payload);
  assert.deepEqual(parsed, [
    { key: 'a', query: 'Makati' },
    { key: 'b', query: 'Cebu City' },
  ]);
});

test('resolveAliasQuery normalizes known typo variants', () => {
  assert.equal(resolveAliasQuery('General Santons City'), 'General Santos City');
  assert.equal(resolveAliasQuery('gensan'), 'General Santos City');
  assert.equal(resolveAliasQuery('Puerto Princesa City'), 'Puerto Princesa, Palawan');
  assert.equal(resolveAliasQuery('Makati City'), 'Makati City');
});

test('resolveKnownPhilippineFallback and bounds checks stay consistent', () => {
  const fallback = resolveKnownPhilippineFallback('General Santos City');
  assert.ok(fallback);
  assert.equal(fallback?.country, 'Philippines');
  assert.equal(isInPhilippinesBounds(fallback!.lat, fallback!.lng), true);

  const palawanFallback = resolveKnownPhilippineFallback('Puerto Princesa, Palawan');
  assert.ok(palawanFallback);
  assert.equal(palawanFallback?.country, 'Philippines');
  assert.equal(isInPhilippinesBounds(palawanFallback!.lat, palawanFallback!.lng), true);

  assert.equal(isInPhilippinesBounds(0, 0), false);
});
