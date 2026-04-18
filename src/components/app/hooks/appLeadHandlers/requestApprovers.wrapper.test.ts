import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveLeaveApproverRecipients } from './leaveRequest';
import { resolveOffsetApproverRecipients } from './offsetRequest';

type ApproverParams = Parameters<typeof resolveLeaveApproverRecipients>[0];

const buildApproverParams = (): ApproverParams => ({
    db: {
        collection: () => ({
            where: () => ({
                get: async () => ({ docs: [] }),
            }),
        }),
    },
    targetBranchKey: 'manila',
    targetRoles: ['operations'],
    excludeUid: 'requester-1',
});

test('resolveLeaveApproverRecipients reuses shared resolver contract and keeps excludeUid', async () => {
    const params = buildApproverParams();
    let capturedParams: ApproverParams | null = null;

    const recipients = await resolveLeaveApproverRecipients(
        params,
        async (input) => {
            capturedParams = input;
            return [
                {
                    id: 'ops-1',
                    name: 'Ops One',
                    role: 'Operations',
                    roleKey: 'operations',
                    branch: 'Manila',
                    branchKey: 'manila',
                    canApproveBranchChange: true,
                    isActive: true,
                },
            ];
        }
    );

    assert.equal(capturedParams?.excludeUid, 'requester-1');
    assert.deepEqual(recipients.map((recipient) => recipient.id), ['ops-1']);
});

test('resolveOffsetApproverRecipients reuses shared resolver contract and keeps branch routing inputs', async () => {
    const params = buildApproverParams();
    let capturedParams: ApproverParams | null = null;

    const recipients = await resolveOffsetApproverRecipients(
        params,
        async (input) => {
            capturedParams = input;
            return [
                {
                    id: 'ops-2',
                    name: 'Ops Two',
                    role: 'Operations',
                    roleKey: 'operations',
                    branch: 'Manila',
                    branchKey: 'manila',
                    canApproveBranchChange: true,
                    isActive: true,
                },
            ];
        }
    );

    assert.equal(capturedParams?.targetBranchKey, 'manila');
    assert.deepEqual(capturedParams?.targetRoles, ['operations']);
    assert.deepEqual(recipients.map((recipient) => recipient.id), ['ops-2']);
});
