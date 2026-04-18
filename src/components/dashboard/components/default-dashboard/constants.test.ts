import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ALL_QUARTERS_VALUE,
    QUARTER_1_VALUE,
    QUARTER_3_VALUE,
} from '../../utils/funnelFilters';
import { getDashboardMonthOptions } from './constants';

test('getDashboardMonthOptions returns all months when quarter is all', () => {
    const monthValues = getDashboardMonthOptions(ALL_QUARTERS_VALUE).map((option) => option.value);
    assert.deepEqual(monthValues, ['all', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
});

test('getDashboardMonthOptions keeps only quarter months when quarter is selected', () => {
    const q1MonthValues = getDashboardMonthOptions(QUARTER_1_VALUE).map((option) => option.value);
    assert.deepEqual(q1MonthValues, ['all', '0', '1', '2']);

    const q3MonthValues = getDashboardMonthOptions(QUARTER_3_VALUE).map((option) => option.value);
    assert.deepEqual(q3MonthValues, ['all', '6', '7', '8']);
});

test('getDashboardMonthOptions falls back to all months for unknown quarter value', () => {
    const monthValues = getDashboardMonthOptions('q5').map((option) => option.value);
    assert.deepEqual(monthValues, ['all', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
});
