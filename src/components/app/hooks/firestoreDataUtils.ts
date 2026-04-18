import type { ApplicationInfo } from '../../../data/applications';
import type { AssessmentSubmission, FirebaseTimestamp, User } from '../../../types';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import { buildFirestoreQueryConfig, type FirestoreQueryConfig } from './firestoreDataQueryConfig';
import { normalizeCanonicalBranchKey } from '../../../utils/branchCanonicalization';

export const isAssessmentSubmissionDoc = (data: Record<string, unknown>) =>
    Object.prototype.hasOwnProperty.call(data, 'emailAddress') ||
    Object.prototype.hasOwnProperty.call(data, 'mobileNumber') ||
    Object.prototype.hasOwnProperty.call(data, 'referredStaffBranch') ||
    Object.prototype.hasOwnProperty.call(data, 'studyDestinations');

export const getTimestampMillis = (value: unknown) => {
    if (!value) return 0;
    if (typeof (value as FirebaseTimestamp).toMillis === 'function') {
        return (value as FirebaseTimestamp).toMillis();
    }
    if (value instanceof Date) {
        return value.getTime();
    }
    return 0;
};

export const normalizeBranch = (value?: string | null) => normalizeCanonicalBranchKey(value);

export const sortLeadsByCaseId = (items: Lead[]) =>
    [...items].sort((a, b) =>
        String(b.caseId ?? '').localeCompare(String(a.caseId ?? ''), undefined, {
            numeric: true,
            sensitivity: 'base',
        })
    );

const splitFullName = (fullName: string) => {
    const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
    if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
    return {
        firstName: parts[0],
        middleName: parts.slice(1, -1).join(' '),
        lastName: parts[parts.length - 1],
    };
};

const toDateValue = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof (value as FirebaseTimestamp).toDate === 'function') {
        const parsed = (value as FirebaseTimestamp).toDate();
        return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
};

const toCommaSeparatedText = (value: unknown) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item ?? '').trim())
            .filter(Boolean)
            .join(', ');
    }
    return String(value ?? '').trim();
};

export const normalizeLeadDoc = (doc: any): Lead => {
    const fullNameRaw = String(doc?.fullName ?? '').trim();
    const nameParts = splitFullName(fullNameRaw);
    const firstName = String(doc?.firstName ?? '').trim() || nameParts.firstName || fullNameRaw || 'Unknown';
    const middleName = String(doc?.middleName ?? '').trim() || nameParts.middleName || '';
    const lastName = String(doc?.lastName ?? '').trim() || nameParts.lastName || '';
    const fullName = fullNameRaw || [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || 'Unknown';
    const createdAt = toDateValue(doc?.createdAt);
    const submittedAt = toDateValue(doc?.submittedAt) || createdAt;
    const studyDestinations = toCommaSeparatedText(doc?.studyDestinations);
    const preferredCoursesOfStudy = toCommaSeparatedText(doc?.preferredCoursesOfStudy);

    return {
        ...doc,
        leadDocPath: String(doc?.leadDocPath || '').trim() || `leads/${String(doc?.id || '').trim()}`,
        fullName,
        firstName,
        middleName,
        lastName,
        studyDestinations,
        preferredCoursesOfStudy,
        submittedAt,
    } as Lead;
};

export const mapLeadSnapshot = (snapshot: any) =>
    snapshot.docs
        .map((doc: any) => ({ ...(doc.data() || {}), id: doc.id }))
        .filter((doc: any) => doc?.isArchived !== true)
        .filter((doc: any) => !isAssessmentSubmissionDoc(doc))
        .map((doc: any) => normalizeLeadDoc(doc));

export const mapAssessmentSubmissionSnapshot = (snapshot: any) =>
    snapshot.docs
        .map((doc: any) => ({ ...(doc.data() || {}), id: doc.id }))
        .filter((doc: any) => doc?.isArchived !== true)
        .filter((doc: any) => isAssessmentSubmissionDoc(doc))
        .map((doc: any) => doc as AssessmentSubmission);

export const sortByCreatedAtDesc = <T extends { createdAt?: FirebaseTimestamp | Date | null }>(items: T[]) =>
    [...items].sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));

