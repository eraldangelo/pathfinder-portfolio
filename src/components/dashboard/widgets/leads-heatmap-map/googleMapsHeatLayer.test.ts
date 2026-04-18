import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildClusterMarkerDescriptors,
  buildGoogleMapOptions,
  getClusterLeadCount,
} from './googleMapsHeatLayer';

test('buildClusterMarkerDescriptors returns empty list when no points exist', () => {
  const markers = buildClusterMarkerDescriptors([]);
  assert.deepEqual(markers, []);
});

test('buildClusterMarkerDescriptors preserves valid points and weights', () => {
  const markers = buildClusterMarkerDescriptors([
    [14.6, 121.0, 6],
    [7.1, 125.6, 2],
  ]);

  assert.equal(markers.length, 2);
  assert.equal(markers[0]?.weight, 6);
  assert.equal(markers[1]?.weight, 2);
});

test('buildClusterMarkerDescriptors normalizes intensity with strongest point at 1', () => {
  const markers = buildClusterMarkerDescriptors([
    [14.6, 121.0, 10],
    [14.61, 121.01, 3],
    [14.62, 121.02, 1],
  ]);

  const intensities = markers.map((marker) => marker.intensity).sort((a, b) => a - b);
  assert.equal(intensities[intensities.length - 1], 1);
  assert.ok(intensities[0] >= 0.08);
  assert.ok(intensities[0] < 1);
});

test('buildClusterMarkerDescriptors drops invalid lat/lng points', () => {
  const markers = buildClusterMarkerDescriptors([
    [14.6, 121.0, 1],
    [95, 121.1, 2],
    [7.1, 230, 3],
  ]);

  assert.equal(markers.length, 1);
  assert.equal(markers[0]?.lat, 14.6);
  assert.equal(markers[0]?.lng, 121.0);
});

test('getClusterLeadCount sums weighted lead counts from clustered markers', () => {
  const count = getClusterLeadCount(
    [
      { __pathfinderLeadWeight: 120 },
      { __pathfinderLeadWeight: 90 },
      { __pathfinderLeadWeight: 25 },
    ],
    3
  );

  assert.equal(count, 235);
});

test('getClusterLeadCount falls back to marker count when weights are missing', () => {
  const count = getClusterLeadCount([{}, {}, {}], 3);
  assert.equal(count, 3);
});

test('buildGoogleMapOptions includes mapId when provided', () => {
  const options = buildGoogleMapOptions({}, [14.6, 121.0], 6, 'dark', 'demo-map-id');
  assert.equal((options as any).mapId, 'demo-map-id');
});

test('buildGoogleMapOptions omits mapId when missing', () => {
  const options = buildGoogleMapOptions({}, [14.6, 121.0], 6, 'dark');
  assert.equal('mapId' in options, false);
});
