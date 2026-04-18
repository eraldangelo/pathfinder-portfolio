import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApplicationInfo } from '../../../data/applications';
import { ALL_MONTHS_VALUE, ALL_YEARS_VALUE } from './funnelFilters';
import { buildTopVisaGrantCounsellors } from './teamRankingMetrics';

const makeApplication = (
  overrides: (Partial<ApplicationInfo> & Record<string, unknown>) = {},
): ApplicationInfo => ({
  id: 'app-1',
  subId: 'sub-1',
  studentId: 'lead-1',
  citizenship: 'Philippines',
  branch: 'Davao',
  applicantName: 'Sample Applicant',
  applicantDob: '01-Jan-2000',
  schoolCourses: [],
  status: 'Submitted Application',
  statusChanged: new Date() as any,
  history: [],
  visaRefusal: 'No',
  ...overrides,
});

test('buildTopVisaGrantCounsellors counts visa grants by milestone year', () => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const applications: ApplicationInfo[] = [
    makeApplication({
      id: 'app-current-grant',
      studentId: 'lead-a',
      status: 'Application Ended',
      statusChanged: new Date(`${currentYear}-03-10T01:00:00.000Z`) as any,
      assignedCounsellor: 'Alpha Counsellor',
      history: [
        { status: 'Submitted Application', date: new Date(`${previousYear}-11-20T01:00:00.000Z`) as any },
        { status: 'Visa Granted', date: new Date(`${currentYear}-01-15T01:00:00.000Z`) as any },
      ],
    }),
    makeApplication({
      id: 'app-previous-grant',
      studentId: 'lead-b',
      status: 'Visa Granted',
      statusChanged: new Date(`${previousYear}-08-10T01:00:00.000Z`) as any,
      assignedCounsellor: 'Bravo Counsellor',
      history: [{ status: 'Visa Granted', date: new Date(`${previousYear}-08-10T01:00:00.000Z`) as any }],
    }),
  ];

  const rankings = buildTopVisaGrantCounsellors(
    applications,
    [],
    [],
    ALL_MONTHS_VALUE,
    String(currentYear),
  );

  assert.equal(rankings.length, 1);
  assert.equal(rankings[0].name, 'Alpha Counsellor');
  assert.equal(rankings[0].grants, 1);
});

test('buildTopVisaGrantCounsellors keeps all visa grants in all-years mode', () => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const applications: ApplicationInfo[] = [
    makeApplication({
      id: 'app-1',
      studentId: 'lead-1',
      status: 'Visa Granted',
      statusChanged: new Date(`${currentYear}-02-10T01:00:00.000Z`) as any,
      assignedCounsellor: 'Alpha Counsellor',
      history: [{ status: 'Visa Granted', date: new Date(`${currentYear}-02-10T01:00:00.000Z`) as any }],
    }),
    makeApplication({
      id: 'app-2',
      studentId: 'lead-2',
      status: 'Visa Granted',
      statusChanged: new Date(`${previousYear}-12-01T01:00:00.000Z`) as any,
      assignedCounsellor: 'Bravo Counsellor',
      history: [{ status: 'Visa Granted', date: new Date(`${previousYear}-12-01T01:00:00.000Z`) as any }],
    }),
  ];

  const rankings = buildTopVisaGrantCounsellors(
    applications,
    [],
    [],
    ALL_MONTHS_VALUE,
    ALL_YEARS_VALUE,
  );

  assert.equal(rankings.length, 2);
  assert.equal(rankings[0].grants, 1);
  assert.equal(rankings[1].grants, 1);
});

test('buildTopVisaGrantCounsellors applies quarter filter when month is all months', () => {
  const currentYear = new Date().getFullYear();

  const applications: ApplicationInfo[] = [
    makeApplication({
      id: 'app-q1',
      studentId: 'lead-q1',
      status: 'Visa Granted',
      statusChanged: new Date(`${currentYear}-02-10T01:00:00.000Z`) as any,
      assignedCounsellor: 'Alpha Counsellor',
      history: [{ status: 'Visa Granted', date: new Date(`${currentYear}-02-10T01:00:00.000Z`) as any }],
    }),
    makeApplication({
      id: 'app-q2',
      studentId: 'lead-q2',
      status: 'Visa Granted',
      statusChanged: new Date(`${currentYear}-05-10T01:00:00.000Z`) as any,
      assignedCounsellor: 'Bravo Counsellor',
      history: [{ status: 'Visa Granted', date: new Date(`${currentYear}-05-10T01:00:00.000Z`) as any }],
    }),
  ];

  const rankings = buildTopVisaGrantCounsellors(
    applications,
    [],
    [],
    ALL_MONTHS_VALUE,
    String(currentYear),
    'q2',
  );

  assert.equal(rankings.length, 1);
  assert.equal(rankings[0].name, 'Bravo Counsellor');
  assert.equal(rankings[0].grants, 1);
});
