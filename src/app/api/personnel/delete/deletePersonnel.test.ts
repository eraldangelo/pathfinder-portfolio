import test from 'node:test';
import assert from 'node:assert/strict';
import { deletePersonnelIdentity } from './deletePersonnel';

type FakeDocState = {
  exists: boolean;
  data: Record<string, unknown> | null;
  failDeleteError: Error | null;
};

class FakePersonnelDocRef {
  constructor(private readonly state: FakeDocState) {}

  async get() {
    return { exists: this.state.exists };
  }

  async set(value: Record<string, unknown>, options?: { merge?: boolean }) {
    const next = options?.merge ? { ...(this.state.data || {}), ...value } : { ...value };
    this.state.exists = true;
    this.state.data = next;
  }

  async delete() {
    if (this.state.failDeleteError) throw this.state.failDeleteError;
    this.state.exists = false;
    this.state.data = null;
  }
}

class FakeAdminDb {
  constructor(private readonly docs: Record<string, FakeDocState>) {}

  collection(name: string) {
    assert.equal(name, 'personnel');
    return {
      doc: (uid: string) => {
        if (!this.docs[uid]) {
          this.docs[uid] = { exists: false, data: null, failDeleteError: null };
        }
        return new FakePersonnelDocRef(this.docs[uid]);
      },
    };
  }
}

test('deletePersonnelIdentity keeps tombstone state when auth deletion fails', async () => {
  const docs: Record<string, FakeDocState> = {
    'target-1': { exists: true, data: { name: 'Target One' }, failDeleteError: null },
  };
  const adminDb = new FakeAdminDb(docs);
  const adminAuth = {
    deleteUser: async () => {
      throw Object.assign(new Error('Auth backend unavailable'), { code: 'auth/internal-error' });
    },
  };

  const result = await deletePersonnelIdentity({
    adminAuth,
    adminDb,
    targetUid: 'target-1',
    requestedByUid: 'requester-1',
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'auth-delete-failed');
  assert.equal(docs['target-1'].exists, true);
  assert.equal(String(docs['target-1'].data?.deletionState && (docs['target-1'].data?.deletionState as { status?: string }).status), 'auth-delete-failed');
});

test('deletePersonnelIdentity is idempotent when auth user is already missing', async () => {
  const docs: Record<string, FakeDocState> = {};
  const adminDb = new FakeAdminDb(docs);
  const adminAuth = {
    deleteUser: async () => {
      throw Object.assign(new Error('Missing user'), { code: 'auth/user-not-found' });
    },
  };

  const first = await deletePersonnelIdentity({
    adminAuth,
    adminDb,
    targetUid: 'missing-user',
    requestedByUid: 'requester-1',
  });
  const second = await deletePersonnelIdentity({
    adminAuth,
    adminDb,
    targetUid: 'missing-user',
    requestedByUid: 'requester-1',
  });

  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.authAlreadyMissing, true);
  assert.equal(first.personnelPreviouslyExisted, false);

  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(second.authAlreadyMissing, true);
  assert.equal(second.personnelPreviouslyExisted, false);

  assert.equal(docs['missing-user'].exists, false);
  assert.equal(docs['missing-user'].data, null);
});

test('deletePersonnelIdentity preserves cleanup state when firestore delete fails after auth deletion', async () => {
  const docs: Record<string, FakeDocState> = {
    'target-2': {
      exists: true,
      data: { name: 'Target Two' },
      failDeleteError: new Error('Firestore delete timeout'),
    },
  };
  const adminDb = new FakeAdminDb(docs);
  const adminAuth = {
    deleteUser: async () => {},
  };

  const result = await deletePersonnelIdentity({
    adminAuth,
    adminDb,
    targetUid: 'target-2',
    requestedByUid: 'requester-2',
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'firestore-delete-failed');
  assert.equal(docs['target-2'].exists, true);
  assert.equal(
    String(docs['target-2'].data?.deletionState && (docs['target-2'].data?.deletionState as { status?: string }).status),
    'auth-deleted-firestore-cleanup-required',
  );
});
