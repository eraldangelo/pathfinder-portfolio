import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStudyNaviSsoClaims } from './claims';

test('buildStudyNaviSsoClaims keeps source and maps recognized Pathfinder roles to staff', () => {
  const claims = buildStudyNaviSsoClaims({ personnelRole: 'Operations' });
  assert.equal(claims.source, 'pathfinder');
  assert.equal(claims.staff, true);
  assert.equal(claims.pathfinderRole, 'Operations');
  assert.equal(claims.admin, undefined);
  assert.equal(claims.support, undefined);
});

test('buildStudyNaviSsoClaims preserves explicit admin/support claims', () => {
  const claims = buildStudyNaviSsoClaims({ admin: true, support: true });
  assert.equal(claims.admin, true);
  assert.equal(claims.support, true);
  assert.equal(claims.staff, true);
});

test('buildStudyNaviSsoClaims does not elevate unknown role', () => {
  const claims = buildStudyNaviSsoClaims({ personnelRole: 'Guest Observer' });
  assert.equal(claims.staff, undefined);
  assert.equal(claims.admin, undefined);
  assert.equal(claims.support, undefined);
  assert.equal(claims.pathfinderRole, 'Guest Observer');
});
