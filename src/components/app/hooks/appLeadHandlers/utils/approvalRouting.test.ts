import assert from 'node:assert/strict';
import test from 'node:test';
import {
    filterApproverRecipients,
    getApproverTargets,
    getBranchKey,
    mapApproverRecipientDoc,
} from './approvalRouting';

test('getBranchKey normalizes Makati into Manila key', () => {
    assert.equal(getBranchKey('Makati'), 'manila');
    assert.equal(getBranchKey('Metro Manila'), 'manila');
    assert.equal(getBranchKey('Cebu City'), 'cebu');
});

test('mapApproverRecipientDoc maps and infers approval metadata safely', () => {
    const recipient = mapApproverRecipientDoc({
        id: 'ops-1',
        data: {
            name: 'Ops One',
            role: 'Operations',
            branch: 'Manila',
        },
    });

    assert.ok(recipient);
    assert.equal(recipient?.name, 'Ops One');
    assert.equal(recipient?.roleKey, 'operations');
    assert.equal(recipient?.branchKey, 'manila');
    assert.equal(recipient?.canApproveBranchChange, true);
    assert.equal(recipient?.isActive, true);
});

test('filterApproverRecipients keeps only active branch-role approvers and excludes requester', () => {
    const recipients = [
        mapApproverRecipientDoc({
            id: 'ops-manila',
            data: { name: 'Ops Manila', role: 'Operations', branch: 'Manila' },
        }),
        mapApproverRecipientDoc({
            id: 'dev-manila',
            data: { name: 'Dev Manila', role: 'Developer', branch: 'Makati' },
        }),
        mapApproverRecipientDoc({
            id: 'ops-davao',
            data: { name: 'Ops Davao', role: 'Operations', branch: 'Davao' },
        }),
        mapApproverRecipientDoc({
            id: 'inactive-ops',
            data: { name: 'Inactive Ops', role: 'Operations', branch: 'Manila', isActive: false },
        }),
    ].filter((recipient): recipient is NonNullable<typeof recipient> => Boolean(recipient));

    const filtered = filterApproverRecipients(recipients, {
        excludeUid: 'dev-manila',
        targetBranchKey: 'manila',
        targetRoles: ['operations', 'developer'],
    });

    assert.deepEqual(filtered.map((recipient) => recipient.id), ['ops-manila']);
});

test('getApproverTargets keeps davao escalation routing intact', () => {
    const cebuEscalation = getApproverTargets('Cebu', true);
    assert.equal(cebuEscalation.branchKey, 'cebu');
    assert.equal(cebuEscalation.targetBranchKey, 'davao');
    assert.deepEqual(cebuEscalation.targetRoles, ['operations']);
});
