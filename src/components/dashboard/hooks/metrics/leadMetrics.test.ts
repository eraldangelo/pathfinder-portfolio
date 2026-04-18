import assert from 'node:assert/strict';
import test from 'node:test';
import type { AssessmentSubmission } from '../../../../types';
import type { Lead } from '../../../leads/leads-page/LeadsPage';
import {
  buildLeadsByBranchData,
  buildTopLeadSourcesData,
  parseLeadSourceOthersBreakdownDetails,
} from './leadMetrics';

const submission = (partial: Partial<AssessmentSubmission>): AssessmentSubmission => ({
  id: 'lead-1',
  ...partial,
});

const lead = (partial: Partial<Lead>): Lead => ({
  id: 'lead-1',
  fullName: 'Student',
  firstName: 'Student',
  lastName: 'One',
  email: 'student@test.com',
  phoneCountryCode: '+63',
  phoneNumber: '9000000000',
  citizenship: 'Philippines',
  visaRefusal: 'No',
  branch: 'Manila',
  assignedCounsellor: 'Counsellor One',
  caseId: 'PPG000000001',
  dob: '01-Jan-2000',
  maritalStatus: 'Never Married',
  leadStatus: 'New Lead',
  ...partial,
});

test('buildLeadsByBranchData counts both submissions and migrated leads', () => {
  const rows = buildLeadsByBranchData(
    [
      submission({ id: 'sub-1', referredStaffBranch: 'Cagayan De Oro' }),
      submission({ id: 'sub-2', preferredBranch: 'Baguio' }),
    ],
    [
      lead({ id: 'lead-1', branch: 'Baguio' }),
      lead({ id: 'lead-2', branch: 'Cagayan De Oro' }),
      lead({ id: 'lead-3', branch: 'Cagayan De Oro' }),
    ],
  );

  assert.equal(rows.find((row) => row.branch === 'Cagayan De Oro')?.leads, 3);
  assert.equal(rows.find((row) => row.branch === 'Baguio')?.leads, 2);
});

test('buildLeadsByBranchData sorts branches alphabetically', () => {
  const rows = buildLeadsByBranchData(
    [
      submission({ id: 'sub-1', referredStaffBranch: 'Cagayan De Oro' }),
      submission({ id: 'sub-2', preferredBranch: 'Cebu' }),
      submission({ id: 'sub-3', preferredBranch: 'Baguio' }),
    ],
    [
      lead({ id: 'lead-1', branch: 'Cagayan De Oro' }),
      lead({ id: 'lead-2', branch: 'Cagayan De Oro' }),
      lead({ id: 'lead-3', branch: 'Baguio' }),
    ],
  );

  assert.deepEqual(rows.map((row) => row.branch), ['Baguio', 'Cagayan De Oro', 'Cebu']);
});

test('buildLeadsByBranchData aggregates branch labels case-insensitively', () => {
  const rows = buildLeadsByBranchData(
    [submission({ id: 'sub-1', referredStaffBranch: 'cagayan de oro' })],
    [lead({ id: 'lead-1', branch: 'Cagayan De Oro' })],
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].leads, 2);
});

test('buildLeadsByBranchData prefers explicit submission branch over legacy branch fields', () => {
  const rows = buildLeadsByBranchData([
    submission(({
      id: 'sub-1',
      branch: 'Baguio',
      referredStaffBranch: 'Pampanga',
      preferredBranch: 'Pampanga',
    } as unknown) as Partial<AssessmentSubmission>),
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].branch, 'Baguio');
  assert.equal(rows[0].leads, 1);
});

test('buildTopLeadSourcesData excludes Staff Referral mapped from others text', () => {
  const rows = buildTopLeadSourcesData([
    submission({
      id: 'lead-staff',
      pathfinderDiscoverySources: ['Others'],
      otherPathfinderDiscoverySource: 'I was referred by a Pathfinder Staff',
    }),
  ]);

  assert.deepEqual(rows, []);
});

test('buildTopLeadSourcesData keeps Staff Referral for records with referrer identity', () => {
  const rows = buildTopLeadSourcesData([
    submission({
      id: 'lead-referred',
      referredStaffBranch: 'Davao',
      referredStaffName: 'Xena Marie Melendrez',
    }),
  ]);

  assert.deepEqual(rows, [{ source: 'Staff Referral', count: 1 }]);
});

test('buildTopLeadSourcesData keeps Staff Referral mapped from others text when referrer identity exists', () => {
  const rows = buildTopLeadSourcesData([
    submission({
      id: 'lead-staff',
      pathfinderDiscoverySources: ['Others'],
      otherPathfinderDiscoverySource: 'I was referred by a Pathfinder Staff',
      referredStaffName: 'Xena Marie Melendrez',
    }),
  ]);

  assert.deepEqual(rows, [{ source: 'Staff Referral', count: 1 }]);
});

test('buildTopLeadSourcesData keeps Others at the end while excluding Staff Referral', () => {
  const rows = buildTopLeadSourcesData([
    submission({
      id: 'lead-staff',
      pathfinderDiscoverySources: ['Others'],
      otherPathfinderDiscoverySource: 'I was referred by a Pathfinder Staff',
    }),
    submission({
      id: 'lead-other',
      pathfinderDiscoverySources: ['Others'],
      otherPathfinderDiscoverySource: 'Twitter / X',
    }),
  ]);

  assert.equal(rows.at(-1)?.source, 'Others');
  assert.equal(rows.some((row) => row.source === 'Staff Referral'), false);
  assert.equal(rows.find((row) => row.source === 'Others')?.count, 1);
});

test('buildTopLeadSourcesData excludes deferred personal lead labels mapped to Staff Referral', () => {
  const rows = buildTopLeadSourcesData([
    submission({
      id: 'lead-personal',
      pathfinderDiscoverySources: ['Others'],
      otherPathfinderDiscoverySource: 'Mavi - Personal Lead',
    }),
  ]);

  assert.deepEqual(rows, []);
});

test('buildTopLeadSourcesData serializes Others lead-source breakdown details', () => {
  const rows = buildTopLeadSourcesData([
    ...Array.from({ length: 5 }, (_, index) =>
      submission({
        id: `lead-kia-${index}`,
        pathfinderDiscoverySources: ['Others'],
        otherPathfinderDiscoverySource: 'Kia-Ora Documentation Services',
      })
    ),
    ...Array.from({ length: 3 }, (_, index) =>
      submission({
        id: `lead-twitter-${index}`,
        pathfinderDiscoverySources: ['Others'],
        otherPathfinderDiscoverySource: 'Twitter / X',
      })
    ),
    submission({
      id: 'lead-sub-agent',
      pathfinderDiscoverySources: ['Others'],
      otherPathfinderDiscoverySource: 'Referral (subagent)',
    }),
  ]);

  const others = rows.find((row) => row.source === 'Others');
  assert.equal(others?.count, 9);

  const details = parseLeadSourceOthersBreakdownDetails(others?.details);
  assert.deepEqual(details, [
    { label: 'Kia-Ora Documentation Services', count: 5 },
    { label: 'Twitter / X', count: 3 },
    { label: 'Sub-Agent', count: 1 },
  ]);
});
