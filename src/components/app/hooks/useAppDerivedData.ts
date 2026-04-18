import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../../../services/firebase';
import type { ApplicationInfo } from '../../../data/applications';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { AssessmentSubmission } from '../../../types';
import { mapAssessmentSubmissionToLeadRow } from '../../leads/leads-page/assessmentSubmissionUtils';
import { isAssessmentSubmissionDoc, normalizeLeadDoc } from './firestoreDataUtils';
import { resolveLeadDocPath } from '../../../utils/leadDocPath';
import { fetchArchivedLeadSnapshot, leadProfileScore } from './useAppDerivedDataHelpers';

interface UseAppDerivedDataParams {
    selectedApplicationId: string | null;
    applications: ApplicationInfo[];
    leads: Lead[];
    assessmentSubmissions: AssessmentSubmission[];
    allPersonnel: Array<{ uid?: string | null; name?: string | null; role?: string | null }>;
    openStudentModalId: string | null;
    openStudentModalPath?: string | null;
}

export const useAppDerivedData = ({
    selectedApplicationId,
    applications,
    leads,
    assessmentSubmissions,
    allPersonnel,
    openStudentModalId,
    openStudentModalPath,
}: UseAppDerivedDataParams) => {
    const [cachedLeadsById, setCachedLeadsById] = useState<Map<string, Lead>>(new Map());

    const mapSnapshotToLead = useCallback((snapshot: any, fallbackLeadId: string) => {
        const snapshotPath = String(snapshot?.ref?.path || '').trim();
        const rawData = {
            ...(snapshot?.data?.() || {}),
            id: fallbackLeadId,
            leadDocPath: snapshotPath || resolveLeadDocPath(fallbackLeadId),
        };

        // Archived lead snapshots should behave like canonical lead docs.
        if (snapshotPath.startsWith('archives/')) {
            return normalizeLeadDoc(rawData);
        }

        return isAssessmentSubmissionDoc(rawData as Record<string, unknown>)
            ? mapAssessmentSubmissionToLeadRow(rawData as AssessmentSubmission, allPersonnel)
            : normalizeLeadDoc(rawData);
    }, [allPersonnel]);


    const submissionLeadsById = useMemo(() => {
        return new Map(
            assessmentSubmissions.map((submission) => [submission.id, mapAssessmentSubmissionToLeadRow(submission, allPersonnel)])
        );
    }, [allPersonnel, assessmentSubmissions]);

    const openApplication = useMemo(() => {
        if (!selectedApplicationId) return null;
        return applications.find((app) => app.id === selectedApplicationId) || null;
    }, [selectedApplicationId, applications]);

    const openLeadForApplication = useMemo(() => {
        if (!openApplication) return null;
        return (
            leads.find((lead) => lead.id === openApplication.studentId)
            || submissionLeadsById.get(openApplication.studentId)
            || cachedLeadsById.get(openApplication.studentId)
            || null
        );
    }, [cachedLeadsById, openApplication, leads, submissionLeadsById]);

    useEffect(() => {
        if (!openApplication) return;
        if (openLeadForApplication) return;

        const leadId = String(openApplication.studentId || '').trim();
        if (!leadId) return;

        let isActive = true;
        const loadLeadForApplication = async () => {
            const preferredLeadPath = String((openApplication as { leadDocPath?: string | null }).leadDocPath || '').trim();
            let snapshot: any = null;

            if (preferredLeadPath) {
                try {
                    const preferredSnapshot = await db.doc(preferredLeadPath).get();
                    if (preferredSnapshot.exists) {
                        snapshot = preferredSnapshot;
                    }
                } catch (preferredPathError) {
                    console.error(`Error fetching application lead by path ${preferredLeadPath}:`, preferredPathError);
                }
            }

            if (!snapshot) {
                const rootSnapshot = await db.collection('leads').doc(leadId).get();
                if (rootSnapshot.exists) {
                    snapshot = rootSnapshot;
                } else {
                    snapshot = await fetchArchivedLeadSnapshot(db, leadId);
                }
            }

            if (!isActive || !snapshot?.exists) return;

            const mappedLead = mapSnapshotToLead(snapshot, leadId);
            setCachedLeadsById((prev) => {
                const next = new Map(prev);
                next.set(leadId, mappedLead);
                return next;
            });
        };

        loadLeadForApplication().catch((error: unknown) => {
            console.error(`Error fetching lead for application ${String(openApplication.id || '').trim()}:`, error);
        });

        return () => {
            isActive = false;
        };
    }, [mapSnapshotToLead, openApplication, openLeadForApplication]);

    const openStudentLead = useMemo(() => {
        if (!openStudentModalId) return null;
        const requestedPath = String(openStudentModalPath || '').trim();
        if (requestedPath) {
            const matchesRequestedPath = (candidate: Lead | null | undefined) =>
                Boolean(candidate && String(candidate.leadDocPath || '').trim() === requestedPath);
            const submissionCandidate = submissionLeadsById.get(openStudentModalId);
            const cachedCandidate = cachedLeadsById.get(openStudentModalId);

            return (
                leads.find((lead) => lead.id === openStudentModalId && matchesRequestedPath(lead))
                || (matchesRequestedPath(submissionCandidate) ? submissionCandidate || null : null)
                || (matchesRequestedPath(cachedCandidate) ? cachedCandidate || null : null)
                || null
            );
        }

        return (
            leads.find((lead) => lead.id === openStudentModalId)
            || submissionLeadsById.get(openStudentModalId)
            || cachedLeadsById.get(openStudentModalId)
            || null
        );
    }, [cachedLeadsById, openStudentModalId, openStudentModalPath, leads, submissionLeadsById]);

    useEffect(() => {
        if (!openStudentModalId) {
            return;
        }

        const requestedPath = String(openStudentModalPath || '').trim();
        const openLeadPath = String(openStudentLead?.leadDocPath || '').trim();
        if (openStudentLead && (!requestedPath || openLeadPath === requestedPath)) {
            return;
        }

        let isActive = true;
        const loadLead = async () => {
            let requestedSnapshot: any = null;
            if (requestedPath) {
                try {
                    requestedSnapshot = await db.doc(requestedPath).get();
                } catch (requestedPathError) {
                    console.error(`Error fetching lead by path ${requestedPath}:`, requestedPathError);
                }
            }

            const rootSnapshot = await db.collection('leads').doc(openStudentModalId).get();
            const rootScore = rootSnapshot.exists ? leadProfileScore(rootSnapshot.data?.()) : -1;
            const shouldCheckArchive = !rootSnapshot.exists || rootScore < 3 || Boolean(requestedPath);
            const archivedSnapshot = shouldCheckArchive
                ? await fetchArchivedLeadSnapshot(db, openStudentModalId)
                : null;
            const archivedScore = archivedSnapshot?.exists ? leadProfileScore(archivedSnapshot.data?.()) : -1;

            const resolvedSnapshot =
                requestedSnapshot?.exists
                    ? requestedSnapshot
                    : archivedScore > rootScore
                        ? archivedSnapshot
                        : (rootSnapshot.exists ? rootSnapshot : archivedSnapshot);

            if (!isActive || !resolvedSnapshot?.exists) {
                return;
            }

            const mappedLead = mapSnapshotToLead(resolvedSnapshot, openStudentModalId);
            setCachedLeadsById((prev) => {
                const next = new Map(prev);
                next.set(openStudentModalId, mappedLead);
                return next;
            });
        };

        loadLead()
            .catch((error: unknown) => {
                console.error(`Error fetching lead ${openStudentModalId}:`, error);
            });

        return () => {
            isActive = false;
        };
    }, [mapSnapshotToLead, openStudentLead, openStudentModalId, openStudentModalPath]);

    const applicationsForOpenStudent = useMemo(() => {
        if (!openStudentModalId) return [];
        return applications.filter((app) => app.studentId === openStudentModalId || app.subId === openStudentModalId);
    }, [openStudentModalId, applications]);

    return {
        openApplication,
        openLeadForApplication,
        openStudentLead,
        applicationsForOpenStudent,
        submissionLeadsById,
        cachedLeadsById,
    };
};

