import { after, before, describe, test } from 'node:test';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes } from 'firebase/storage';
import { createRulesTestEnvironment, getRulesBucket } from './testEnvironment';

let testEnv: RulesTestEnvironment;

const defaultAuthToken = (uid: string, token?: Record<string, unknown>) => ({
  email: `${uid}@example.com`,
  ...(token || {}),
});

const authedStorage = (uid: string, token?: Record<string, unknown>) =>
  testEnv.authenticatedContext(uid, defaultAuthToken(uid, token)).storage(getRulesBucket());

const uploadReportFile = (uid: string, fileName: string, byUid: string, token?: Record<string, unknown>) => {
  const storage = authedStorage(byUid, token);
  return uploadBytes(
    ref(storage, `reports/${uid}/${fileName}`),
    new Uint8Array([1, 2, 3]),
    { contentType: 'image/png' },
  );
};

describe('Storage Rules Semantics', () => {
  before(async () => {
    testEnv = await createRulesTestEnvironment();
  });

  after(async () => {
    await testEnv.cleanup();
  });

  test('report uploads are owner-scoped and image-only', async () => {
    await assertSucceeds(uploadReportFile('owner-1', 'report-owner.png', 'owner-1'));

    const otherUserStorage = authedStorage('other-1');
    await assertFails(
      uploadBytes(
        ref(otherUserStorage, 'reports/owner-1/report-other.png'),
        new Uint8Array([1, 2, 3]),
        { contentType: 'image/png' },
      ),
    );

    const ownerStorage = authedStorage('owner-1');
    await assertFails(
      uploadBytes(
        ref(ownerStorage, 'reports/owner-1/report-text.txt'),
        new TextEncoder().encode('invalid'),
        { contentType: 'text/plain' },
      ),
    );
  });

  test('report reads are owner-or-admin only', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const storage = context.storage(getRulesBucket());
      await uploadBytes(
        ref(storage, 'reports/owner-2/report-read.png'),
        new Uint8Array([7, 8, 9]),
        { contentType: 'image/png' },
      );
    });

    const ownerStorage = authedStorage('owner-2');
    const adminStorage = authedStorage('admin-1', { admin: true });
    const strangerStorage = authedStorage('stranger-1');

    await assertSucceeds(getBytes(ref(ownerStorage, 'reports/owner-2/report-read.png')));
    await assertSucceeds(getBytes(ref(adminStorage, 'reports/owner-2/report-read.png')));
    await assertFails(getBytes(ref(strangerStorage, 'reports/owner-2/report-read.png')));
  });

  test('profile picture writes are owner-only and image-only', async () => {
    const ownerStorage = authedStorage('owner-3');
    const otherStorage = authedStorage('other-3');

    await assertSucceeds(
      uploadBytes(
        ref(ownerStorage, 'profile-pictures/owner-3/avatar.png'),
        new Uint8Array([3, 4, 5]),
        { contentType: 'image/png' },
      ),
    );

    await assertFails(
      uploadBytes(
        ref(otherStorage, 'profile-pictures/owner-3/avatar.png'),
        new Uint8Array([3, 4, 5]),
        { contentType: 'image/png' },
      ),
    );

    await assertFails(
      uploadBytes(
        ref(ownerStorage, 'profile-pictures/owner-3/avatar.txt'),
        new TextEncoder().encode('invalid'),
        { contentType: 'text/plain' },
      ),
    );
  });
});
