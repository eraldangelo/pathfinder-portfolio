import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApplicationInfo } from '../../../../data/applications';
import type { AssessmentSubmission } from '../../../../types';
import { buildManagerFunnelData } from './funnelMetrics';
import { app, submission, toNumber } from './funnelMetrics.test.helpers';

test('manager funnel uses preferredBranch when referredStaffBranch is empty', () => {
  const applications: ApplicationInfo[] = [
    app({
      id: 'app-ph-overall',
      studentId: 'lead-pref-branch',
      branch: 'Manila',
      applicationDate: '10-Feb-2026',
      status: 'Submitted Application',
      history: [{ status: 'Submitted Application', date: new Date('2026-02-10') as any }],
      statusChanged: new Date('2026-02-10') as any,
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({
      id: 'lead-pref-branch',
      referredStaffBranch: '',
      preferredBranch: 'Manila',
      createdAt: new Date('2026-02-08') as any,
    }),
  ];
  const genuineIds = new Set<string>(['lead-pref-branch']);

  const result = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2026', 'q1');
  const philippinesOverall = result['Philippines Overall'];
  const manila = result['Manila'];

  assert.equal(toNumber(philippinesOverall.totalLeads), 1);
  assert.equal(toNumber(philippinesOverall.genuineStudents), 1);
  assert.equal(toNumber(manila.totalLeads), 1);
  assert.equal(toNumber(manila.genuineStudents), 1);
  assert.equal(toNumber(philippinesOverall.applications), 1);
});

test('manager funnel treats Makati/currentLocation records as Manila and Philippines Overall', () => {
  const applications: ApplicationInfo[] = [
    app({
      id: 'app-makati-alias',
      studentId: 'lead-makati',
      branch: 'Makati',
      applicationDate: '12-Feb-2026',
      status: 'Submitted Application',
      history: [{ status: 'Submitted Application', date: new Date('2026-02-12') as any }],
      statusChanged: new Date('2026-02-12') as any,
    }),
  ];
  const submissions: AssessmentSubmission[] = [
    submission({
      id: 'lead-makati',
      referredStaffBranch: '',
      preferredBranch: '',
      currentLocation: 'Makati',
      createdAt: new Date('2026-02-11') as any,
    }),
  ];
  const genuineIds = new Set<string>(['lead-makati']);

  const result = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2026', 'q1');
  const philippinesOverall = result['Philippines Overall'];
  const manila = result['Manila'];

  assert.equal(toNumber(philippinesOverall.totalLeads), 1);
  assert.equal(toNumber(philippinesOverall.genuineStudents), 1);
  assert.equal(toNumber(manila.totalLeads), 1);
  assert.equal(toNumber(manila.genuineStudents), 1);
  assert.equal(toNumber(manila.applications), 1);
});

