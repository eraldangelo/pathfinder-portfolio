import { db, Timestamp } from './firebase';
import { dispatchNotifications, type NotificationDispatchPayload } from './notificationsApi';
import type { Lead, Note, LogEntry } from '../components/leads/leads-page/LeadsPage';
import type { ApplicationData } from '../components/leads/student-info-modal/StudentInfoModal';
import type { User, ServiceResult } from '../types';
import type { ApplicationStatusHistory, SchoolCourses } from '../data/applications';
import { resolveLeadDocPath } from '../utils/leadDocPath';
import {
    buildApplicationStatusNoteSubject,
    buildRootLeadHydrationPayload,
    buildSchoolCourses,
    formatApplicationDate,
    isLeadAssignedToCurrentUserByName as resolveLeadAssignmentByName,
    resolveApplicationNotificationRecipients,
    resolveCaseIdFromArchives,
} from './application-service/applicationServiceHelpers';

export const createOrUpdateApplication = async (
    lead: Lead,
    data: ApplicationData,
    user: User,
    t: (key: string, options?: { [key: string]: string | number } | string) => string
): Promise<ServiceResult<string>> => {
    try {
        const batch = db.batch();
        const rootLeadRef = db.collection('leads').doc(lead.id);
        const sourceLeadPath = resolveLeadDocPath(lead.id, lead.leadDocPath);
        const sourceLeadRef = db.doc(sourceLeadPath);
        const isArchiveLeadPath = sourceLeadRef.path.startsWith('archives/');
        const submissionRef = isArchiveLeadPath ? sourceLeadRef : rootLeadRef;
        const shouldMirrorToSourceLead = !isArchiveLeadPath && sourceLeadRef.path !== submissionRef.path;

        const leadAssignedCounsellorUid = String(lead.assignedCounsellorUid || '').trim();
        const leadAssignedCounsellorName = String(lead.assignedCounsellor || '').trim();
        const currentUserName = String(user.displayName || '').trim();
        const isLeadAssignedToCurrentUserByName = resolveLeadAssignmentByName(lead, user);
        const resolvedAssignedCounsellorUid =
            leadAssignedCounsellorUid || (isLeadAssignedToCurrentUserByName ? String(user.uid || '').trim() : '');
        const resolvedAssignedCounsellorName =
            leadAssignedCounsellorName || (isLeadAssignedToCurrentUserByName ? currentUserName : '');

        const rootLeadSnapshot = await rootLeadRef.get();
        const sourceLeadSnapshot = sourceLeadRef.path === rootLeadRef.path ? rootLeadSnapshot : await sourceLeadRef.get();
        const rootLeadData = rootLeadSnapshot.data() || {};
        const sourceLeadData = sourceLeadSnapshot.data() || {};

        const safeApplicantName = String(
            lead.fullName
            || sourceLeadData.fullName
            || rootLeadData.fullName
            || [lead.firstName, lead.middleName, lead.lastName].filter(Boolean).join(' ')
            || 'Unknown'
        ).trim() || 'Unknown';
        const safeApplicantDob = String(
            lead.dob
            || sourceLeadData.dob
            || sourceLeadData.dateOfBirth
            || rootLeadData.dob
            || rootLeadData.dateOfBirth
            || ''
        ).trim();
        const safeCitizenship = String(
            lead.citizenship
            || sourceLeadData.citizenship
            || rootLeadData.citizenship
            || 'Philippines'
        ).trim() || 'Philippines';
        const safeBranch = String(
            lead.branch
            || sourceLeadData.branch
            || sourceLeadData.referredStaffBranch
            || rootLeadData.branch
            || rootLeadData.referredStaffBranch
            || user.branch
            || ''
        ).trim();
        const safeVisaRefusal: 'Yes' | 'No' = lead.visaRefusal === 'Yes' ? 'Yes' : 'No';

        const initialCaseId = String(
            lead.caseId
            || sourceLeadData.caseId
            || rootLeadData.caseId
            || ''
        ).trim();
        const resolvedCaseId = await resolveCaseIdFromArchives({ db, leadId: lead.id, currentCaseId: initialCaseId });

        const rootLeadHasIdentity =
            String(rootLeadData.fullName || '').trim() !== ''
            || String(rootLeadData.email || rootLeadData.emailAddress || '').trim() !== '';
        const rootLeadHasAssignment =
            String(rootLeadData.assignedCounsellorUid || '').trim() !== ''
            || String(rootLeadData.assignedCounsellor || '').trim() !== '';
        const shouldHydrateRootLead =
            !isArchiveLeadPath && (!rootLeadSnapshot.exists || !rootLeadHasIdentity || !rootLeadHasAssignment);

        if (shouldHydrateRootLead) {
            await rootLeadRef.set(
                buildRootLeadHydrationPayload({
                    lead,
                    rootLeadSnapshotExists: rootLeadSnapshot.exists,
                    rootLeadData,
                    resolvedAssignedCounsellorName,
                    resolvedAssignedCounsellorUid,
                    resolvedCaseId,
                    user,
                }),
                { merge: true }
            );
        }

        const submissionLeadData = submissionRef.path === rootLeadRef.path ? rootLeadData : sourceLeadData;
        if (resolvedCaseId && String(submissionLeadData.caseId || '').trim() !== resolvedCaseId) {
            batch.set(submissionRef, { caseId: resolvedCaseId }, { merge: true });
        }

        const schoolCourses: SchoolCourses[] = buildSchoolCourses(data);

        const appRef = submissionRef.collection('applications').doc();
        const newStatus = 'Submitted Application';
        const newStatusChangedDate = new Date();

        const newHistoryEntry: ApplicationStatusHistory = {
            status: newStatus,
            date: Timestamp.fromDate(newStatusChangedDate),
            notes: data.notes || undefined,
        };

        const providerDisplayName = data.schools.join(' / ');
        const logMessage = t('logCreatedApplication', { providerName: providerDisplayName });
        const newLog: Omit<LogEntry, 'id'> & { id: string } = {
            id: `${newStatusChangedDate.toISOString()}-log-app-submit`,
            timestamp: newStatusChangedDate,
            author: user.displayName || 'System User',
            action: logMessage,
        };
        const logRef = submissionRef.collection('logs').doc(newLog.id);
        batch.set(logRef, newLog);
        if (shouldMirrorToSourceLead) {
            const sourceLogRef = sourceLeadRef.collection('logs').doc(newLog.id);
            batch.set(sourceLogRef, newLog);
        }

        const statusEntry = {
            id: `${newStatusChangedDate.toISOString()}-status-app-submit-${appRef.id}`,
            status: newStatus,
            source: 'application',
            applicationId: appRef.id,
            author: user.displayName || 'System User',
            authorUid: user.uid || null,
            timestamp: newStatusChangedDate,
        };
        const statusRef = submissionRef.collection('status').doc(statusEntry.id);
        batch.set(statusRef, statusEntry);
        batch.set(submissionRef, { leadStatus: newStatus }, { merge: true });
        if (shouldMirrorToSourceLead) {
            const sourceStatusRef = sourceLeadRef.collection('status').doc(statusEntry.id);
            batch.set(sourceStatusRef, statusEntry);
            batch.set(sourceLeadRef, { leadStatus: newStatus }, { merge: true });
        }

        if (data.notes.trim()) {
            const noteSubject = buildApplicationStatusNoteSubject(
                t('noteSubjectSchoolApplication', 'Application Status Update'),
                newStatus
            );
            const newNote: Omit<Note, 'id'> & { id: string } = {
                id: `${newStatusChangedDate.toISOString()}-note-app-submit`,
                subject: noteSubject,
                content: data.notes,
                author: user.displayName || 'System User',
                timestamp: newStatusChangedDate,
            };
            const noteRef = submissionRef.collection('notes').doc(newNote.id);
            batch.set(noteRef, newNote);
            if (shouldMirrorToSourceLead) {
                const sourceNoteRef = sourceLeadRef.collection('notes').doc(newNote.id);
                batch.set(sourceNoteRef, newNote);
            }
        }

        const newApplicationData = {
            studentId: lead.id,
            citizenship: safeCitizenship,
            branch: safeBranch,
            applicantName: safeApplicantName,
            applicantDob: safeApplicantDob,
            schoolCourses,
            caseId: resolvedCaseId || null,
            applicationDate: formatApplicationDate(newStatusChangedDate),
            statusChanged: Timestamp.fromDate(newStatusChangedDate),
            history: [newHistoryEntry],
            assistedBy: data.assistedBy || 'None',
            visaRefusal: safeVisaRefusal,
            subId: '',
            assignedCounsellorUid: resolvedAssignedCounsellorUid || null,
            assignedCounsellor: resolvedAssignedCounsellorName || null,
            createdByUid: String(user.uid || '').trim() || null,
            createdBy: currentUserName || null,
            leadDocPath: sourceLeadPath,
        };
        batch.set(appRef, newApplicationData);
        if (shouldMirrorToSourceLead) {
            const sourceAppRef = sourceLeadRef.collection('applications').doc(appRef.id);
            batch.set(sourceAppRef, newApplicationData);
        }

        const recipientUids = await resolveApplicationNotificationRecipients({
            db,
            branch: safeBranch,
            user,
            assignedCounsellorUid: resolvedAssignedCounsellorUid,
        });

        const submitterName = user.displayName || 'A staff member';
        const applicantName = lead.fullName || 'a student';
        const notificationMessage = `${submitterName} submitted an application for ${applicantName} to ${providerDisplayName}.`;
        const queuedNotifications: NotificationDispatchPayload[] = Array.from(recipientUids).map((recipientUid) => ({
            recipientUid,
            message: notificationMessage,
            data: {
                eventKey: 'applicationSubmitted',
                applicantId: lead.id,
                applicantName: safeApplicantName || null,
                requesterName: submitterName,
                requesterBranch: safeBranch || user.branch || null,
                requesterRole: 'application submission',
            },
        }));

        await batch.commit();
        if (queuedNotifications.length) {
            try {
                await dispatchNotifications(queuedNotifications);
            } catch (notificationError) {
                console.error('Failed to send application submission notifications:', notificationError);
            }
        }
        return { success: true, data: appRef.id };
    } catch (error) {
        console.error('Error in createOrUpdateApplication service:', error);
        return {
            success: false,
            error: {
                type: 'FIRESTORE_WRITE_FAILED',
                message: t('Failed to save application. Please check your connection and try again.'),
            },
        };
    }
};
