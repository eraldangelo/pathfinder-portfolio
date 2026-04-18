import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApplicationInfo } from '../../../../data/applications';
import type { AssessmentSubmission } from '../../../../types';
import type { Lead } from '../../../leads/leads-page/LeadsPage';
import { buildConsultantFunnelData } from './funnelMetrics';
import { app, lead, submission, toNumber } from './funnelMetrics.test.helpers';
test('consultant funnel counts submission year from applicationDate when present', () => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const leads: Lead[] = [
    lead({ id: 'lead-prev', assignedCounsellor: 'Counsellor One' }),
    lead({ id: 'lead-current', assignedCounsellor: 'Counsellor One' }),
  ];
  const applications: ApplicationInfo[] = [
    app({
      id: 'app-prev',
      studentId: 'lead-prev',
      status: 'Application Rejected',
      applicationDate: `21-Oct-${previousYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-01-13T01:42:06.000Z`) as any },
        { status: 'Application Rejected', date: new Date(`${currentYear}-02-19T02:19:42.000Z`) as any },
      ],
    }),
    app({
      id: 'app-current',
      studentId: 'lead-current',
      status: 'Submitted Application',
      applicationDate: `05-Feb-${currentYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-02-05T03:46:58.000Z`) as any },
      ],
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-prev', assignedCounsellor: 'Counsellor One' }),
    submission({ id: 'lead-current', assignedCounsellor: 'Counsellor One' }),
  ];

  const result = buildConsultantFunnelData(
    leads,
    applications,
    submissions,
    new Set<string>(),
    'Counsellor One',
    'uid-1',
    true
  );

  assert.ok(result);
  assert.equal(toNumber(result.applications), 1);
});

test('consultant funnel counts offers/coe/lodged by milestone year', () => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const leads: Lead[] = [
    lead({ id: 'lead-prev', assignedCounsellor: 'Counsellor One' }),
    lead({ id: 'lead-current', assignedCounsellor: 'Counsellor One' }),
  ];

  const applications: ApplicationInfo[] = [
    app({
      id: 'app-prev',
      studentId: 'lead-prev',
      status: 'Visa Lodged',
      statusChanged: new Date(`${previousYear}-11-10T03:00:00.000Z`) as any,
      applicationDate: `21-Oct-${previousYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${previousYear}-10-21T07:03:03.000Z`) as any },
        { status: 'Unconditional Offer', date: new Date(`${previousYear}-10-25T05:52:33.000Z`) as any },
        { status: 'CoE/LoA Received', date: new Date(`${previousYear}-11-01T04:00:00.000Z`) as any },
        { status: 'Visa Lodged', date: new Date(`${previousYear}-11-10T03:00:00.000Z`) as any },
      ],
    }),
    app({
      id: 'app-current',
      studentId: 'lead-current',
      status: 'CoE/LoA Received',
      applicationDate: `05-Feb-${currentYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-02-05T03:46:58.000Z`) as any },
        { status: 'Unconditional Offer', date: new Date(`${currentYear}-02-13T02:11:03.000Z`) as any },
        { status: 'CoE/LoA Received', date: new Date(`${currentYear}-02-18T01:00:00.000Z`) as any },
      ],
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-prev', assignedCounsellor: 'Counsellor One' }),
    submission({ id: 'lead-current', assignedCounsellor: 'Counsellor One' }),
  ];

  const result = buildConsultantFunnelData(
    leads,
    applications,
    submissions,
    new Set<string>(),
    'Counsellor One',
    'uid-1',
    true
  );

  assert.ok(result);
  assert.equal(toNumber(result.applications), 1);
  assert.equal(toNumber(result.offers), 1);
  assert.equal(toNumber(result.coe), 1);
  assert.equal(toNumber(result.lodged), 0);
});

