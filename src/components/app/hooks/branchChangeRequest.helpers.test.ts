import test from 'node:test';
import assert from 'node:assert/strict';
import {
    BRANCH_CHANGE_REASON_MIN_LENGTH,
    buildBranchChangeRequestMessage,
    getBranchChangeValidationError,
    normalizeBranchChangeRequest,
    shouldUseDavaoApproverRouting,
} from './branchChangeRequest.helpers';

test('normalizeBranchChangeRequest trims reason and branch values', () => {
    const normalized = normalizeBranchChangeRequest({
        reason: '  Need to support branch operations closer to home.  ',
        newBranch: '  Cebu  ',
        newCountry: '  Philippines ',
    });

    assert.equal(normalized.reason, 'Need to support branch operations closer to home.');
    assert.equal(normalized.newBranch, 'Cebu');
    assert.equal(normalized.newCountry, 'Philippines');
});

test('getBranchChangeValidationError enforces branch selection and reason length', () => {
    const missingBranchError = getBranchChangeValidationError(
        normalizeBranchChangeRequest({
            reason: 'a'.repeat(BRANCH_CHANGE_REASON_MIN_LENGTH),
            newBranch: '',
        }),
        'Manila'
    );
    assert.equal(missingBranchError, 'missingBranch');

    const shortReasonError = getBranchChangeValidationError(
        normalizeBranchChangeRequest({
            reason: 'too short',
            newBranch: 'Cebu',
        }),
        'Manila'
    );
    assert.equal(shortReasonError, 'shortReason');
});

test('getBranchChangeValidationError rejects selecting current branch', () => {
    const sameBranchError = getBranchChangeValidationError(
        normalizeBranchChangeRequest({
            reason: 'a'.repeat(BRANCH_CHANGE_REASON_MIN_LENGTH),
            newBranch: 'manila',
        }),
        'Manila'
    );

    assert.equal(sameBranchError, 'sameBranch');
});

test('shouldUseDavaoApproverRouting follows existing operations/manager rules', () => {
    assert.equal(shouldUseDavaoApproverRouting('operations', 'Manila'), true);
    assert.equal(shouldUseDavaoApproverRouting('branch manager', 'Cebu'), true);
    assert.equal(shouldUseDavaoApproverRouting('branch manager', 'Pampanga'), true);
    assert.equal(shouldUseDavaoApproverRouting('operations', 'Davao'), false);
    assert.equal(shouldUseDavaoApproverRouting('education consultant', 'Manila'), false);
});

test('buildBranchChangeRequestMessage includes source and target branch labels', () => {
    const message = buildBranchChangeRequestMessage({
        requesterName: 'Alex',
        currentBranch: 'Manila',
        newBranch: 'Cebu',
    });

    assert.equal(
        message,
        'Alex requested a branch change from Manila to Cebu.'
    );
});
