import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApplicationInfo } from '../../../data/applications';
import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE } from './funnelFilters';
import { buildTargetVsActualRows } from './targetVsActualMetrics';

const makeApplication = (overrides: Partial<ApplicationInfo> = {}): ApplicationInfo => ({
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

test('target-vs-actual uses milestone year for offers and visa grants', () => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const applications: ApplicationInfo[] = [
    makeApplication({
      id: 'rollover-app',
      status: 'Application Ended',
      statusChanged: new Date(`${currentYear}-03-01T12:00:00.000Z`) as any,
      applicationDate: `20-Nov-${previousYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${previousYear}-11-20T01:00:00.000Z`) as any },
        { status: 'Unconditional Offer', date: new Date(`${currentYear}-01-08T01:00:00.000Z`) as any },
        { status: 'Visa Granted', date: new Date(`${currentYear}-02-15T01:00:00.000Z`) as any },
      ],
    }),
  ];

  const { rows } = buildTargetVsActualRows(
    applications,
    'Philippines Overall',
    ALL_MONTHS_VALUE,
    String(currentYear),
  );
  const byKey = Object.fromEntries(rows.map((row) => [row.key, row.actual]));

  assert.equal(byKey.applications, 0);
  assert.equal(byKey.unconditionalOffers, 1);
  assert.equal(byKey.visaGranted, 1);
});

test('target-vs-actual counts only unconditional offer as offer received', () => {
  const currentYear = new Date().getFullYear();

  const applications: ApplicationInfo[] = [
    makeApplication({
      id: 'conditional-only',
      status: 'Conditional Offer',
      statusChanged: new Date(`${currentYear}-02-05T03:46:58.000Z`) as any,
      applicationDate: `05-Feb-${currentYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-02-05T03:46:58.000Z`) as any },
        { status: 'Conditional Offer', date: new Date(`${currentYear}-02-13T02:11:03.000Z`) as any },
      ],
    }),
  ];

  const { rows } = buildTargetVsActualRows(
    applications,
    'Philippines Overall',
    ALL_MONTHS_VALUE,
    String(currentYear),
  );
  const byKey = Object.fromEntries(rows.map((row) => [row.key, row.actual]));

  assert.equal(byKey.applications, 1);
  assert.equal(byKey.unconditionalOffers, 0);
});

test('target-vs-actual applies month filter to milestones', () => {
  const currentYear = new Date().getFullYear();

  const applications: ApplicationInfo[] = [
    makeApplication({
      id: 'month-filter-app',
      status: 'Visa Granted',
      statusChanged: new Date(`${currentYear}-02-10T01:00:00.000Z`) as any,
      applicationDate: `02-Feb-${currentYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-02-02T01:00:00.000Z`) as any },
        { status: 'Unconditional Offer', date: new Date(`${currentYear}-02-05T01:00:00.000Z`) as any },
        { status: 'Visa Granted', date: new Date(`${currentYear}-02-10T01:00:00.000Z`) as any },
      ],
    }),
  ];

  const january = buildTargetVsActualRows(
    applications,
    'Philippines Overall',
    String(0),
    String(currentYear),
  );
  const february = buildTargetVsActualRows(
    applications,
    'Philippines Overall',
    String(1),
    String(currentYear),
  );

  const januaryByKey = Object.fromEntries(january.rows.map((row) => [row.key, row.actual]));
  const februaryByKey = Object.fromEntries(february.rows.map((row) => [row.key, row.actual]));

  assert.equal(januaryByKey.unconditionalOffers, 0);
  assert.equal(januaryByKey.visaGranted, 0);
  assert.equal(februaryByKey.unconditionalOffers, 1);
  assert.equal(februaryByKey.visaGranted, 1);
});

