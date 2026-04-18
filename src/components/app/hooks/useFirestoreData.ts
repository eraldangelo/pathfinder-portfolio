import { useEffect, useState } from 'react';
import { db } from '../../../services/firebase';
import type { ApplicationInfo } from '../../../data/applications';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { AssessmentSubmission, User } from '../../../types';
import {
    buildFirestoreQueryConfig,
    mapApplicationSnapshot,
    mapAssessmentSubmissionSnapshot,
    mapLeadSnapshot,
    sortByCreatedAtDesc,
    sortLeadsByCaseId,
} from './firestoreDataUtils';

interface UseFirestoreDataParams {
    user: User | null;
    userRole: string | null;
}

export const useFirestoreData = ({ user, userRole }: UseFirestoreDataParams) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [applications, setApplications] = useState<ApplicationInfo[]>([]);
    const [allPersonnel, setAllPersonnel] = useState<PersonnelWithDetails[]>([]);
    const [assessmentSubmissions, setAssessmentSubmissions] = useState<AssessmentSubmission[]>([]);
    const [genuineSubmissionIds, setGenuineSubmissionIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user || !userRole) return;
        let isDisposed = false;
        let statusComputationVersion = 0;

        const queryConfig = buildFirestoreQueryConfig({ db, user, userRole });
        if (!queryConfig) {
            setLeads([]);
            setApplications([]);
            setAllPersonnel([]);
            setAssessmentSubmissions([]);
            setGenuineSubmissionIds(new Set());
            return;
        }
        const {
            leadsQuery,
            applicationsQuery,
            submissionsQuery,
            shouldSortLeadsByCaseId,
            shouldSortSubmissionsByCreatedAt,
            shouldFilterApplicationsByCounsellor,
            shouldReadApplications,
            applicationsBranchClientFilter,
        } = queryConfig;

        const leadsUnsubscribe = leadsQuery.onSnapshot(
            (snapshot: any) => {
                const leadsData = mapLeadSnapshot(snapshot);
                if (shouldSortLeadsByCaseId) {
                    setLeads(sortLeadsByCaseId(leadsData));
                    return;
                }
                setLeads(leadsData);
            },
            (err: any) => console.error('Error fetching leads:', err)
        );

        const handleApplicationsSnapshot = (snapshot: any, branchFilter: string | null) => {
            const appsData = mapApplicationSnapshot({
                snapshot,
                branchFilter,
                shouldFilterApplicationsByCounsellor,
                user,
            });
            setApplications(appsData);
        };

        const applicationsUnsubscribe = shouldReadApplications
            ? applicationsQuery.onSnapshot(
                  (snapshot: any) => {
                      handleApplicationsSnapshot(snapshot, applicationsBranchClientFilter);
                  },
                  (err: any) => console.error('Error fetching applications:', err)
              )
            : () => {};
        if (!shouldReadApplications) {
            setApplications([]);
        }

        const normalizeStatusValue = (value: unknown) => String(value ?? '').trim().toLowerCase();
        const adminStatusValues = new Set([
            'new lead',
            'no show',
            'no response',
            'undecided',
            'genuine',
            'non-genuine',
            'destination not offered',
            'duplicate',
        ]);

        const computeGenuineSubmissionIds = async (submissions: AssessmentSubmission[]) => {
            const requestVersion = ++statusComputationVersion;
            const genuineIds = new Set<string>();
            const submissionIdsForStatusLookup: string[] = [];

            submissions.forEach((submission) => {
                const submissionId = String(submission.id ?? '').trim();
                if (!submissionId) return;

                const adminStatus = normalizeStatusValue((submission as { adminStatus?: unknown }).adminStatus);
                if (adminStatus === 'genuine') {
                    genuineIds.add(submissionId);
                    return;
                }
                if (adminStatus) {
                    return;
                }

                submissionIdsForStatusLookup.push(submissionId);
            });

            if (!submissionIdsForStatusLookup.length) {
                if (!isDisposed && requestVersion === statusComputationVersion) {
                    setGenuineSubmissionIds(genuineIds);
                }
                return;
            }

            const lookupResults = await Promise.all(
                submissionIdsForStatusLookup.map(async (submissionId) => {
                    try {
                        const snapshot = await db
                            .collection('leads')
                            .doc(submissionId)
                            .collection('status')
                            .orderBy('timestamp', 'desc')
                            .limit(20)
                            .get();

                        const statusDocs = snapshot.docs ?? [];
                        const latestAdminStatusDoc = statusDocs.find((doc: any) => {
                            const data = doc.data?.() || {};
                            const sourceValue = normalizeStatusValue(data?.source);
                            const statusValue = normalizeStatusValue(data?.status);
                            const isLegacyAdminStatus = !sourceValue && adminStatusValues.has(statusValue);
                            return sourceValue === 'admin' || isLegacyAdminStatus;
                        });
                        const latestStatus = latestAdminStatusDoc?.data?.();
                        return normalizeStatusValue(latestStatus?.status) === 'genuine' ? submissionId : null;
                    } catch (error) {
                        console.error(`Error fetching status for assessment submission ${submissionId}:`, error);
                        return null;
                    }
                })
            );

            if (isDisposed || requestVersion !== statusComputationVersion) return;

            lookupResults.forEach((submissionId) => {
                if (submissionId) {
                    genuineIds.add(submissionId);
                }
            });
            setGenuineSubmissionIds(genuineIds);
        };

        const submissionsUnsubscribe = submissionsQuery.onSnapshot(
            (snapshot: any) => {
                const submissionsData = mapAssessmentSubmissionSnapshot(snapshot);
                const mappedSubmissions = shouldSortSubmissionsByCreatedAt
                    ? sortByCreatedAtDesc(submissionsData)
                    : submissionsData;
                setAssessmentSubmissions(mappedSubmissions);
                void computeGenuineSubmissionIds(mappedSubmissions).catch((error) => {
                    console.error('Error computing genuine submission ids:', error);
                });
            },
            (err: any) => console.error('Error fetching submissions from leads:', err)
        );

        const personnelUnsubscribe = db.collection('personnel').onSnapshot(
            (snapshot: any) => {
                const personnelData = snapshot.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() } as PersonnelWithDetails));
                setAllPersonnel(personnelData);
            },
            (err: any) => console.error('Error fetching personnel:', err)
        );

        return () => {
            isDisposed = true;
            statusComputationVersion += 1;
            leadsUnsubscribe();
            applicationsUnsubscribe();
            submissionsUnsubscribe();
            personnelUnsubscribe();
        };
    }, [user, userRole]);

    return { leads, applications, allPersonnel, assessmentSubmissions, genuineSubmissionIds };
};


