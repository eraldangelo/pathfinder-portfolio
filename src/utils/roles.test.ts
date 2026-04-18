import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isAdminLikeRole,
  isArchiveViewerRole,
  canViewArchiveRole,
  isConsultantLikeRole,
  isCounsellorRole,
  isDeveloperRole,
  isMarketingRole,
  isOperationsLikeRole,
  isSatelliteOfficeRole,
} from './roles';

test('developer role aliases are recognized', () => {
  assert.equal(isDeveloperRole('Developer'), true);
  assert.equal(isDeveloperRole('developer (legacy)'), true);
  assert.equal(isDeveloperRole('operations'), false);
});

test('consultant-like role behavior stays stable', () => {
  assert.equal(isCounsellorRole('education consultant'), true);
  assert.equal(isConsultantLikeRole('branch manager'), true);
  assert.equal(isConsultantLikeRole('administrative staff'), false);
});

test('admin-like and operations-like role behavior stays stable', () => {
  assert.equal(isAdminLikeRole('administrative staff'), true);
  assert.equal(isSatelliteOfficeRole('satellite office staff'), true);
  assert.equal(isOperationsLikeRole('operations'), true);
  assert.equal(isOperationsLikeRole('branch manager'), false);
});

test('archive visibility and yearly-run roles stay aligned with access policy', () => {
  assert.equal(isArchiveViewerRole('Developer'), true);
  assert.equal(isArchiveViewerRole('Operations'), true);
  assert.equal(isArchiveViewerRole('Branch Manager'), true);
  assert.equal(isArchiveViewerRole('Education Consultant'), false);
  assert.equal(isArchiveViewerRole('Administrative Staff'), false);
  assert.equal(isArchiveViewerRole('Marketing Staff'), false);
  assert.equal(canViewArchiveRole('Marketing Staff'), true);
  assert.equal(canViewArchiveRole('Administrative Staff'), true);
  assert.equal(canViewArchiveRole('Education Consultant'), true);
  assert.equal(canViewArchiveRole('Satellite Office Staff'), false);
  assert.equal(canViewArchiveRole('Unknown Role'), false);
});

test('marketing role aliases are recognized', () => {
  assert.equal(isMarketingRole('marketing staff'), true);
  assert.equal(isMarketingRole('Marketing'), true);
  assert.equal(isMarketingRole('operations'), false);
});
