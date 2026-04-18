import type { ApplicationInfo } from '../../../data/applications';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import { isConsultantLikeRole, isDeveloperRole } from '../../../utils/roles';
import type { ApplicationDetailUser } from '../types/ApplicationDetailTypes';

const normalizeIdentityText = (value?: string | null) =>
    String(value ?? '')
        .normalize('NFKC')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

interface ResolveActionAllowedParams {
    userRole: string;
    user: ApplicationDetailUser;
    lead: Lead;
    application: ApplicationInfo;
}

export const resolveApplicationActionAllowed = ({
    userRole,
    user,
    lead,
    application,
}: ResolveActionAllowedParams) => {
    if (isDeveloperRole(userRole)) {
        return true;
    }
    if (!isConsultantLikeRole(userRole)) {
        return false;
    }

    const currentUid = String(user.uid ?? '').trim();
    const uidCandidates = [
        String(lead.assignedCounsellorUid ?? '').trim(),
        String(application.assignedCounsellorUid ?? '').trim(),
        String(application.createdByUid ?? '').trim(),
    ].filter(Boolean);

    if (currentUid && uidCandidates.includes(currentUid)) {
        return true;
    }

    const currentDisplayName = normalizeIdentityText(user.displayName);
    if (!currentDisplayName) {
        return false;
    }

    const nameCandidates = [
        lead.assignedCounsellor,
        application.assignedCounsellor,
        application.createdBy,
    ]
        .map((name) => normalizeIdentityText(name))
        .filter(Boolean);

    return nameCandidates.includes(currentDisplayName);
};
