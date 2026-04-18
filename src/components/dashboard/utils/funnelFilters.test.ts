import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApplicationInfo } from '../../../data/applications';
import type { AssessmentSubmission } from '../../../types';
import {
  ALL_MONTHS_VALUE,
  buildAvailableYears,
  buildFunnelLocationOptions,
  filterDashboardByFunnelScope,
  locationMatchesBranch,
  matchesMonthYearFilter,
} from './funnelFilters';

const app = (partial: Partial<ApplicationInfo>): ApplicationInfo => ({
  id: 'app-1',
  subId: 'sub-1',
  studentId: 'lead-1',
  citizenship: 'Philippines',
  branch: 'Manila',
  applicantName: 'Student',
  applicantDob: '01-Jan-2000',
  schoolCourses: [],
  status: 'Submitted Application',
  statusChanged: new Date('2025-11-20') as any,
  history: [],
  visaRefusal: 'No',
  ...partial,
});

const submission = (partial: Partial<AssessmentSubmission>): AssessmentSubmission => ({
  id: 'lead-1',
  createdAt: new Date('2025-11-20') as any,
  ...partial,
});

test('buildAvailableYears includes rollover milestone years from application history', () => {
  const years = buildAvailableYears(
    [
      app({
        status: 'Application Ended',
        statusChanged: new Date('2027-03-01') as any,
        history: [
          { status: 'Application Ended', date: new Date('2027-03-01') as any },
          { status: 'Visa Granted', date: new Date('2026-01-12') as any },
          { status: 'Submitted Application', date: new Date('2025-11-20') as any },
        ],
      }),
    ],
    [submission({ createdAt: new Date('2025-11-20') as any })]
  );

  assert.deepEqual(years, ['2027', '2026', '2025']);
});

test('buildAvailableYears de-duplicates and sorts descending', () => {
  const years = buildAvailableYears(
    [
      app({
        id: 'app-a',
        statusChanged: new Date('2026-08-01') as any,
        history: [{ status: 'Visa Refused', date: new Date('2026-02-10') as any }],
      }),
      app({
        id: 'app-b',
        studentId: 'lead-2',
        statusChanged: new Date('2024-03-01') as any,
        history: [{ status: 'Submitted Application', date: new Date('2024-01-01') as any }],
      }),
    ],
    [
      submission({ id: 'lead-1', createdAt: new Date('2026-01-01') as any }),
      submission({ id: 'lead-2', createdAt: new Date('2025-01-01') as any }),
    ]
  );

  assert.deepEqual(years, ['2026', '2025', '2024']);
});

test('filterDashboardByFunnelScope uses submitted date for cross-year applications', () => {
  const crossYearApplication = app({
    id: 'app-cross-year',
    branch: 'Manila',
    status: 'Application Ended',
    statusChanged: new Date('2026-03-06T10:10:14+08:00') as any,
    applicationDate: '21-Oct-2025' as any,
    history: [
      { status: 'Application Ended', date: new Date('2026-03-06T10:10:14+08:00') as any },
      { status: 'Application Rejected', date: new Date('2026-03-06T10:10:13+08:00') as any },
      { status: 'Conditional Offer', date: new Date('2026-01-20T13:52:33+08:00') as any },
      { status: 'Submitted Application', date: new Date('2025-10-21T15:03:03+08:00') as any },
    ],
  });

  const filtered2025 = filterDashboardByFunnelScope({
    selectedLocation: 'Overall',
    selectedMonth: ALL_MONTHS_VALUE,
    selectedYear: '2025',
    leads: [],
    applications: [crossYearApplication],
    assessmentSubmissions: [],
  });

  const filtered2026 = filterDashboardByFunnelScope({
    selectedLocation: 'Overall',
    selectedMonth: ALL_MONTHS_VALUE,
    selectedYear: '2026',
    leads: [],
    applications: [crossYearApplication],
    assessmentSubmissions: [],
  });

  assert.equal(filtered2025.filteredApplications.length, 1);
  assert.equal(filtered2026.filteredApplications.length, 0);
});

