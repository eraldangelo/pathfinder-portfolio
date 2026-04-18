import assert from 'node:assert/strict';
import test from 'node:test';
import { canCreateCrossUserNotificationsRole } from './authorization';

test('canCreateCrossUserNotificationsRole allows expected staff roles and aliases', () => {
  const allowedRoles = [
    'Developer',
    'Developer (All Access)',
    'Operations',
    'Branch Manager',
    'Education Consultant',
    'Education Counsellor',
    'Education Counselor',
    'Administrative Staff',
    'Satellite Office Staff',
    'Marketing',
    'Marketing Staff',
  ];

  allowedRoles.forEach((role) => {
    assert.equal(canCreateCrossUserNotificationsRole(role), true, `Expected role to be allowed: ${role}`);
  });
});

test('canCreateCrossUserNotificationsRole blocks unexpected roles', () => {
  const blockedRoles = [null, '', 'Guest', 'Intern', 'Viewer'];
  blockedRoles.forEach((role) => {
    assert.equal(canCreateCrossUserNotificationsRole(role), false, `Expected role to be blocked: ${String(role)}`);
  });
});

