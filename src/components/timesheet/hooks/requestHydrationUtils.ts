import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

type PersonnelCacheEntry = {
  name: string | null;
  branch: string | null;
  role: string | null;
};

type BaseRequestItem = {
  id: string;
  ownerId?: string | null;
  requesterName?: string | null;
  requesterBranch?: string | null;
  requesterRole?: string | null;
};

interface CreateRequesterHydratorOptions<T extends BaseRequestItem> {
  db: any;
  cacheRef: MutableRefObject<Map<string, PersonnelCacheEntry>>;
  requestCollectionName: 'leaveRequests' | 'offsetRequests';
  setRequests: Dispatch<SetStateAction<T[]>>;
  hydrateErrorMessage: string;
  backfillErrorMessage: string;
}

export const createRequesterHydrator = <T extends BaseRequestItem>({
  db,
  cacheRef,
  requestCollectionName,
  setRequests,
  hydrateErrorMessage,
  backfillErrorMessage,
}: CreateRequesterHydratorOptions<T>) => {
  return async (items: T[]) => {
    if (!db) return;

    const missingOwnerIds = Array.from(
      new Set(
        items
          .filter((item) => item.ownerId && (!item.requesterName || !item.requesterBranch))
          .map((item) => item.ownerId as string)
      )
    ).filter((ownerId) => !cacheRef.current.has(ownerId));

    if (!missingOwnerIds.length) return;

    try {
      const snapshots = await Promise.all(
        missingOwnerIds.map((ownerId) => db.collection('personnel').doc(ownerId).get())
      );

      snapshots.forEach((snap) => {
        if (!snap.exists) return;
        const data = snap.data() || {};
        const name = data.name ?? null;
        const branch = data.branch ?? null;
        const role = data.role ?? null;
        if (snap.id) {
          cacheRef.current.set(snap.id, { name, branch, role });
        }
      });

      setRequests((prev) =>
        prev.map((request) => {
          if (!request.ownerId) return request;
          const cached = cacheRef.current.get(request.ownerId);
          if (!cached) return request;

          const nextRequest = {
            ...request,
            requesterName: request.requesterName ?? cached.name,
            requesterBranch: request.requesterBranch ?? cached.branch,
            requesterRole: request.requesterRole ?? cached.role,
          };

          if (
            (!request.requesterName || !request.requesterBranch || !request.requesterRole) &&
            (cached.name || cached.branch || cached.role)
          ) {
            db.collection('personnel')
              .doc(request.ownerId)
              .collection(requestCollectionName)
              .doc(request.id)
              .set(
                {
                  requesterName: cached.name ?? request.requesterName ?? null,
                  requesterBranch: cached.branch ?? request.requesterBranch ?? null,
                  requesterRole: cached.role ?? request.requesterRole ?? null,
                },
                { merge: true }
              )
              .catch((err: any) => console.error(backfillErrorMessage, err));
          }

          return nextRequest;
        })
      );
    } catch (err) {
      console.error(hydrateErrorMessage, err);
    }
  };
};

export const sortByCreatedAtDesc = <T extends { createdAt: Date | null }>(items: T[]) =>
  [...items].sort((a, b) => {
    const aTime = a.createdAt ? a.createdAt.getTime() : 0;
    const bTime = b.createdAt ? b.createdAt.getTime() : 0;
    return bTime - aTime;
  });
