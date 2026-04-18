import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildBranchChangeQueueQueryPlan,
    mapBranchChangeQueueDoc,
    resolveBranchChangeInboxScope,
} from './useBranchChangeQueue';

test('resolveBranchChangeInboxScope is role-aware and branch-aware', () => {
    assert.deepEqual(
        resolveBranchChangeInboxScope({ userRole: 'Developer', userBranch: 'Manila' }),
        { roleKey: 'developer' }
    );
    assert.deepEqual(
        resolveBranchChangeInboxScope({ userRole: 'Operations', userBranch: 'Davao' }),
        { roleKey: 'operations', targetBranchKey: 'davao' }
    );
    assert.deepEqual(
        resolveBranchChangeInboxScope({ userRole: 'Branch Manager', userBranch: 'Cebu' }),
        { roleKey: 'branch manager', targetBranchKey: 'cebu' }
    );
    assert.equal(
        resolveBranchChangeInboxScope({ userRole: 'Education Consultant', userBranch: 'Manila' }),
        null
    );
});

test('buildBranchChangeQueueQueryPlan always includes pending status filter', () => {
    const developerPlan = buildBranchChangeQueueQueryPlan({ roleKey: 'developer' });
    assert.deepEqual(developerPlan.filters[0], {
        fieldPath: 'status',
        opStr: '==',
        value: 'pending',
    });
    assert.deepEqual(developerPlan.filters[1], {
        fieldPath: 'targetRoles',
        opStr: 'array-contains',
        value: 'developer',
    });

    const operationsPlan = buildBranchChangeQueueQueryPlan({
        roleKey: 'operations',
        targetBranchKey: 'manila',
    });
    assert.equal(
        operationsPlan.filters.some(
            (filter) =>
                filter.fieldPath === 'targetBranchKey'
                && filter.opStr === '=='
                && filter.value === 'manila'
        ),
        true
    );
});

test('mapBranchChangeQueueDoc normalizes queue records and defaults status safely', () => {
    const item = mapBranchChangeQueueDoc('req-1', {
        requesterName: 'Ops One',
        requesterRole: 'Operations',
        currentBranch: 'Manila',
        requestedBranch: 'Cebu',
        targetBranchKey: 'manila',
        targetRoles: ['operations'],
        status: 'unexpected-value',
        notificationStatus: 'failed',
        notificationError: 'dispatch failed',
    });

    assert.equal(item.id, 'req-1');
    assert.equal(item.status, 'pending');
    assert.equal(item.notificationStatus, 'failed');
    assert.equal(item.notificationError, 'dispatch failed');
    assert.equal(item.targetBranchKey, 'manila');
    assert.deepEqual(item.targetRoles, ['operations']);
});
