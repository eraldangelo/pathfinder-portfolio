import test from 'node:test';
import assert from 'node:assert/strict';
import type { DashboardDownloadSnapshot } from './dashboardDownloadSnapshot';
import { buildDashboardAiInsightsFallback } from './dashboardAiInsightsFallback';

const buildSnapshot = (overrides?: Partial<DashboardDownloadSnapshot>): DashboardDownloadSnapshot => ({
  userName: 'Tester',
  reportDate: '4/15/2026',
  selectedFunnelLocation: 'Philippines Overall',
  selectedFunnelMonth: 'all',
  selectedFunnelYear: '2026',
  selectedLocation: 'Philippines Overall',
  selectedQuarter: 'q1',
  funnelData: {
    totalLeads: '0',
    genuineStudents: '0',
    applications: '89',
    offers: '34',
    coe: '31',
    lodged: '22',
    granted: '29',
    refused: '6',
  },
  targetVsActual: [
    { label: 'Applications', actual: 89, target: 624, achievement: 14.3 },
    { label: 'Unconditional Offers', actual: 34, target: 408, achievement: 8.3 },
    { label: 'Visa Granted', actual: 29, target: 312, achievement: 9.3 },
  ],
  topLeadSources: [{ source: 'Pathfinder Facebook Page', count: 61 }],
  topDestinations: [],
  preferredCourses: [],
  topVisaGrantCounsellors: [{ name: 'Vincent Ventura', grants: 6 }],
  topStaffReferrers: [],
  trendData: [
    { month: 'Jan 2026', rate: 0, granted: 10, refused: 2, lodged: 8 },
    { month: 'Feb 2026', rate: 0, granted: 9, refused: 2, lodged: 7 },
    { month: 'Mar 2026', rate: 0, granted: 10, refused: 2, lodged: 7 },
  ],
  ...overrides,
});

test('fallback insights avoid invalid conversion rates when lead denominator is zero', () => {
  const insights = buildDashboardAiInsightsFallback(buildSnapshot());
  const combinedFindings = insights.keyFindings.join('\n');

  assert.match(combinedFindings, /Lead-to-application conversion is No data available/i);
  assert.doesNotMatch(combinedFindings, /8900\.0%/);
});

test('fallback insights explain decision carryover when decisions exceed newly lodged cases', () => {
  const insights = buildDashboardAiInsightsFallback(buildSnapshot());
  const combinedFindings = insights.keyFindings.join('\n');

  assert.match(combinedFindings, /Decision counts are higher than newly lodged counts/i);
  assert.doesNotMatch(combinedFindings, /approval is 131\.8%/i);
});
