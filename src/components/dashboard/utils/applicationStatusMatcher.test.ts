import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApplicationInfo } from '../../../data/applications';
import { hasAnyStatusInCurrentOrHistory, hasStatusInCurrentOrHistory, statusIncludesKeyword } from './applicationStatusMatcher';

const asApplication = (partial: Partial<ApplicationInfo>): ApplicationInfo => ({
  id: 'app-1',
  subId: 'sub-1',
  studentId: 'lead-1',
  citizenship: 'Philippines',
  branch: 'Manila',
  applicantName: 'Test Student',
  applicantDob: '01-Jan-2000',
  schoolCourses: [],
  status: 'Submitted Application',
  statusChanged: new Date() as any,
  history: [],
  visaRefusal: 'No',
  ...partial,
});

test('statusIncludesKeyword handles case-insensitive matching', () => {
  assert.equal(statusIncludesKeyword('Unconditional Offer', 'offer'), true);
  assert.equal(statusIncludesKeyword('Visa Granted', 'grant'), true);
  assert.equal(statusIncludesKeyword('Payment Processed', 'grant'), false);
});

test('hasStatusInCurrentOrHistory keeps milestone counts after status progression', () => {
  const application = asApplication({
    status: 'Payment Processed',
    history: [
      { status: 'Unconditional Offer', date: new Date('2026-02-01') as any },
      { status: 'Payment Processed', date: new Date('2026-02-05') as any },
    ],
  });

  assert.equal(hasStatusInCurrentOrHistory(application, 'offer'), true);
  assert.equal(hasStatusInCurrentOrHistory(application, 'coe'), false);
});

test('hasAnyStatusInCurrentOrHistory detects any milestone in current or history', () => {
  const application = asApplication({
    status: 'Visa Granted',
    history: [
      { status: 'CoE/LoA Received', date: new Date('2026-01-10') as any },
      { status: 'Visa Lodged', date: new Date('2026-01-20') as any },
      { status: 'Visa Granted', date: new Date('2026-02-01') as any },
    ],
  });

  assert.equal(
    hasAnyStatusInCurrentOrHistory(application, ['offer', 'coe', 'grant']),
    true
  );
  assert.equal(
    hasAnyStatusInCurrentOrHistory(application, ['refuse', 'withdrawn']),
    false
  );
});
