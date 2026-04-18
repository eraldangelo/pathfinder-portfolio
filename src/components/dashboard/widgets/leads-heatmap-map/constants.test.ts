import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampToSingleWorld,
  SINGLE_WORLD_MAX_LAT,
  SINGLE_WORLD_MAX_LNG,
} from './constants';

test('clampToSingleWorld clamps latitude and longitude to single-world bounds', () => {
  const [lat, lng] = clampToSingleWorld([120, 179.9999999]);

  assert.equal(lat, SINGLE_WORLD_MAX_LAT);
  assert.equal(lng, SINGLE_WORLD_MAX_LNG);
});

test('clampToSingleWorld normalizes negative wrapped longitudes', () => {
  const [lat, lng] = clampToSingleWorld([-10, -541]);

  assert.equal(lat, -10);
  assert.equal(lng, 179);
});

test('clampToSingleWorld falls back for non-finite values', () => {
  const [lat, lng] = clampToSingleWorld([Number.NaN, Number.POSITIVE_INFINITY]);

  assert.equal(lat, 0);
  assert.equal(lng, 0);
});
