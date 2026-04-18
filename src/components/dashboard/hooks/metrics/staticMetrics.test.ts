import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApplicationInfo } from '../../../../data/applications';
import { buildTrendData } from './staticMetrics';

const toTimestamp = (date: Date) => ({
  toDate: () => date,
  toMillis: () => date.getTime(),
});

const buildApplication = (overrides?: Partial<ApplicationInfo>): ApplicationInfo => {
  const now = new Date();
  return {
    id: 'app-1',
    subId: 'sub-1',
    studentId: 'student-1',
    citizenship: 'Philippines',
    branch: 'Unknown Branch',
    applicantName: 'Sample Student',
    applicantDob: '01-Jan-2000',
    schoolCourses: [],
    status: 'Submitted Application',
    statusChanged: toTimestamp(now),
    history: [
      {
        status: 'Visa Granted',
        date: toTimestamp(new Date(now.getFullYear(), 0, 15)),
      },
    ],
    visaRefusal: 'No',
    ...overrides,
  };
};

test('buildTrendData remains stable with unexpected branches and countries', () => {
  const data = buildTrendData([buildApplication()]);
  const trendPoints = data.Overall;
  const firstPoint = trendPoints[0];
  const jan2026 = new Date(2026, 0, 1);
  const today = new Date();
  const monthDiff =
    (today.getFullYear() - jan2026.getFullYear()) * 12
    + (today.getMonth() - jan2026.getMonth());
  const expectedMonths = monthDiff >= 0 ? monthDiff + 1 : 1;

  assert.equal(Array.isArray(trendPoints), true);
  assert.equal(trendPoints.length, expectedMonths);
  assert.equal(firstPoint?.month, 'Jan 2026');
  assert.equal(typeof firstPoint?.rate, 'number');
  assert.equal(typeof firstPoint?.granted, 'number');
  assert.equal(typeof firstPoint?.refused, 'number');
  assert.equal(typeof firstPoint?.lodged, 'number');
  assert.equal(firstPoint?.rate, firstPoint?.granted);
});
