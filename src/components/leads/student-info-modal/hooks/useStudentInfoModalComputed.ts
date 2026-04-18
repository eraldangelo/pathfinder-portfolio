import { useMemo } from 'react';
import type { PersonnelWithDetails } from '../../../../data/personnel';
import { isAdminLikeRole, isDeveloperRole, isMarketingRole as isMarketingRoleByName, isOperationsLikeRole } from '../../../../utils/roles';
import type { User } from '../../../../types';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import {
    buildEndorsementOptions,
    getCanEditAdminTab,
    getCanEditConsultationTab,
    getCanCreateApplication,
    getIsActionAllowed,
    getIsMarketingRole,
    getVisibleTabs,
} from '../utils/studentInfoModalHelpers';

interface UseStudentInfoModalComputedParams {
    lead: Lead;
    user: User;
    userRole: string;
    allPersonnel: PersonnelWithDetails[];
}

export const useStudentInfoModalComputed = ({
    lead,
    user,
    userRole,
    allPersonnel,
}: UseStudentInfoModalComputedParams) => {
    const isAdminLike = isAdminLikeRole(userRole);
    const isSubmission = lead.isSubmission === true;
    const isArchivedLead = lead.isArchived === true;

    const endorsementOptions = useMemo(
        () => buildEndorsementOptions(allPersonnel, user.branch || lead.branch),
        [allPersonnel, lead.branch, user.branch]
    );

    const isMarketingUser = useMemo(() => getIsMarketingRole(userRole), [userRole]);

    const canEditAdminTab = useMemo(
        () => getCanEditAdminTab(userRole, isAdminLike),
        [isAdminLike, userRole]
    );

    const baseIsActionAllowed = useMemo(
        () => getIsActionAllowed(userRole, user, lead, isSubmission),
        [isSubmission, lead, user, userRole]
    );

    const isActionAllowed = useMemo(
        () => !isArchivedLead && baseIsActionAllowed,
        [baseIsActionAllowed, isArchivedLead]
    );

    const canCreateApplication = useMemo(
        () => getCanCreateApplication(userRole, user, lead),
        [lead, user, userRole]
    );

    const canEditConsultationTab = useMemo(
        () => getCanEditConsultationTab(userRole, user, lead),
        [lead, user, userRole]
    );

    const visibleTabs = useMemo(
        () => getVisibleTabs(userRole, isAdminLike, isMarketingUser),
        [isAdminLike, isMarketingUser, userRole]
    );

    const canEditCaseId = useMemo(() => {
        if (isMarketingRoleByName(userRole)) {
            return false;
        }
        if (isDeveloperRole(userRole) || isOperationsLikeRole(userRole) || isAdminLike) {
            return true;
        }
        if (isSubmission) {
            return true;
        }
        return canEditConsultationTab || baseIsActionAllowed;
    }, [baseIsActionAllowed, canEditConsultationTab, isAdminLike, isSubmission, userRole]);

    return {
        isAdminLike,
        isSubmission,
        endorsementOptions,
        canEditAdminTab,
        isActionAllowed,
        canCreateApplication,
        canEditConsultationTab,
        visibleTabs,
        canEditCaseId,
    };
};
