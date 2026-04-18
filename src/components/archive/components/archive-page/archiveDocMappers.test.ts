import test from 'node:test';
import assert from 'node:assert/strict';
import { mapArchiveApplicationDoc } from './archiveDocMappers';

const buildDoc = (path: string, data: Record<string, unknown>) => ({
  data: () => data,
  ref: { path },
  id: path.split('/').pop() || 'app-id',
});

test('mapArchiveApplicationDoc resolves leadId for legacy root lead paths', () => {
  const row = mapArchiveApplicationDoc(
    buildDoc('leads/lead-123/applications/app-1', {
      applicantName: 'Sample Applicant',
      branch: 'Manila',
      status: 'Application Ended',
    })
  );
  assert.equal(row.leadId, 'lead-123');
});

test('mapArchiveApplicationDoc resolves leadId for yearly archive storage paths', () => {
  const row = mapArchiveApplicationDoc(
    buildDoc('archives/2026/leads/lead-abc/applications/app-9', {
      applicantName: 'Sample Applicant',
      branch: 'Cebu',
      status: 'Application Ended',
    })
  );
  assert.equal(row.leadId, 'lead-abc');
});
