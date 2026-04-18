import test from 'node:test';
import assert from 'node:assert/strict';
import { sortLeads } from './LeadsPageDataUtils';
import type { LeadRow } from './LeadsPageTypes';

const makeLead = (overrides: Partial<LeadRow>): LeadRow => ({
  id: 'lead-id',
  fullName: 'Test Lead',
  firstName: 'Test',
  lastName: 'Lead',
  email: 'test@example.com',
  phoneCountryCode: '+63',
  phoneNumber: '9000000000',
  citizenship: 'Philippines',
  visaRefusal: 'No',
  branch: 'Manila',
  assignedCounsellor: 'Counsellor',
  caseId: '',
  submittedAt: new Date('2026-01-01T00:00:00.000Z'),
  dob: '2000-01-01',
  maritalStatus: 'Never Married',
  leadStatus: 'New Lead',
  ...overrides,
});

test('sortLeads defaults to newest submittedAt first when no sortConfig', () => {
  const oldest = makeLead({ id: 'old', submittedAt: new Date('2026-01-02T00:00:00.000Z') });
  const newest = makeLead({ id: 'new', submittedAt: new Date('2026-01-05T00:00:00.000Z') });
  const middle = makeLead({ id: 'mid', submittedAt: new Date('2026-01-03T00:00:00.000Z') });

  const sorted = sortLeads([oldest, newest, middle], null);
  assert.deepEqual(sorted.map((lead) => lead.id), ['new', 'mid', 'old']);
});

test('sortLeads default ordering also works for assessment-mapped rows', () => {
  const assessmentRow = makeLead({
    id: 'submission-1',
    isSubmission: true,
    submittedAt: new Date('2026-02-10T00:00:00.000Z'),
  });
  const regularLead = makeLead({
    id: 'lead-1',
    isSubmission: false,
    submittedAt: new Date('2026-01-10T00:00:00.000Z'),
  });

  const sorted = sortLeads([regularLead, assessmentRow], null);
  assert.deepEqual(sorted.map((lead) => lead.id), ['submission-1', 'lead-1']);
});

