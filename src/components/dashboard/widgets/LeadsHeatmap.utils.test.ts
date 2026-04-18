import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApplicationInfo } from '../../../data/applications';
import type { AssessmentSubmission } from '../../../types';
import { buildApplicationCountedLocations, buildCountedLocations } from './LeadsHeatmap.utils';

const submission = (partial: Partial<AssessmentSubmission>): AssessmentSubmission => ({
  id: 'lead-1',
  ...partial,
});

test('buildCountedLocations counts all submissions when origin filter is leads', () => {
  const counted = buildCountedLocations(
    [
      submission({ id: 'lead-1', currentLocation: 'Cebu' }),
      submission({ id: 'lead-2', currentLocation: 'Cebu' }),
      submission({ id: 'lead-3', currentLocation: 'Manila' }),
    ],
  );

  const cebu = counted.find((item) => item.key === 'cebu');
  const manila = counted.find((item) => item.key === 'manila');

  assert.equal(cebu?.count, 2);
  assert.equal(manila?.count, 1);
});

const application = (partial: Partial<ApplicationInfo>): ApplicationInfo =>
  ({
    id: 'app-1',
    subId: 'sub-1',
    studentId: 'lead-1',
    citizenship: 'Philippines',
    branch: 'Manila',
    applicantName: 'Applicant',
    applicantDob: '01 Jan 2000',
    schoolCourses: [],
    status: 'Submitted Application',
    statusChanged: null as unknown as ApplicationInfo['statusChanged'],
    history: [],
    visaRefusal: 'No',
    ...partial,
  }) as ApplicationInfo;

test('buildApplicationCountedLocations counts applications using matched submission location', () => {
  const counted = buildApplicationCountedLocations(
    [
      application({ id: 'app-1', studentId: 'lead-1' }),
      application({ id: 'app-2', studentId: 'lead-2' }),
      application({ id: 'app-3', studentId: 'lead-3' }),
      application({ id: 'app-4', studentId: 'missing-lead' }),
    ],
    [
      submission({ id: 'lead-1', currentLocation: 'Cebu' }),
      submission({ id: 'lead-2', currentLocation: 'Cebu' }),
      submission({ id: 'lead-3', currentLocation: 'Manila' }),
    ],
  );

  assert.equal(counted.length, 2);
  assert.equal(counted.find((item) => item.key === 'cebu')?.count, 2);
  assert.equal(counted.find((item) => item.key === 'manila')?.count, 1);
});

test('buildApplicationCountedLocations counts duplicate applications for the same lead', () => {
  const counted = buildApplicationCountedLocations(
    [
      application({ id: 'app-1', studentId: 'lead-1' }),
      application({ id: 'app-2', studentId: 'lead-1' }),
    ],
    [
      submission({ id: 'lead-1', currentLocation: '', referredStaffBranch: 'Cebu' }),
    ],
  );

  assert.equal(counted.length, 1);
  assert.equal(counted[0].key, 'cebu');
  assert.equal(counted[0].count, 2);
});
