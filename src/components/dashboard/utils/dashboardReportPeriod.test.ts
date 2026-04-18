import test from 'node:test';
import assert from 'node:assert/strict';
import type { TrendPoint } from '../types/types';
import { filterTrendPointsByPeriod, resolveFilterLabel } from './dashboardReportPeriod';

const buildPoint = (month: string, granted: number, refused: number, lodged: number): TrendPoint => ({
  month,
  rate: granted,
  granted,
  refused,
  lodged,
});

test('resolveFilterLabel hides all-months when quarter is selected', () => {
  assert.equal(resolveFilterLabel('all', 'q1', '2026'), 'Quarter 1 2026');
});

test('resolveFilterLabel hides all-quarter when month is selected', () => {
  assert.equal(resolveFilterLabel('3', 'all', '2026'), 'April 2026');
});

test('resolveFilterLabel keeps full triple label when both month and quarter are all', () => {
  assert.equal(resolveFilterLabel('all', 'all', '2026'), 'All Months / All Quarter / 2026');
});

test('filterTrendPointsByPeriod excludes April when filter is All Months / Quarter 1 / 2026', () => {
  const points: TrendPoint[] = [
    buildPoint('Jan 2026', 2, 0, 3),
    buildPoint('Feb 2026', 3, 1, 5),
    buildPoint('Mar 2026', 4, 1, 6),
    buildPoint('Apr 2026', 1, 0, 2),
  ];

  const filtered = filterTrendPointsByPeriod(points, 'all', 'q1', '2026');

  assert.deepEqual(filtered.map((point) => point.month), ['Jan 2026', 'Feb 2026', 'Mar 2026']);
});

test('filterTrendPointsByPeriod keeps only selected month when explicit month is set', () => {
  const points: TrendPoint[] = [
    buildPoint('Apr 2026', 1, 0, 2),
    buildPoint('May 2026', 3, 1, 4),
    buildPoint('Jun 2026', 2, 0, 3),
  ];

  const filtered = filterTrendPointsByPeriod(points, '4', 'all', '2026');

  assert.deepEqual(filtered.map((point) => point.month), ['May 2026']);
});
