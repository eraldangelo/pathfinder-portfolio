import type { AssessmentSubmission } from '../../../types';
import type { AdminStatus, ConsultationStatus, LeadRow } from './LeadsPageTypes';

type PersonnelLookupItem = {
    uid?: string | null;
    name?: string | null;
    role?: string | null;
};

const ADMIN_STATUS_OPTIONS: AdminStatus[] = [
    'New Lead',
    'No Show',
    'No Response',
    'Undecided',
    'Genuine',
    'Non-Genuine',
    'Destination Not Offered',
    'Duplicate',
];

const normalizeAdminStatus = (value?: string | null): AdminStatus => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return 'New Lead';
    return ADMIN_STATUS_OPTIONS.includes(trimmed as AdminStatus) ? (trimmed as AdminStatus) : 'New Lead';
};

const CONSULTATION_STATUS_OPTIONS: ConsultationStatus[] = [
    'Genuine Student',
    'Consulted',
    'Still undecided',
    'Pending Documents',
    'Submitted Application',
    'No Show',
    'Non-Genuine Student',
];

const normalizeConsultationStatus = (value?: string | null): ConsultationStatus => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return 'Genuine Student';
    return CONSULTATION_STATUS_OPTIONS.includes(trimmed as ConsultationStatus)
        ? (trimmed as ConsultationStatus)
        : 'Genuine Student';
};

const buildNameParts = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return { firstName: '', middleName: '', lastName: '' };
    }
    if (parts.length === 1) {
        return { firstName: parts[0], middleName: '', lastName: '' };
    }
    if (parts.length === 2) {
        return { firstName: parts[0], middleName: '', lastName: parts[1] };
    }
    return {
        firstName: parts[0],
        middleName: parts.slice(1, -1).join(' '),
        lastName: parts[parts.length - 1],
    };
};

const toDate = (value?: { toDate?: () => Date } | Date | null) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate();
    }
    return null;
};

const normalizeValue = (value?: string | null) => (value ?? '').trim().toLowerCase();

