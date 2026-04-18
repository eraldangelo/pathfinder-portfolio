type AdminAuthLike = {
  deleteUser: (uid: string) => Promise<unknown>;
};

type PersonnelDocSnapshotLike = {
  exists: boolean;
};

type PersonnelDocRefLike = {
  get: () => Promise<PersonnelDocSnapshotLike>;
  set: (value: Record<string, unknown>, options?: { merge?: boolean }) => Promise<unknown>;
  delete: () => Promise<unknown>;
};

type AdminDbLike = {
  collection: (name: string) => {
    doc: (id: string) => PersonnelDocRefLike;
  };
};

type DeletePersonnelParams = {
  adminAuth: AdminAuthLike;
  adminDb: AdminDbLike;
  targetUid: string;
  requestedByUid: string;
};

type DeletePersonnelFailureReason = 'auth-delete-failed' | 'firestore-delete-failed';

export type DeletePersonnelResult =
  | {
      ok: true;
      authAlreadyMissing: boolean;
      personnelPreviouslyExisted: boolean;
    }
  | {
      ok: false;
      reason: DeletePersonnelFailureReason;
      error: unknown;
    };

const getErrorCode = (error: unknown) =>
  String((error as { code?: unknown } | null)?.code || '').trim().toLowerCase();

export const isAuthUserNotFoundError = (error: unknown) => {
  const code = getErrorCode(error);
  return code === 'auth/user-not-found';
};

const buildDeletionState = (
  status: string,
  requestedByUid: string,
  extra?: Record<string, unknown>,
) => ({
  status,
  requestedByUid,
  updatedAt: new Date(),
  ...extra,
});

export const deletePersonnelIdentity = async ({
  adminAuth,
  adminDb,
  targetUid,
  requestedByUid,
}: DeletePersonnelParams): Promise<DeletePersonnelResult> => {
  const personnelRef = adminDb.collection('personnel').doc(targetUid);
  const personnelSnap = await personnelRef.get();
  const personnelPreviouslyExisted = personnelSnap.exists;

  // Tombstone the deletion intent before mutating Auth so partial failures stay visible and recoverable.
  await personnelRef.set(
    {
      deletionState: buildDeletionState('pending-auth-delete', requestedByUid),
    },
    { merge: true },
  );

  let authAlreadyMissing = false;
  try {
    await adminAuth.deleteUser(targetUid);
  } catch (error) {
    if (isAuthUserNotFoundError(error)) {
      authAlreadyMissing = true;
    } else {
      await personnelRef.set(
        {
          deletionState: buildDeletionState('auth-delete-failed', requestedByUid, {
            lastErrorCode: getErrorCode(error) || null,
            lastErrorMessage: String((error as { message?: unknown } | null)?.message || '').slice(0, 500) || null,
            lastErrorAt: new Date(),
          }),
        },
        { merge: true },
      );
      return {
        ok: false,
        reason: 'auth-delete-failed',
        error,
      };
    }
  }

  try {
    await personnelRef.delete();
    return {
      ok: true,
      authAlreadyMissing,
      personnelPreviouslyExisted,
    };
  } catch (error) {
    try {
      await personnelRef.set(
        {
          deletionState: buildDeletionState('auth-deleted-firestore-cleanup-required', requestedByUid, {
            lastErrorCode: getErrorCode(error) || null,
            lastErrorMessage: String((error as { message?: unknown } | null)?.message || '').slice(0, 500) || null,
            lastErrorAt: new Date(),
          }),
        },
        { merge: true },
      );
    } catch {
      // noop: keep original delete failure context
    }

    return {
      ok: false,
      reason: 'firestore-delete-failed',
      error,
    };
  }
};
