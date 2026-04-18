import assert from 'node:assert/strict';
import test from 'node:test';
import type { TranslateFn } from '../../../types/translation';
import { formatApplicationStatusLabel, getStatusLabel } from './ApplicationDetailUtils';

test('formatApplicationStatusLabel normalizes compact application statuses', () => {
    assert.equal(formatApplicationStatusLabel('SubmittedApplication'), 'Submitted Application');
    assert.equal(formatApplicationStatusLabel('MoreInformationRequired'), 'More Information Required');
    assert.equal(formatApplicationStatusLabel('CoELoAReceived'), 'CoE/LoA Received');
    assert.equal(formatApplicationStatusLabel('PreDepartureOrientation'), 'Pre-Departure Orientation');
});

test('getStatusLabel uses translations when available and formatted fallback otherwise', () => {
    const t: TranslateFn = (key, options) => {
        const dictionary: Record<string, string> = {
            SubmittedApplication: 'Submitted Application',
            VisaGranted: 'Visa Granted',
        };
        if (dictionary[key]) return dictionary[key];
        return typeof options === 'string' ? options : key;
    };

    assert.equal(getStatusLabel(t, 'SubmittedApplication'), 'Submitted Application');
    assert.equal(getStatusLabel(t, 'VisaGranted'), 'Visa Granted');
    assert.equal(getStatusLabel(t, 'UnexpectedStatusValue'), 'Unexpected Status Value');
});
