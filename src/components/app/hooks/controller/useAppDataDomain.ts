import { useMemo } from 'react';
import { useFirestoreData } from '../useFirestoreData';
import { useAppDerivedData } from '../useAppDerivedData';
import type { User } from '../../../../types';
import type { StudentInfoTab } from '../../../leads/types/studentInfoTab';

interface UseAppDataDomainParams {
    user: User | null;
    userRole: string | null;
    selectedApplicationId: string | null;
    openStudentModalId: string | null;
    openStudentModalPath: string | null;
    minimizedStudentModals: string[];
    modalInitialTab?: StudentInfoTab;
}

export const useAppDataDomain = ({
    user,
    userRole,
    selectedApplicationId,
    openStudentModalId,
    openStudentModalPath,
    minimizedStudentModals,
    modalInitialTab,
}: UseAppDataDomainParams) => {
    const { leads, applications, allPersonnel, assessmentSubmissions, genuineSubmissionIds } = useFirestoreData({
        user,
        userRole,
    });
    const {
        openApplication,
        openLeadForApplication,
        openStudentLead,
        applicationsForOpenStudent,
        submissionLeadsById,
        cachedLeadsById,
    } = useAppDerivedData({
        selectedApplicationId,
        applications,
        leads,
        assessmentSubmissions,
        allPersonnel,
        openStudentModalId,
        openStudentModalPath,
    });

    const minimizedLeads = useMemo(
        () =>
            minimizedStudentModals.map(
                (id) =>
                    leads.find((lead) => lead.id === id)
                    || submissionLeadsById.get(id)
                    || cachedLeadsById.get(id)
            ),
        [cachedLeadsById, leads, minimizedStudentModals, submissionLeadsById]
    );

    const appData = {
        leads,
        assessmentSubmissions,
        genuineSubmissionIds,
        applications,
        allPersonnel,
        openApplication,
        openLeadForApplication,
        openStudentLead,
        openStudentModalId,
        applicationsForOpenStudent,
        minimizedLeads,
        modalInitialTab,
    };

    return {
        leads,
        applications,
        allPersonnel,
        assessmentSubmissions,
        genuineSubmissionIds,
        openApplication,
        openLeadForApplication,
        openStudentLead,
        applicationsForOpenStudent,
        minimizedLeads,
        appData,
    };
};
