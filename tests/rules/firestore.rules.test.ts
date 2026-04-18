import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { createRulesTestEnvironment } from './testEnvironment';

let testEnv: RulesTestEnvironment;

const seedDoc = async (path: string, value: Record<string, unknown>) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), value);
  });
};

const defaultAuthToken = (uid: string, token?: Record<string, unknown>) => ({
  email: `${uid}@example.com`,
  ...(token || {}),
});

const authedFirestore = (uid: string, token?: Record<string, unknown>) =>
  testEnv.authenticatedContext(uid, defaultAuthToken(uid, token)).firestore();

describe('Firestore Rules Semantics', () => {
  before(async () => {
    testEnv = await createRulesTestEnvironment();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  after(async () => {
    await testEnv.cleanup();
  });

  test('education providers are read-only for signed-in users', async () => {
    await seedDoc('educationProviders/provider-1', { name: 'Provider One' });

    const anonymousDb = testEnv.unauthenticatedContext().firestore();
    const signedInDb = authedFirestore('staff-1');

    await assertFails(getDoc(doc(anonymousDb, 'educationProviders/provider-1')));
    await assertSucceeds(getDoc(doc(signedInDb, 'educationProviders/provider-1')));
    await assertFails(
      setDoc(doc(signedInDb, 'educationProviders/provider-1'), {
        name: 'Modified Provider',
      }),
    );
  });

  test('notification create is restricted to self with valid payload', async () => {
    const ownerDb = authedFirestore('owner-1');
    const otherDb = authedFirestore('other-1');

    await assertSucceeds(
      setDoc(doc(ownerDb, 'personnel/owner-1/notifications/n1'), {
        message: 'Reminder',
        read: false,
      }),
    );

    await assertFails(
      setDoc(doc(otherDb, 'personnel/owner-1/notifications/n2'), {
        message: 'Unauthorized write',
        read: false,
      }),
    );

    await assertFails(
      setDoc(doc(ownerDb, 'personnel/owner-1/notifications/n3'), {
        message: '',
        read: false,
      }),
    );
  });

  test('branch-change queue read stays limited to developer/operations/branch manager scopes', async () => {
    await seedDoc('personnel/requester-1', {
      role: 'Education Consultant',
      branch: 'Manila',
      name: 'Requester One',
    });
    await seedDoc('personnel/ops-1', {
      role: 'Operations',
      branch: 'Makati',
      name: 'Ops Manila Alias',
    });
    await seedDoc('personnel/bm-1', {
      role: 'Branch Manager',
      branch: 'Cebu City',
      name: 'Branch Manager Cebu Alias',
    });
    await seedDoc('personnel/dev-1', {
      role: 'Developer',
      branch: 'Manila',
      name: 'Developer One',
    });

    await seedDoc('branchChangeRequestQueue/req-manila', {
      requesterId: 'requester-1',
      targetBranchKey: 'manila',
      targetRoles: ['operations', 'developer'],
      status: 'pending',
      createdAt: new Date('2026-04-18T00:00:00.000Z'),
    });
    await seedDoc('branchChangeRequestQueue/req-cebu', {
      requesterId: 'requester-1',
      targetBranchKey: 'cebu',
      targetRoles: ['branch manager'],
      status: 'pending',
      createdAt: new Date('2026-04-18T00:01:00.000Z'),
    });

    const requesterDb = authedFirestore('requester-1');
    const opsDb = authedFirestore('ops-1');
    const branchManagerDb = authedFirestore('bm-1');
    const developerDb = authedFirestore('dev-1');

    await assertFails(getDoc(doc(requesterDb, 'branchChangeRequestQueue/req-manila')));
    await assertSucceeds(getDoc(doc(opsDb, 'branchChangeRequestQueue/req-manila')));
    await assertSucceeds(getDoc(doc(developerDb, 'branchChangeRequestQueue/req-manila')));
    await assertSucceeds(getDoc(doc(branchManagerDb, 'branchChangeRequestQueue/req-cebu')));
    await assertFails(getDoc(doc(opsDb, 'branchChangeRequestQueue/req-cebu')));

    const opsQueueQuery = query(
      collection(opsDb, 'branchChangeRequestQueue'),
      where('status', '==', 'pending'),
      where('targetRoles', 'array-contains', 'operations'),
      where('targetBranchKey', '==', 'manila'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    await assertSucceeds(getDocs(opsQueueQuery));

    const requesterQueueQuery = query(
      collection(requesterDb, 'branchChangeRequestQueue'),
      where('status', '==', 'pending'),
      where('targetRoles', 'array-contains', 'operations'),
      where('targetBranchKey', '==', 'manila'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    await assertFails(getDocs(requesterQueueQuery));
  });

  test('branch-scoped writer cannot create leads outside own branch', async () => {
    await seedDoc('personnel/staff-1', {
      role: 'Administrative Staff',
      branch: 'Manila',
      name: 'Staff One',
    });

    const staffDb = authedFirestore('staff-1');

    await assertFails(
      setDoc(doc(staffDb, 'leads/lead-outside-branch'), {
        referredStaffBranch: 'Cebu',
        assignedCounsellorUid: 'staff-1',
      }),
    );

    await assertSucceeds(
      setDoc(doc(staffDb, 'leads/lead-same-branch'), {
        referredStaffBranch: 'Manila',
        assignedCounsellorUid: 'staff-1',
      }),
    );
  });

  test('branch-scoped lead reads are limited to assigned or same-branch leads', async () => {
    await seedDoc('personnel/staff-1', {
      role: 'Administrative Staff',
      branch: 'Manila',
      name: 'Staff One',
    });
    await seedDoc('leads/lead-manila', {
      referredStaffBranch: 'Manila',
      assignedCounsellorUid: 'other-uid',
    });
    await seedDoc('leads/lead-cebu', {
      referredStaffBranch: 'Cebu',
      assignedCounsellorUid: 'other-uid',
    });

    const staffDb = authedFirestore('staff-1');

    await assertSucceeds(getDoc(doc(staffDb, 'leads/lead-manila')));
    await assertFails(getDoc(doc(staffDb, 'leads/lead-cebu')));
  });

  test('approver roles can update leave requests while non-approvers cannot', async () => {
    await seedDoc('personnel/approver-1', {
      role: 'Operations',
      branch: 'Manila',
      name: 'Approver',
    });
    await seedDoc('personnel/non-approver-1', {
      role: 'Education Consultant',
      branch: 'Manila',
      name: 'Counsellor',
    });
    await seedDoc('personnel/user-1', {
      role: 'Education Consultant',
      branch: 'Manila',
      name: 'User One',
      leaveBalance: 5,
    });
    await seedDoc('personnel/user-1/leaveRequests/req-1', {
      status: 'pending',
      dayCount: 1,
      fromDate: '2026-01-02',
      toDate: '2026-01-02',
    });

    const approverDb = authedFirestore('approver-1');
    const nonApproverDb = authedFirestore('non-approver-1');

    await assertSucceeds(
      updateDoc(doc(approverDb, 'personnel/user-1/leaveRequests/req-1'), {
        status: 'approved',
      }),
    );

    await assertFails(
      updateDoc(doc(nonApproverDb, 'personnel/user-1/leaveRequests/req-1'), {
        status: 'approved',
      }),
    );
  });

  test('archive docs are readable by authorized staff only', async () => {
    await seedDoc('personnel/staff-archive', {
      role: 'Developer',
      branch: 'Manila',
      name: 'Archive Staff',
    });
    await seedDoc('archives/2025', {
      status: 'completed',
      archiveYear: 2025,
    });

    const staffDb = authedFirestore('staff-archive');
    const outsiderDb = authedFirestore('outsider');
    const anonymousDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(staffDb, 'archives/2025')));
    await assertFails(getDoc(doc(outsiderDb, 'archives/2025')));
    await assertFails(getDoc(doc(anonymousDb, 'archives/2025')));
  });

  test('self personnel update blocks passwordNeedsReset mutation', async () => {
    await seedDoc('personnel/user-1', {
      role: 'Education Consultant',
      branch: 'Manila',
      name: 'Original Name',
      passwordNeedsReset: true,
    });

    const userDb = authedFirestore('user-1');

    await assertSucceeds(
      updateDoc(doc(userDb, 'personnel/user-1'), {
        name: 'Updated Name',
      }),
    );

    await assertFails(
      updateDoc(doc(userDb, 'personnel/user-1'), {
        passwordNeedsReset: false,
      }),
    );
  });
});