test('consultant funnel counts visa grants by milestone year even for rollover submissions', () => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const leads: Lead[] = [
    lead({ id: 'lead-prev', assignedCounsellor: 'Counsellor One' }),
  ];

  const applications: ApplicationInfo[] = [
    app({
      id: 'app-prev',
      studentId: 'lead-prev',
      status: 'Visa Granted',
      applicationDate: `21-Oct-${previousYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${previousYear}-10-21T07:03:03.000Z`) as any },
        { status: 'Visa Granted', date: new Date(`${currentYear}-01-21T03:06:57.000Z`) as any },
      ],
      statusChanged: new Date(`${currentYear}-01-21T03:06:57.000Z`) as any,
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-prev', assignedCounsellor: 'Counsellor One' }),
  ];

  const result = buildConsultantFunnelData(
    leads,
    applications,
    submissions,
    new Set<string>(),
    'Counsellor One',
    'uid-1',
    true
  );

  assert.ok(result);
  assert.equal(toNumber(result.applications), 0);
  assert.equal(toNumber(result.granted), 1);
});

test('consultant funnel does not count conditional offer as offers received', () => {
  const currentYear = new Date().getFullYear();

  const leads: Lead[] = [
    lead({ id: 'lead-conditional', assignedCounsellor: 'Counsellor One' }),
  ];

  const applications: ApplicationInfo[] = [
    app({
      id: 'app-conditional-only',
      studentId: 'lead-conditional',
      status: 'Conditional Offer',
      applicationDate: `05-Feb-${currentYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-02-05T03:46:58.000Z`) as any },
        { status: 'Conditional Offer', date: new Date(`${currentYear}-02-08T03:00:00.000Z`) as any },
      ],
      statusChanged: new Date(`${currentYear}-02-08T03:00:00.000Z`) as any,
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-conditional', assignedCounsellor: 'Counsellor One' }),
  ];

  const result = buildConsultantFunnelData(
    leads,
    applications,
    submissions,
    new Set<string>(),
    'Counsellor One',
    'uid-1',
    true
  );

  assert.ok(result);
  assert.equal(toNumber(result.offers), 0);
});

test('consultant funnel applies quarter filter when month is all months', () => {
  const currentYear = new Date().getFullYear();
  const leads: Lead[] = [
    lead({ id: 'lead-q1', assignedCounsellor: 'Counsellor One' }),
    lead({ id: 'lead-q2', assignedCounsellor: 'Counsellor One' }),
  ];

  const applications: ApplicationInfo[] = [
    app({
      id: 'app-q1',
      studentId: 'lead-q1',
      status: 'Unconditional Offer',
      applicationDate: `05-Feb-${currentYear}`,
      statusChanged: new Date(`${currentYear}-02-10T03:00:00.000Z`) as any,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-02-05T03:46:58.000Z`) as any },
        { status: 'Unconditional Offer', date: new Date(`${currentYear}-02-10T03:00:00.000Z`) as any },
      ],
    }),
    app({
      id: 'app-q2',
      studentId: 'lead-q2',
      status: 'Unconditional Offer',
      applicationDate: `07-May-${currentYear}`,
      statusChanged: new Date(`${currentYear}-05-12T03:00:00.000Z`) as any,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-05-07T03:46:58.000Z`) as any },
        { status: 'Unconditional Offer', date: new Date(`${currentYear}-05-12T03:00:00.000Z`) as any },
      ],
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-q1', assignedCounsellor: 'Counsellor One', createdAt: new Date(`${currentYear}-02-01T00:00:00.000Z`) as any }),
    submission({ id: 'lead-q2', assignedCounsellor: 'Counsellor One', createdAt: new Date(`${currentYear}-05-01T00:00:00.000Z`) as any }),
  ];

  const result = buildConsultantFunnelData(
    leads,
    applications,
    submissions,
    new Set<string>(['lead-q1', 'lead-q2']),
    'Counsellor One',
    'uid-1',
    true,
    'all',
    String(currentYear),
    'q2',
  );

  assert.ok(result);
  assert.equal(toNumber(result.totalLeads), 1);
  assert.equal(toNumber(result.genuineStudents), 1);
  assert.equal(toNumber(result.applications), 1);
  assert.equal(toNumber(result.offers), 1);
});
