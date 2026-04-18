import assert from 'node:assert/strict';
import test from 'node:test';
import type { BranchChangeRequestFormData } from '../../../types/branchChangeRequest';
import { createSubmitBranchChangeRequest } from './branchChangeRequest';

type MergeOptions = { merge?: boolean } | undefined;

const createFirestoreMock = () => {
    let docCounter = 0;
    let addCounter = 0;
    const docs = new Map<string, Record<string, unknown>>();
    const writes: Array<{ path: string; payload: Record<string, unknown>; mode: 'set' | 'add'; merge?: boolean }> = [];

    const applySet = (path: string, payload: Record<string, unknown>, options?: MergeOptions) => {
        const current = docs.get(path) || {};
        const next = options?.merge ? { ...current, ...payload } : { ...payload };
        docs.set(path, next);
        writes.push({ path, payload: { ...payload }, mode: 'set', merge: options?.merge });
    };

    const createCollectionRef = (path: string) => ({
        doc: (id?: string) => {
            const docId = id || `doc-${++docCounter}`;
            return createDocRef(`${path}/${docId}`);
        },
        add: async (payload: Record<string, unknown>) => {
            const docId = `add-${++addCounter}`;
            const docPath = `${path}/${docId}`;
            applySet(docPath, payload);
            writes.push({ path: docPath, payload: { ...payload }, mode: 'add' });
            return { id: docId };
        },
    });

    const createDocRef = (path: string) => {
        const segments = path.split('/');
        const id = segments[segments.length - 1];
        return {
            id,
            path,
            collection: (name: string) => createCollectionRef(`${path}/${name}`),
            set: async (payload: Record<string, unknown>, options?: MergeOptions) => {
                applySet(path, payload, options);
            },
        };
    };

    const db = {
        collection: (name: string) => createCollectionRef(name),
        batch: () => {
            const operations: Array<{ path: string; payload: Record<string, unknown>; options?: MergeOptions }> = [];
            return {
                set: (
                    ref: { set: (payload: Record<string, unknown>, options?: MergeOptions) => Promise<void>; id: string; path: string },
                    payload: Record<string, unknown>,
                    options?: MergeOptions
                ) => {
                    operations.push({ path: ref.path, payload, options });
                },
                commit: async () => {
                    operations.forEach((operation) => {
                        applySet(operation.path, operation.payload, operation.options);
                    });
                },
            };
        },
    };

    return {
        db,
        docs,
        writes,
        getDoc: (path: string) => docs.get(path),
        findPaths: (pattern: RegExp) => [...docs.keys()].filter((path) => pattern.test(path)),
    };
};

const baseUser = {
    uid: 'uid-1',
    email: 'ops@example.com',
    displayName: 'Ops Tester',
    firstName: 'Ops',
    lastName: 'Tester',
    preferredName: null,
    dob: null,
    photoURL: null,
    branch: 'Manila',
};

const translate = (_key: string, options?: { [key: string]: string | number } | string) =>
    typeof options === 'string' ? options : _key;

const requestPayload: BranchChangeRequestFormData = {
    newBranch: 'Cebu',
    newCountry: 'Philippines',
    reason: 'Need to transfer closer to family support for operational continuity.',
};

test('submitBranchChangeRequest dual-writes user history + queue and marks notification sent', async () => {
    const firestore = createFirestoreMock();
    const popups: string[] = [];
    const now = new Date('2026-04-17T12:00:00.000Z');

    const submit = createSubmitBranchChangeRequest({
        ensureReady: async () => true,
        getDb: () => firestore.db as any,
        now: () => now,
        sendNotifications: async () => ({ ok: true, sent: 1 }),
        resolveApprovers: async () => [
            {
                id: 'ops-approver',
                name: 'Ops Approver',
                role: 'Operations',
                roleKey: 'operations',
                branch: 'Manila',
                branchKey: 'manila',
                canApproveBranchChange: true,
                isActive: true,
            },
        ],
    });

    await submit(
        {
            user: baseUser,
            userRole: 'Operations',
            t: translate,
            showPopup: (message) => popups.push(message),
        },
        requestPayload
    );

    const requestPaths = firestore.findPaths(/personnel\/uid-1\/branchChangeRequests\/doc-\d+$/);
    const queuePaths = firestore.findPaths(/branchChangeRequestQueue\/doc-\d+$/);

    assert.equal(requestPaths.length, 1);
    assert.equal(queuePaths.length, 1);

    const requestRecord = firestore.getDoc(requestPaths[0]);
    const queueRecord = firestore.getDoc(queuePaths[0]);
    assert.ok(requestRecord);
    assert.ok(queueRecord);
    assert.equal(requestRecord?.status, 'pending');
    assert.equal(requestRecord?.requestedBranch, 'Cebu');
    assert.equal(queueRecord?.status, 'pending');
    assert.equal(queueRecord?.notificationStatus, 'sent');
    assert.equal(queueRecord?.notificationError, null);
    assert.equal((queueRecord?.approverSummary as any)?.matchedRecipientCount, 1);

    const notificationPaths = firestore.findPaths(/personnel\/uid-1\/notifications\/add-\d+$/);
    assert.equal(notificationPaths.length, 1);
    assert.equal(popups.length, 1);
    assert.match(popups[0], /submitted and is pending/i);
});

test('submitBranchChangeRequest keeps request valid when notification dispatch fails', async () => {
    const firestore = createFirestoreMock();

    const submit = createSubmitBranchChangeRequest({
        ensureReady: async () => true,
        getDb: () => firestore.db as any,
        now: () => new Date('2026-04-17T12:00:00.000Z'),
        sendNotifications: async () => {
            throw new Error('notification service unavailable');
        },
        resolveApprovers: async () => [
            {
                id: 'ops-approver',
                name: 'Ops Approver',
                role: 'Operations',
                roleKey: 'operations',
                branch: 'Manila',
                branchKey: 'manila',
                canApproveBranchChange: true,
                isActive: true,
            },
        ],
    });

    await submit(
        {
            user: baseUser,
            userRole: 'Operations',
            t: translate,
            showPopup: () => undefined,
        },
        requestPayload
    );

    const requestPaths = firestore.findPaths(/personnel\/uid-1\/branchChangeRequests\/doc-\d+$/);
    const queuePaths = firestore.findPaths(/branchChangeRequestQueue\/doc-\d+$/);
    assert.equal(requestPaths.length, 1);
    assert.equal(queuePaths.length, 1);

    const queueRecord = firestore.getDoc(queuePaths[0]);
    assert.equal(queueRecord?.notificationStatus, 'failed');
    assert.match(String(queueRecord?.notificationError || ''), /notification service unavailable/i);
});
