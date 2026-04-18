import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getOffsetUseEndTime,
    getOffsetUseStartTimeOptions,
    getOffsetUseUsageHours,
} from './offsetUse';

test('getOffsetUseEndTime skips lunch hour when computing usage duration', () => {
    assert.equal(getOffsetUseEndTime('11:00', 1), '12:00');
    assert.equal(getOffsetUseEndTime('11:00', 2), '14:00');
    assert.equal(getOffsetUseEndTime('11:00', 3), '15:00');
});

test('getOffsetUseStartTimeOptions excludes 12:00 and keeps valid start slots', () => {
    const options = getOffsetUseStartTimeOptions(2);
    assert.equal(options.includes('12:00'), false);
    assert.equal(options.includes('11:00'), true);
    assert.equal(options.includes('13:00'), true);
});

test('getOffsetUseStartTimeOptions for seven hours allows only 09:00', () => {
    assert.deepEqual(getOffsetUseStartTimeOptions(7), ['09:00']);
});

test('getOffsetUseUsageHours excludes lunch overlap', () => {
    assert.equal(getOffsetUseUsageHours('09:00', '12:00'), 3);
    assert.equal(getOffsetUseUsageHours('11:00', '14:00'), 2);
    assert.equal(getOffsetUseUsageHours('12:00', '14:00'), 1);
});
