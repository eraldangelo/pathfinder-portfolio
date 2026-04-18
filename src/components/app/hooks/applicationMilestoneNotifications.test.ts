import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isEducationConsultantActor,
  isMilestoneStatus,
  resolveMilestoneBranchKey,
  resolveMilestoneNotificationRecipients,
  resolveMilestoneRecipientRoles,
} from './applicationMilestoneNotifications';

test('milestone status detection stays aligned with dashboard triggers', () => {
  assert.equal(isMilestoneStatus('Unconditional Offer'), true);
  assert.equal(isMilestoneStatus('CoE/LoA Received'), true);
  assert.equal(isMilestoneStatus('Visa Granted'), true);
  assert.equal(isMilestoneStatus('Visa Refused'), true);
  assert.equal(isMilestoneStatus('Payment Processed'), false);
});

test('education consultant role detection handles common role labels', () => {
  assert.equal(isEducationConsultantActor('Education Consultant'), true);
  assert.equal(isEducationConsultantActor('Education Counsellor'), true);
  assert.equal(isEducationConsultantActor('Operations'), false);
});

test('branch routing keeps manila/makati unified and role targets correct', () => {
  assert.equal(resolveMilestoneBranchKey('Makati'), 'manila');
  assert.equal(resolveMilestoneBranchKey('Manila'), 'manila');
  assert.equal(resolveMilestoneBranchKey('Davao'), 'davao');
  assert.equal(resolveMilestoneBranchKey('Cebu'), 'cebu');
  assert.equal(resolveMilestoneBranchKey('Pampanga'), 'pampanga');
  assert.deepEqual(resolveMilestoneRecipientRoles('manila'), ['operations', 'developer']);
  assert.deepEqual(resolveMilestoneRecipientRoles('davao'), ['operations']);
  assert.deepEqual(resolveMilestoneRecipientRoles('cebu'), ['branch manager']);
  assert.deepEqual(resolveMilestoneRecipientRoles('pampanga'), ['branch manager']);
});

test('recipient filtering respects branch-role matrix and excludes actor', () => {
  const docs = [
    { id: 'ops-manila', data: { role: 'Operations', branch: 'Manila' } },
    { id: 'dev-manila', data: { role: 'Developer', branch: 'Makati' } },
    { id: 'bm-cebu', data: { role: 'Branch Manager', branch: 'Cebu' } },
    { id: 'ops-davao', data: { role: 'Operations', branch: 'Davao' } },
  ];

  assert.deepEqual(
    resolveMilestoneNotificationRecipients(docs, {
      branchKey: 'manila',
      targetRoles: ['operations', 'developer'],
      excludeUid: null,
    }).sort(),
    ['dev-manila', 'ops-manila']
  );

  assert.deepEqual(
    resolveMilestoneNotificationRecipients(docs, {
      branchKey: 'manila',
      targetRoles: ['operations', 'developer'],
      excludeUid: 'ops-manila',
    }),
    ['dev-manila']
  );

  assert.deepEqual(
    resolveMilestoneNotificationRecipients(docs, {
      branchKey: 'cebu',
      targetRoles: ['branch manager'],
      excludeUid: null,
    }),
    ['bm-cebu']
  );
});