test('filterDashboardByFunnelScope applies quarter filter when month is all months', () => {
  const applications: ApplicationInfo[] = [
    app({
      id: 'app-q1',
      studentId: 'lead-q1',
      status: 'Application Ended',
      statusChanged: new Date('2026-02-15') as any,
      applicationDate: '15-Feb-2026' as any,
    }),
    app({
      id: 'app-q2',
      studentId: 'lead-q2',
      status: 'Application Ended',
      statusChanged: new Date('2026-05-20') as any,
      applicationDate: '20-May-2026' as any,
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-q1', createdAt: new Date('2026-02-15') as any }),
    submission({ id: 'lead-q2', createdAt: new Date('2026-05-20') as any }),
  ];

  const filteredQ2 = filterDashboardByFunnelScope({
    selectedLocation: 'Overall',
    selectedMonth: ALL_MONTHS_VALUE,
    selectedQuarter: 'q2',
    selectedYear: '2026',
    leads: [],
    applications,
    assessmentSubmissions: submissions,
  });

  assert.equal(filteredQ2.filteredApplications.length, 1);
  assert.equal(filteredQ2.filteredApplications[0].id, 'app-q2');
  assert.equal(filteredQ2.filteredAssessmentSubmissions.length, 1);
  assert.equal(filteredQ2.filteredAssessmentSubmissions[0].id, 'lead-q2');
});

test('matchesMonthYearFilter prioritizes explicit month over quarter selection', () => {
  const mayDate = new Date('2026-05-20T00:00:00.000Z');

  assert.equal(matchesMonthYearFilter(mayDate, '4', '2026', 'q1'), true);
  assert.equal(matchesMonthYearFilter(mayDate, '3', '2026', 'q2'), false);
});

test('matchesMonthYearFilter ignores unknown quarter values and falls back to month/year', () => {
  const mayDate = new Date('2026-05-20T00:00:00.000Z');

  assert.equal(matchesMonthYearFilter(mayDate, ALL_MONTHS_VALUE, '2026', 'q5'), true);
  assert.equal(matchesMonthYearFilter(mayDate, ALL_MONTHS_VALUE, '2025', 'q5'), false);
});

test('locationMatchesBranch groups Baguio under Pampanga and Cagayan De Oro under Davao', () => {
  assert.equal(locationMatchesBranch('Pampanga', 'Baguio'), true);
  assert.equal(locationMatchesBranch('Davao', 'Cagayan De Oro'), true);
  assert.equal(locationMatchesBranch('Baguio', 'Pampanga'), true);
  assert.equal(locationMatchesBranch('Cagayan De Oro', 'Davao'), true);
  assert.equal(locationMatchesBranch('Davao', 'Baguio'), false);
});

test('locationMatchesBranch treats Makati and Manila variants as Manila scope', () => {
  assert.equal(locationMatchesBranch('Manila', 'Makati'), true);
  assert.equal(locationMatchesBranch('Manila', 'Metro Manila'), true);
  assert.equal(locationMatchesBranch('Philippines Overall', 'Makati'), true);
  assert.equal(locationMatchesBranch('Philippines Overall', 'Manila Branch'), true);
});

test('filterDashboardByFunnelScope can classify submissions by currentLocation fallback', () => {
  const filtered = filterDashboardByFunnelScope({
    selectedLocation: 'Philippines Overall',
    selectedMonth: ALL_MONTHS_VALUE,
    selectedQuarter: 'all',
    selectedYear: '2026',
    leads: [],
    applications: [],
    assessmentSubmissions: [
      submission({
        id: 'sub-makati-current-location',
        createdAt: new Date('2026-02-10') as any,
        referredStaffBranch: '',
        preferredBranch: '',
        currentLocation: 'Makati',
      }),
    ],
  });

  assert.equal(filtered.branchFilteredAssessmentSubmissions.length, 1);
  assert.equal(filtered.filteredAssessmentSubmissions.length, 1);
});

test('buildFunnelLocationOptions hides grouped branch aliases from dropdown list', () => {
  const options = buildFunnelLocationOptions(
    [
      { id: 'lead-1', branch: 'Baguio' } as any,
      { id: 'lead-2', branch: 'Cagayan De Oro' } as any,
    ],
    [
      app({ id: 'app-davao', branch: 'Davao' }),
      app({ id: 'app-pampanga', branch: 'Pampanga' }),
    ],
    [
      submission({ id: 'sub-baguio', preferredBranch: 'Baguio' }),
      submission({ id: 'sub-cdo', referredStaffBranch: 'Cagayan De Oro' }),
    ],
  );

  assert.equal(options.includes('Baguio'), false);
  assert.equal(options.includes('Cagayan De Oro'), false);
  assert.equal(options.includes('Pampanga'), true);
  assert.equal(options.includes('Davao'), true);
});