const normalizeNameKey = (value?: string | null) => (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const roleMatches = (role?: string | null, target?: string) => {
    const roleKey = normalizeValue(role);
    const targetKey = normalizeValue(target);
    if (!roleKey || !targetKey) return false;
    return roleKey === targetKey || roleKey.startsWith(targetKey) || roleKey.includes(targetKey);
};

const isAutoEndorsementRole = (role?: string | null) => {
    return (
        roleMatches(role, 'education consultant') ||
        roleMatches(role, 'education counsellor') ||
        roleMatches(role, 'education counselor') ||
        roleMatches(role, 'branch manager')
    );
};

const resolveAssignment = (
    submission: AssessmentSubmission,
    allPersonnel: PersonnelLookupItem[] = []
) => {
    const directAssignedName = (submission.assignedCounsellor || '').trim();
    const directAssignedUid = (submission.assignedCounsellorUid || '').trim();
    if (directAssignedName || directAssignedUid) {
        return {
            assignedCounsellor: directAssignedName,
            assignedCounsellorUid: directAssignedUid || undefined,
        };
    }

    if (submission.referredByStaff !== true) {
        return { assignedCounsellor: '', assignedCounsellorUid: undefined };
    }

    const referredStaffId = (submission.referredStaffId || '').trim();
    const referredStaffName = (submission.referredStaffName || '').trim();
    const referredStaffNameKey = normalizeNameKey(referredStaffName);

    if (!referredStaffId && !referredStaffNameKey) {
        return { assignedCounsellor: '', assignedCounsellorUid: undefined };
    }

    const referredPersonnel = allPersonnel.find((person) => {
        const personUid = (person.uid ?? '').trim();
        if (referredStaffId && personUid && personUid === referredStaffId) {
            return true;
        }
        const personNameKey = normalizeNameKey(person.name);
        return Boolean(referredStaffNameKey && personNameKey && personNameKey === referredStaffNameKey);
    });

    if (!referredPersonnel || !isAutoEndorsementRole(referredPersonnel.role)) {
        return { assignedCounsellor: '', assignedCounsellorUid: undefined };
    }

    const resolvedName = (referredPersonnel.name ?? '').trim() || referredStaffName;
    const resolvedUid = (referredPersonnel.uid ?? '').trim() || referredStaffId || undefined;

    return {
        assignedCounsellor: resolvedName,
        assignedCounsellorUid: resolvedUid,
    };
};

const mapLogs = (logs?: AssessmentSubmission['logs']) => {
    if (!Array.isArray(logs)) return [];
    return logs
        .map((log, index) => ({
            id: log?.id || `${new Date().toISOString()}-log-${index}`,
            author: log?.author || 'System User',
            action: log?.action || '',
            timestamp: toDate(log?.timestamp) || new Date(),
        }))
        .filter((log) => log.action);
};

const mapNotes = (notes?: AssessmentSubmission['notes']) => {
    if (!Array.isArray(notes)) return [];
    return notes
        .map((note, index) => ({
            id: note?.id || `${new Date().toISOString()}-note-${index}`,
            subject: note?.subject || 'Admin Screening',
            content: note?.content || '',
            author: note?.author || 'System User',
            timestamp: toDate(note?.timestamp) || new Date(),
        }))
        .filter((note) => note.content);
};

export const mapAssessmentSubmissionToLeadRow = (
    submission: AssessmentSubmission,
    allPersonnel: PersonnelLookupItem[] = []
): LeadRow => {
    const fullName = (submission.fullName || '').trim();
    const nameParts = buildNameParts(fullName);
    const resolvedAssignment = resolveAssignment(submission, allPersonnel);
    const createdAt = (() => {
        if (!submission.createdAt) return null;
        if (submission.createdAt instanceof Date) return submission.createdAt;
        if (typeof submission.createdAt === 'object' && 'toDate' in submission.createdAt) {
            return submission.createdAt.toDate();
        }
        return null;
    })();

    return {
        id: submission.id,
        leadDocPath: String((submission as { leadDocPath?: string }).leadDocPath || '').trim() || `leads/${submission.id}`,
        fullName: fullName || 'Unknown',
        firstName: nameParts.firstName,
        middleName: nameParts.middleName,
        lastName: nameParts.lastName,
        nativeName: '',
        currentLocation: submission.currentLocation || '',
        isUsPassportHolder: submission.isUsPassportHolder ?? false,
        hasWorked: submission.hasWorked ?? false,
        englishTest: submission.englishTest || '',
        studyDestinations: Array.isArray(submission.studyDestinations)
            ? submission.studyDestinations
                  .map((destination) =>
                      destination === 'Other' && submission.otherStudyDestination
                          ? submission.otherStudyDestination
                          : destination,
                  )
                  .join(', ')
            : '',
        preferredCoursesOfStudy: Array.isArray(submission.preferredCoursesOfStudy)
            ? submission.preferredCoursesOfStudy
                  .map((course) =>
                      course === 'Others' && submission.otherPreferredCourseOfStudy
                          ? submission.otherPreferredCourseOfStudy
                          : course,
                  )
                  .filter((course) => course && course !== 'Others')
                  .join(', ')
            : '',
        plannedStudyStart: submission.plannedStudyStart || '',
        resumeStoragePath: submission.resumeStoragePath || '',
        email: submission.emailAddress || '',
        phoneCountryCode: '',
        phoneNumber: submission.mobileNumber || '',
        citizenship: 'Philippines',
        visaRefusal: submission.hasVisaRefusal ? 'Yes' : 'No',
        branch: submission.referredStaffBranch || '',
        assignedCounsellor: resolvedAssignment.assignedCounsellor,
        assignedCounsellorUid: resolvedAssignment.assignedCounsellorUid,
        caseId: (submission.caseId || '').trim(),
        adminStatus: normalizeAdminStatus(submission.adminStatus),
        adminNotes: (submission.adminNotes || '').trim(),
        consultationStatus: normalizeConsultationStatus(submission.consultationStatus),
        consultationNotes: (submission.consultationNotes || '').trim(),
        logs: mapLogs(submission.logs),
        notes: mapNotes(submission.notes),
        submittedAt: createdAt,
        dob: submission.dateOfBirth || '',
        maritalStatus: 'Never Married',
        passportNumber: '',
        passportIssueDate: '',
        passportExpiry: '',
        secondNationality: '',
        presentAddress: '',
        permanentAddress: '',
        isPermanentAddressSameAsPresent: false,
        highestEducationLevel: submission.highestEducationalAttainment || '',
        fieldOfStudy: '',
        mostRecentSchool: '',
        currentOccupation: '',
        companyName: '',
        leadStatus: 'New Lead',
        isSubmission: true,
    };
};
