export type TimestampLike = {
    toDate?: () => Date;
    toMillis?: () => number;
    seconds?: number;
    nanoseconds?: number;
};

export const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

export const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;

    const timestampLike = value as TimestampLike;
    if (typeof timestampLike.toDate === 'function') {
        try {
            return timestampLike.toDate();
        } catch {
            return null;
        }
    }

    if (typeof timestampLike.toMillis === 'function') {
        const millis = timestampLike.toMillis();
        return Number.isFinite(millis) ? new Date(millis) : null;
    }

    if (
        typeof timestampLike.seconds === 'number'
        && typeof timestampLike.nanoseconds === 'number'
    ) {
        const millis = timestampLike.seconds * 1000 + Math.floor(timestampLike.nanoseconds / 1_000_000);
        return new Date(millis);
    }

    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getManilaYear = (baseDate = new Date()) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
    });
    return Number(formatter.format(baseDate));
};

export const isCompletedApplicationStatus = (status: unknown) =>
    normalize(String(status || '')) === 'application ended';

export const resolveLatestHistory = (history: unknown[]): any => {
    if (!Array.isArray(history) || !history.length) return null;
    return [...history].sort((a: any, b: any) => {
        const aMillis = toDate(a?.date)?.getTime() || 0;
        const bMillis = toDate(b?.date)?.getTime() || 0;
        return bMillis - aMillis;
    })[0] || null;
};

export const resolveApplicationCompletionDate = (appData: any): Date | null => {
    const history = Array.isArray(appData?.history) ? appData.history : [];
    const latestHistory = resolveLatestHistory(history) as any;

    if (isCompletedApplicationStatus(appData?.status)) {
        return toDate(appData?.statusChanged) || toDate(latestHistory?.date);
    }

    const completedEntries = history
        .filter((entry: any) => isCompletedApplicationStatus(entry?.status))
        .map((entry: any) => toDate(entry?.date))
        .filter((entryDate: Date | null): entryDate is Date => Boolean(entryDate))
        .sort((a: Date, b: Date) => b.getTime() - a.getTime());

    if (completedEntries.length) return completedEntries[0];
    return null;
};

export const resolveLeadBaseDate = (leadData: any): Date | null =>
    toDate(leadData?.submittedAt) || toDate(leadData?.createdAt) || null;

export const createBatchWriter = (adminDb: any, limit = 350) => {
    let batch = adminDb.batch();
    let pendingWrites = 0;

    const queueSet = (ref: any, payload: Record<string, unknown>) => {
        batch.set(ref, payload);
        pendingWrites += 1;
    };

    const queueMerge = (ref: any, payload: Record<string, unknown>) => {
        batch.set(ref, payload, { merge: true });
        pendingWrites += 1;
    };

    const queueDelete = (ref: any) => {
        batch.delete(ref);
        pendingWrites += 1;
    };

    const commitIfNeeded = async () => {
        if (pendingWrites < limit) return;
        await batch.commit();
        batch = adminDb.batch();
        pendingWrites = 0;
    };

    const flush = async () => {
        if (!pendingWrites) return;
        await batch.commit();
        batch = adminDb.batch();
        pendingWrites = 0;
    };

    return {
        queueSet,
        queueMerge,
        queueDelete,
        commitIfNeeded,
        flush,
    };
};
