import assert from 'node:assert/strict';
import test from 'node:test';
import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE } from '../utils/funnelFilters';
import { applyFunnelMonthChange, applyFunnelQuarterChange } from './funnelFilterState';

test('applyFunnelMonthChange resets quarter when selecting a specific month', () => {
  const next = applyFunnelMonthChange(
    {
      selectedFunnelMonth: ALL_MONTHS_VALUE,
      selectedQuarter: 'q2',
    },
    '1',
  );

  assert.equal(next.selectedFunnelMonth, '1');
  assert.equal(next.selectedQuarter, ALL_QUARTERS_VALUE);
});

test('applyFunnelMonthChange keeps quarter when selecting all months', () => {
  const next = applyFunnelMonthChange(
    {
      selectedFunnelMonth: '1',
      selectedQuarter: 'q3',
    },
    ALL_MONTHS_VALUE,
  );

  assert.equal(next.selectedFunnelMonth, ALL_MONTHS_VALUE);
  assert.equal(next.selectedQuarter, 'q3');
});

test('applyFunnelQuarterChange resets month when selecting a specific quarter', () => {
  const next = applyFunnelQuarterChange(
    {
      selectedFunnelMonth: '5',
      selectedQuarter: ALL_QUARTERS_VALUE,
    },
    'q4',
  );

  assert.equal(next.selectedFunnelMonth, ALL_MONTHS_VALUE);
  assert.equal(next.selectedQuarter, 'q4');
});

test('applyFunnelQuarterChange keeps month when selecting all quarters', () => {
  const next = applyFunnelQuarterChange(
    {
      selectedFunnelMonth: '10',
      selectedQuarter: 'q4',
    },
    ALL_QUARTERS_VALUE,
  );

  assert.equal(next.selectedFunnelMonth, '10');
  assert.equal(next.selectedQuarter, ALL_QUARTERS_VALUE);
});
