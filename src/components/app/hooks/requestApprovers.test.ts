import assert from 'node:assert/strict';
import test from 'node:test';
import { loadRequestApprovers } from './requestApprovers';

type FirestoreDoc = { id: string; data: () => unknown };

const createMockDb = ({
    indexedDocs,
    fallbackDocs,
    indexError,
    fallbackError,
}: {
    indexedDocs: FirestoreDoc[];
    fallbackDocs: FirestoreDoc[];
    indexError?: Error;
    fallbackError?: Error;
}) => {
    const calls: Array<{ field: string; op: string; value: unknown }> = [];

    const db = {
        collection: (_name: string) => ({
            where: (fieldPath: string, opStr: string, value: unknown) => ({
                get: async () => {
                    calls.push({ field: fieldPath, op: opStr, value });
                    if (fieldPath === 'approvalBranchKey') {
                        if (indexError) throw indexError;
                        return { docs: indexedDocs };
                    }
                    if (fieldPath === 'branch') {
                        if (fallbackError) throw fallbackError;
                        return { docs: fallbackDocs };
                    }
                    return { docs: [] };
                },
            }),
        }),
    };

    return { db, calls };
};

test('loadRequestApprovers merges indexed + fallback recipients during partial backfill', async () => {
    const { db, calls } = createMockDb({
        indexedDocs: [
            {
                id: 'ops-indexed',
                data: () => ({
                    name: 'Ops Indexed',
                    role: 'Operations',
                    approvalRoleKey: 'operations',
                    approvalBranchKey: 'manila',
                    canApproveBranchChange: true,
                }),
            },
        ],
        fallbackDocs: [
            {
                id: 'ops-legacy',
                data: () => ({
                    name: 'Ops Legacy',
                    role: 'Operations',
                    branch: 'Manila',
                }),
            },
        ],
    });

    const recipients = await loadRequestApprovers({
        db: db as any,
        targetBranchKey: 'manila',
        targetRoles: ['operations'],
        excludeUid: 'requester-1',
    });

    assert.deepEqual(
        recipients.map((recipient) => recipient.id).sort(),
        ['ops-indexed', 'ops-legacy']
    );
    assert.equal(calls.some((call) => call.field === 'approvalBranchKey'), true);
    assert.equal(calls.some((call) => call.field === 'branch'), true);
});

test('loadRequestApprovers dedupes recipients that appear in both query paths', async () => {
    const { db } = createMockDb({
        indexedDocs: [
            {
                id: 'ops-1',
                data: () => ({
                    name: 'Ops 1',
                    role: 'Operations',
                    approvalRoleKey: 'operations',
                    approvalBranchKey: 'manila',
                    canApproveBranchChange: true,
                }),
            },
        ],
        fallbackDocs: [
            {
                id: 'ops-1',
                data: () => ({
                    name: 'Ops 1 Duplicate',
                    role: 'Operations',
                    branch: 'Manila',
                }),
            },
        ],
    });

    const recipients = await loadRequestApprovers({
        db: db as any,
        targetBranchKey: 'manila',
        targetRoles: ['operations'],
        excludeUid: 'requester-1',
    });

    assert.deepEqual(recipients.map((recipient) => recipient.id), ['ops-1']);
});

test('loadRequestApprovers keeps excludeUid behavior across merged result sets', async () => {
    const { db } = createMockDb({
        indexedDocs: [
            {
                id: 'requester-1',
                data: () => ({
                    name: 'Requester',
                    role: 'Operations',
                    approvalRoleKey: 'operations',
                    approvalBranchKey: 'manila',
                    canApproveBranchChange: true,
                }),
            },
        ],
        fallbackDocs: [
            {
                id: 'ops-2',
                data: () => ({
                    name: 'Ops 2',
                    role: 'Operations',
                    branch: 'Manila',
                }),
            },
        ],
    });

    const recipients = await loadRequestApprovers({
        db: db as any,
        targetBranchKey: 'manila',
        targetRoles: ['operations'],
        excludeUid: 'requester-1',
    });

    assert.deepEqual(recipients.map((recipient) => recipient.id), ['ops-2']);
});

test('loadRequestApprovers falls back cleanly when indexed lookup fails', async () => {
    const { db, calls } = createMockDb({
        indexedDocs: [],
        fallbackDocs: [
            {
                id: 'ops-fallback',
                data: () => ({
                    name: 'Fallback Ops',
                    role: 'Operations',
                    branch: 'Manila',
                }),
            },
        ],
        indexError: new Error('Missing index'),
    });

    const recipients = await loadRequestApprovers({
        db: db as any,
        targetBranchKey: 'manila',
        targetRoles: ['operations'],
        excludeUid: 'requester-1',
    });

    assert.deepEqual(recipients.map((recipient) => recipient.id), ['ops-fallback']);
    assert.equal(calls.some((call) => call.field === 'branch'), true);
});
