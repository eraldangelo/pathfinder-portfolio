import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApplicationInfo } from '../../../../data/applications';
import type { AssessmentSubmission } from '../../../../types';
import type { Lead } from '../../../leads/leads-page/LeadsPage';
import { buildAdminFunnelData, buildManagerFunnelData } from './funnelMetrics';
import { app, lead, submission, toNumber } from './funnelMetrics.test.helpers';

test('admin funnel uses current year and counts only unconditional offer as offers received', () => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const leads: Lead[] = [
    lead({ id: 'lead-prev', branch: 'Manila' }),
    lead({ id: 'lead-current', branch: 'Manila' }),
  ];

  const applications: ApplicationInfo[] = [
    app({
      id: 'app-prev-year-unconditional',
      studentId: 'lead-prev',
      branch: 'Manila',
      applicationDate: `21-Oct-${previousYear}`,
      status: 'Unconditional Offer',
      statusChanged: new Date(`${previousYear}-10-25T05:52:33.000Z`) as any,
      history: [
        { status: 'Submitted Application', date: new Date(`${previousYear}-10-21T07:03:03.000Z`) as any },
        { status: 'Unconditional Offer', date: new Date(`${previousYear}-10-25T05:52:33.000Z`) as any },
      ],
    }),
    app({
      id: 'app-current-year-conditional',
      studentId: 'lead-current',
      branch: 'Manila',
      applicationDate: `05-Feb-${currentYear}`,
      status: 'Conditional Offer',
      statusChanged: new Date(`${currentYear}-02-08T03:00:00.000Z`) as any,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-02-05T03:46:58.000Z`) as any },
        { status: 'Conditional Offer', date: new Date(`${currentYear}-02-08T03:00:00.000Z`) as any },
      ],
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-prev', referredStaffBranch: 'Manila' }),
    submission({ id: 'lead-current', referredStaffBranch: 'Manila' }),
  ];

  const result = buildAdminFunnelData(
    leads,
    applications,
    submissions,
    new Set<string>(),
    'Manila',
    true
  );

  assert.equal(toNumber(result.applications), 1);
  assert.equal(toNumber(result.offers), 0);
});

test('manager funnel counts milestones from status history (not only current status)', () => {
  const applications: ApplicationInfo[] = [
    app({
      id: 'app-offer',
      status: 'Payment Processed',
      history: [
        { status: 'Unconditional Offer', date: new Date('2026-01-10') as any },
        { status: 'Payment Processed', date: new Date('2026-01-15') as any },
      ],
    }),
    app({
      id: 'app-granted',
      status: 'Visa Granted',
      history: [
        { status: 'Unconditional Offer', date: new Date('2026-01-01') as any },
        { status: 'CoE/LoA Received', date: new Date('2026-01-08') as any },
        { status: 'Visa Lodged', date: new Date('2026-01-20') as any },
        { status: 'Visa Granted', date: new Date('2026-02-01') as any },
      ],
    }),
    app({
      id: 'app-refused',
      status: 'Visa Refused',
      history: [
        { status: 'Unconditional Offer', date: new Date('2026-01-02') as any },
        { status: 'CoE/LoA Received', date: new Date('2026-01-11') as any },
        { status: 'Visa Lodged', date: new Date('2026-01-23') as any },
        { status: 'Visa Refused', date: new Date('2026-02-02') as any },
      ],
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-1' }),
    submission({ id: 'lead-2' }),
    submission({ id: 'lead-3' }),
  ];
  const genuineIds = new Set<string>(['lead-1', 'lead-2']);

  const result = buildManagerFunnelData(applications, submissions, genuineIds);
  const manila = result['Manila'];

  assert.equal(toNumber(manila.totalLeads), 3);
  assert.equal(toNumber(manila.genuineStudents), 2);
  assert.equal(toNumber(manila.applications), 3);
  assert.equal(toNumber(manila.offers), 3);
  assert.equal(toNumber(manila.coe), 2);
  assert.equal(toNumber(manila.lodged), 2);
  assert.equal(toNumber(manila.granted), 1);
  assert.equal(toNumber(manila.refused), 1);
});

test('manager funnel attributes each milestone to its own event year', () => {
  const applications: ApplicationInfo[] = [
    app({
      id: 'app-cross-year',
      status: 'Visa Refused',
      statusChanged: new Date('2026-01-20') as any,
      history: [
        { status: 'Visa Refused', date: new Date('2026-01-20') as any },
        { status: 'Visa Lodged', date: new Date('2026-01-10') as any },
        { status: 'CoE/LoA Received', date: new Date('2025-12-30') as any },
        { status: 'Unconditional Offer', date: new Date('2025-12-25') as any },
        { status: 'Submitted Application', date: new Date('2025-12-20') as any },
      ],
    }),
    app({
      id: 'app-2026',
      studentId: 'lead-2',
      status: 'Visa Granted',
      statusChanged: new Date('2026-03-10') as any,
      history: [
        { status: 'Visa Granted', date: new Date('2026-03-10') as any },
        { status: 'Visa Lodged', date: new Date('2026-03-01') as any },
        { status: 'CoE/LoA Received', date: new Date('2026-02-15') as any },
        { status: 'Unconditional Offer', date: new Date('2026-02-01') as any },
        { status: 'Submitted Application', date: new Date('2026-01-15') as any },
      ],
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-1', createdAt: new Date('2025-12-20') as any }),
    submission({ id: 'lead-2', createdAt: new Date('2026-01-15') as any }),
  ];

  const genuineIds = new Set<string>(['lead-1', 'lead-2']);

  const result2025 = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2025');
  const manila2025 = result2025['Manila'];
  assert.equal(toNumber(manila2025.applications), 1);
  assert.equal(toNumber(manila2025.offers), 1);
  assert.equal(toNumber(manila2025.coe), 1);
  assert.equal(toNumber(manila2025.lodged), 0);
  assert.equal(toNumber(manila2025.granted), 0);
  assert.equal(toNumber(manila2025.refused), 0);

  const result2026 = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2026');
  const manila2026 = result2026['Manila'];
  assert.equal(toNumber(manila2026.applications), 1);
  assert.equal(toNumber(manila2026.offers), 1);
  assert.equal(toNumber(manila2026.coe), 1);
  assert.equal(toNumber(manila2026.lodged), 2);
  assert.equal(toNumber(manila2026.granted), 1);
  assert.equal(toNumber(manila2026.refused), 1);
});

test('manager funnel applies month/year filters to total leads and genuine students', () => {
  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-jan-genuine', createdAt: new Date('2026-01-05') as any }),
    submission({ id: 'lead-feb-genuine', createdAt: new Date('2026-02-10') as any }),
    submission({ id: 'lead-jan-non-genuine', createdAt: new Date('2026-01-20') as any }),
  ];
  const genuineIds = new Set<string>(['lead-jan-genuine', 'lead-feb-genuine']);

  const januaryResult = buildManagerFunnelData([], submissions, genuineIds, String(0), '2026');
  const februaryResult = buildManagerFunnelData([], submissions, genuineIds, String(1), '2026');
  const allMonthsResult = buildManagerFunnelData([], submissions, genuineIds, 'all', '2026');

  const januaryManila = januaryResult['Manila'];
  const februaryManila = februaryResult['Manila'];
  const allMonthsManila = allMonthsResult['Manila'];

  assert.equal(toNumber(januaryManila.totalLeads), 2);
  assert.equal(toNumber(januaryManila.genuineStudents), 1);
  assert.equal(toNumber(februaryManila.totalLeads), 1);
  assert.equal(toNumber(februaryManila.genuineStudents), 1);
  assert.equal(toNumber(allMonthsManila.totalLeads), 3);
  assert.equal(toNumber(allMonthsManila.genuineStudents), 2);
});

test('manager funnel applies quarter filter when month is all months', () => {
  const applications: ApplicationInfo[] = [
    app({
      id: 'app-q1',
      studentId: 'lead-q1',
      applicationDate: '10-Feb-2026',
      status: 'Visa Granted',
      history: [
        { status: 'Submitted Application', date: new Date('2026-02-10') as any },
        { status: 'Visa Granted', date: new Date('2026-02-25') as any },
      ],
      statusChanged: new Date('2026-02-25') as any,
    }),
    app({
      id: 'app-q2',
      studentId: 'lead-q2',
      applicationDate: '12-May-2026',
      status: 'Visa Granted',
      history: [
        { status: 'Submitted Application', date: new Date('2026-05-12') as any },
        { status: 'Visa Granted', date: new Date('2026-05-28') as any },
      ],
      statusChanged: new Date('2026-05-28') as any,
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-q1', createdAt: new Date('2026-02-10') as any }),
    submission({ id: 'lead-q2', createdAt: new Date('2026-05-12') as any }),
  ];
  const genuineIds = new Set<string>(['lead-q1', 'lead-q2']);

  const q2Result = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2026', 'q2');
  const manilaQ2 = q2Result['Manila'];

  assert.equal(toNumber(manilaQ2.totalLeads), 1);
  assert.equal(toNumber(manilaQ2.genuineStudents), 1);
  assert.equal(toNumber(manilaQ2.applications), 1);
  assert.equal(toNumber(manilaQ2.granted), 1);
});