test('target-vs-actual keeps yearly targets when all months is selected', () => {
  const currentYear = new Date().getFullYear();

  const { rows } = buildTargetVsActualRows(
    [],
    'Cebu',
    ALL_MONTHS_VALUE,
    String(currentYear),
  );

  const targetByKey = Object.fromEntries(rows.map((row) => [row.key, row.target]));

  assert.equal(targetByKey.applications, 120);
  assert.equal(targetByKey.unconditionalOffers, 72);
  assert.equal(targetByKey.visaGranted, 48);
});

test('target-vs-actual divides annual targets by 12 when a specific month is selected', () => {
  const currentYear = new Date().getFullYear();
  const january = String(0);

  const scenarios = [
    {
      location: 'Philippines Overall',
      expected: { applications: 52, unconditionalOffers: 34, visaGranted: 26 },
    },
    {
      location: 'Cebu',
      expected: { applications: 10, unconditionalOffers: 6, visaGranted: 4 },
    },
    {
      location: 'Manila',
      expected: { applications: 15, unconditionalOffers: 10, visaGranted: 8 },
    },
  ] as const;

  scenarios.forEach(({ location, expected }) => {
    const { rows } = buildTargetVsActualRows(
      [],
      location,
      january,
      String(currentYear),
    );
    const targetByKey = Object.fromEntries(rows.map((row) => [row.key, row.target]));

    assert.equal(targetByKey.applications, expected.applications);
    assert.equal(targetByKey.unconditionalOffers, expected.unconditionalOffers);
    assert.equal(targetByKey.visaGranted, expected.visaGranted);
  });
});

test('target-vs-actual divides annual targets by 4 when a quarter is selected', () => {
  const currentYear = new Date().getFullYear();

  const { rows } = buildTargetVsActualRows(
    [],
    'Cebu',
    ALL_MONTHS_VALUE,
    String(currentYear),
    'q2',
  );

  const targetByKey = Object.fromEntries(rows.map((row) => [row.key, row.target]));

  assert.equal(targetByKey.applications, 30);
  assert.equal(targetByKey.unconditionalOffers, 18);
  assert.equal(targetByKey.visaGranted, 12);
});

test('target-vs-actual quarter filter applies to milestone actuals', () => {
  const currentYear = new Date().getFullYear();

  const applications: ApplicationInfo[] = [
    makeApplication({
      id: 'quarter-filter-app',
      status: 'Visa Granted',
      statusChanged: new Date(`${currentYear}-05-10T01:00:00.000Z`) as any,
      applicationDate: `02-May-${currentYear}`,
      history: [
        { status: 'Submitted Application', date: new Date(`${currentYear}-05-02T01:00:00.000Z`) as any },
        { status: 'Unconditional Offer', date: new Date(`${currentYear}-05-05T01:00:00.000Z`) as any },
        { status: 'Visa Granted', date: new Date(`${currentYear}-05-10T01:00:00.000Z`) as any },
      ],
    }),
  ];

  const q1 = buildTargetVsActualRows(
    applications,
    'Philippines Overall',
    ALL_MONTHS_VALUE,
    String(currentYear),
    'q1',
  );
  const q2 = buildTargetVsActualRows(
    applications,
    'Philippines Overall',
    ALL_MONTHS_VALUE,
    String(currentYear),
    'q2',
  );
  const allQuarter = buildTargetVsActualRows(
    applications,
    'Philippines Overall',
    ALL_MONTHS_VALUE,
    String(currentYear),
    ALL_QUARTERS_VALUE,
  );

  const q1ByKey = Object.fromEntries(q1.rows.map((row) => [row.key, row.actual]));
  const q2ByKey = Object.fromEntries(q2.rows.map((row) => [row.key, row.actual]));
  const allQuarterByKey = Object.fromEntries(allQuarter.rows.map((row) => [row.key, row.actual]));

  assert.equal(q1ByKey.applications, 0);
  assert.equal(q2ByKey.applications, 1);
  assert.equal(q2ByKey.unconditionalOffers, 1);
  assert.equal(q2ByKey.visaGranted, 1);
  assert.equal(allQuarterByKey.applications, 1);
});