export const mapApplicationSnapshot = ({
    snapshot,
    branchFilter,
    shouldFilterApplicationsByCounsellor,
    user,
}: {
    snapshot: any;
    branchFilter: string | null;
    shouldFilterApplicationsByCounsellor: boolean;
    user: User;
}) => {
    const applicationDocs = snapshot.docs
        .filter((doc: any) => {
            const docPath = String(doc.ref?.path ?? '');
            return docPath.startsWith('leads/') || docPath.startsWith('archives/');
        })
        .filter((doc: any) => {
            const data = doc.data?.() || {};
            return data?.isArchived !== true;
        })
        .filter((doc: any) => {
            if (branchFilter) {
                const branchValue = normalizeBranch(String(doc.data?.()?.branch ?? ''));
                if (!branchValue || branchValue !== normalizeBranch(branchFilter)) {
                    return false;
                }
            }

            if (!shouldFilterApplicationsByCounsellor) return true;
            const data = doc.data?.() || {};
            const createdByUid = String(data?.createdByUid ?? '').trim();
            const currentUserUid = String(user.uid ?? '').trim();
            if (createdByUid && currentUserUid) {
                return createdByUid === currentUserUid;
            }

            const createdBy = String(data?.createdBy ?? '').trim().toLowerCase();
            const currentUserDisplayName = String(user.displayName ?? '').trim().toLowerCase();
            return createdBy !== '' && createdBy === currentUserDisplayName;
        });

    const dedupedByKey = new Map<string, any>();
    applicationDocs.forEach((doc: any) => {
        const data = doc.data?.() || {};
        const key = `${String(data.studentId || '').trim()}::${String(doc.id || '').trim()}`;
        const existing = dedupedByKey.get(key);
        if (!existing) {
            dedupedByKey.set(key, doc);
            return;
        }

        const incomingPath = String(doc.ref?.path ?? '').trim();
        const existingPath = String(existing.ref?.path ?? '').trim();
        const incomingIsArchive = incomingPath.startsWith('archives/');
        const existingIsArchive = existingPath.startsWith('archives/');

        if (incomingIsArchive && !existingIsArchive) {
            dedupedByKey.set(key, doc);
            return;
        }

        if (incomingIsArchive === existingIsArchive) {
            const existingData = existing.data?.() || {};
            const incomingLatestMillis =
                getTimestampMillis(data.statusChanged)
                || getTimestampMillis(Array.isArray(data.history) ? data.history[0]?.date : null);
            const existingLatestMillis =
                getTimestampMillis(existingData.statusChanged)
                || getTimestampMillis(Array.isArray(existingData.history) ? existingData.history[0]?.date : null);
            if (incomingLatestMillis > existingLatestMillis) {
                dedupedByKey.set(key, doc);
            }
        }
    });

    return Array.from(dedupedByKey.values()).map((doc: any) => {
        const rawData = { ...(doc.data() || {}) } as Partial<ApplicationInfo> & {
            history?: ApplicationInfo['history'];
        };
        const leadDocPath =
            String(rawData.leadDocPath || '').trim()
            || String(doc.ref?.parent?.parent?.path || '').trim()
            || `leads/${String(rawData.studentId || '').trim()}`;
        const normalizedHistory = Array.isArray(rawData.history)
            ? [...rawData.history].sort(
                (a, b) => getTimestampMillis(b?.date) - getTimestampMillis(a?.date),
            )
            : [];
        const latestHistoryEntry = normalizedHistory[0];
        const derivedStatus = String(
            rawData.status || latestHistoryEntry?.status || 'Submitted Application',
        ).trim();
        const derivedStatusChanged =
            rawData.statusChanged || latestHistoryEntry?.date || null;

        return {
            ...rawData,
            id: doc.id,
            leadDocPath,
            status: derivedStatus as ApplicationInfo['status'],
            statusChanged: derivedStatusChanged as ApplicationInfo['statusChanged'],
            history: normalizedHistory,
        } as ApplicationInfo;
    });
};

export { buildFirestoreQueryConfig };
