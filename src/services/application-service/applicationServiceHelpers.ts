import type { SchoolCourses } from '../../data/applications';
import type { Lead } from '../../components/leads/leads-page/LeadsPage';
import type { ApplicationData } from '../../components/leads/student-info-modal/StudentInfoModal';
import type { User } from '../../types';

const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();

const isRoleMatch = (roleValue: string, targetRole: string) => {
    const role = normalize(roleValue);
    return role === targetRole || role.startsWith(targetRole) || role.includes(targetRole);
};

export const getBranchKey = (branch?: string | null): 'manila' | 'davao' | 'cebu' | 'pampanga' | '' => {
    const normalized = normalize(branch);
    if (normalized.includes('manila')) return 'manila';
    if (normalized.includes('davao')) return 'davao';
    if (normalized.includes('cebu')) return 'cebu';
    if (normalized.includes('pampanga')) return 'pampanga';
    return '';
};

export const getApplicationNotificationTargetRole = (branchKey: ReturnType<typeof getBranchKey>) => {
    if (branchKey === 'manila' || branchKey === 'davao') return 'operations';
    if (branchKey === 'cebu' || branchKey === 'pampanga') return 'branch manager';
    return '';
};

export const buildApplicationStatusNoteSubject = (baseSubject: string, status: string) => {
    const cleanedBase = String(baseSubject || 'Application Status Update').trim().replace(/:+$/, '');
    const cleanedStatus = String(status || '').trim();
    return cleanedStatus ? `${cleanedBase}: ${cleanedStatus}` : cleanedBase;
};

export const isLeadAssignedToCurrentUserByName = (lead: Lead, user: User) => {
    const leadAssignedCounsellorName = String(lead.assignedCounsellor || '').trim();
    const currentUserName = String(user.displayName || '').trim();
    return (
        leadAssignedCounsellorName !== ''
        && currentUserName !== ''
        && normalize(leadAssignedCounsellorName) === normalize(currentUserName)
    );
};

export const resolveCaseIdFromArchives = async ({
    db,
    leadId,
    currentCaseId,
}: {
    db: any;
    leadId: string;
    currentCaseId: string;
}) => {
    let resolvedCaseId = String(currentCaseId || '').trim();
    if (resolvedCaseId) return resolvedCaseId;

    const archiveYearsSnapshot = await db.collection('archives').get();
    const archiveYearIds = archiveYearsSnapshot.docs
        .map((doc: any) => String(doc.id || '').trim())
        .filter(Boolean)
        .sort((a: string, b: string) => Number(b) - Number(a));

    for (const archiveYearId of archiveYearIds) {
        const archivedLeadSnapshot = await db
            .collection('archives')
            .doc(archiveYearId)
            .collection('leads')
            .doc(leadId)
            .get();
        const archivedCaseId = String(archivedLeadSnapshot.data?.()?.caseId || '').trim();
        if (!archivedCaseId) continue;
        resolvedCaseId = archivedCaseId;
        break;
    }

    return resolvedCaseId;
};

export const buildRootLeadHydrationPayload = ({
    lead,
    rootLeadSnapshotExists,
    rootLeadData,
    resolvedAssignedCounsellorName,
    resolvedAssignedCounsellorUid,
    resolvedCaseId,
    user,
}: {
    lead: Lead;
    rootLeadSnapshotExists: boolean;
    rootLeadData: Record<string, unknown>;
    resolvedAssignedCounsellorName: string;
    resolvedAssignedCounsellorUid: string;
    resolvedCaseId: string;
    user: User;
}) => {
    const fallbackNow = new Date();
    const fallbackFullName =
        String(lead.fullName || '').trim()
        || [lead.firstName, lead.middleName, lead.lastName].filter(Boolean).join(' ').trim()
        || 'Unknown';

    return {
        fullName: fallbackFullName,
        firstName: String(lead.firstName || '').trim(),
        middleName: String(lead.middleName || '').trim(),
        lastName: String(lead.lastName || '').trim(),
        email: String(lead.email || '').trim(),
        phoneCountryCode: String(lead.phoneCountryCode || '').trim(),
        phoneNumber: String(lead.phoneNumber || '').trim(),
        dob: String(lead.dob || '').trim(),
        citizenship: String(lead.citizenship || 'Philippines').trim(),
        visaRefusal: lead.visaRefusal || 'No',
        branch: String(lead.branch || user.branch || '').trim(),
        assignedCounsellor: resolvedAssignedCounsellorName || null,
        assignedCounsellorUid: resolvedAssignedCounsellorUid || null,
        caseId: resolvedCaseId,
        leadStatus: lead.leadStatus || 'New Lead',
        submittedAt: lead.submittedAt || fallbackNow,
        createdAt: lead.submittedAt || fallbackNow,
        isArchived: rootLeadSnapshotExists ? Boolean((rootLeadData || {}).isArchived) : true,
        archivedReason: rootLeadSnapshotExists
            ? (((rootLeadData || {}).archivedReason as string | null) || null)
            : 'archive-rollover-link',
    };
};

export const formatApplicationDate = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

export const formatApplicationIntakeDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    if (dateString.match(/^\\d{4}-\\d{2}$/)) {
        const [year, month] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const m = date.toLocaleString('en-US', { month: 'short' });
        return `${m}-${date.getFullYear()}`;
    }
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day || 1);
    return formatApplicationDate(date);
};

export const buildSchoolCourses = (data: ApplicationData): SchoolCourses[] =>
    data.schools.map((schoolName) => ({
        schoolName,
        courses: data.programsBySchool[schoolName]
            .filter((p) => p.name.trim() !== '')
            .map((p) => ({
                programName: p.name,
                intakeDate: p.intakeDate ? formatApplicationIntakeDate(p.intakeDate) : 'N/A',
                courseEndDate: p.intakeDate ? formatApplicationIntakeDate(p.intakeDate) : 'N/A',
            })),
    }));

export const resolveApplicationNotificationRecipients = async ({
    db,
    branch,
    user,
    assignedCounsellorUid,
}: {
    db: any;
    branch: string;
    user: User;
    assignedCounsellorUid: string;
}) => {
    const branchKey = getBranchKey(branch || user.branch || '');
    const targetRole = getApplicationNotificationTargetRole(branchKey);
    const recipientUids = new Set<string>();
    const skipSubmitterSelfNotification =
        Boolean(user.uid) && assignedCounsellorUid !== '' && assignedCounsellorUid === user.uid;

    if (assignedCounsellorUid) {
        recipientUids.add(assignedCounsellorUid);
    } else if (user.uid) {
        recipientUids.add(user.uid);
    }

    if (targetRole) {
        try {
            const personnelSnapshot = await db.collection('personnel').get();
            personnelSnapshot.docs.forEach((doc: any) => {
                const personnel = doc.data() || {};
                const personnelBranchKey = getBranchKey(personnel.branch);
                if (personnelBranchKey !== branchKey) return;
                if (!isRoleMatch(String(personnel.role || ''), targetRole)) return;
                if (skipSubmitterSelfNotification && doc.id === user.uid) return;
                recipientUids.add(doc.id);
            });
        } catch (recipientError) {
            console.error('Error resolving application notification recipients:', recipientError);
        }
    }

    if (skipSubmitterSelfNotification && user.uid) {
        recipientUids.delete(user.uid);
    }

    return recipientUids;
};
