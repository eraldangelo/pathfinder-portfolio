import { useCallback } from 'react';
import { db, FieldValue, Timestamp } from '../../../services/firebase';
import { dispatchNotifications, type NotificationDispatchPayload } from '../../../services/notificationsApi';
import type { ApplicationInfo } from '../../../data/applications';
import type { User } from '../../../types';
import {
    isEducationConsultantActor,
    isMilestoneStatus,
    resolveMilestoneBranchKey,
    resolveMilestoneNotificationRecipients,
    resolveMilestoneRecipientRoles,
} from './applicationMilestoneNotifications';

interface UseApplicationActionsParams {
    user: User | null;
    userRole: string | null;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

const toMillis = (value: any): number => {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    return 0;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (!value || typeof value !== 'object') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

const stripUndefinedDeep = <T>(value: T): T => {
    if (Array.isArray(value)) {
        return value.map((item) => stripUndefinedDeep(item)) as T;
    }
    if (isPlainObject(value)) {
        const next: Record<string, unknown> = {};
        Object.entries(value).forEach(([key, entryValue]) => {
            if (entryValue === undefined) return;
            next[key] = stripUndefinedDeep(entryValue);
        });
        return next as T;
    }
    return value;
};

export const useApplicationActions = ({ user, userRole, showPopup, t }: UseApplicationActionsParams) => {
    const updateApplication = useCallback(async (updatedApplication: ApplicationInfo) => {
        try {
            if (!updatedApplication.studentId) {
                showPopup('Missing student ID for this application.');
                return;
            }
            const appData = { ...updatedApplication };
            if (appData.statusChanged && !(appData.statusChanged instanceof Timestamp)) {
                appData.statusChanged = Timestamp.fromDate(new Date(appData.statusChanged as any));
            }
            if (appData.history) {
                appData.history = appData.history.map((history) =>
                    history.date && !(history.date instanceof Timestamp)
                        ? { ...history, date: Timestamp.fromDate(new Date(history.date as any)) }
                        : history
                );
            }

            const sourceLeadPath = String((updatedApplication as { leadDocPath?: string | null }).leadDocPath || '').trim();
            const sourceLeadRef = sourceLeadPath ? db.doc(sourceLeadPath) : null;
            const isArchiveLeadPath = Boolean(sourceLeadRef && sourceLeadRef.path.startsWith('archives/'));
            const studentRef = isArchiveLeadPath && sourceLeadRef
                ? sourceLeadRef
                : db.collection('leads').doc(appData.studentId);
            const appRef = studentRef.collection('applications').doc(appData.id);
            const shouldMirrorToSourceLead = Boolean(!isArchiveLeadPath && sourceLeadRef && sourceLeadRef.path !== studentRef.path);
            const sourceAppRef = shouldMirrorToSourceLead
                ? sourceLeadRef!.collection('applications').doc(appData.id)
                : null;

            const appPayload: Record<string, any> = stripUndefinedDeep({ ...appData });
            if (FieldValue?.delete) {
                // Application status is persisted in leads/{leadId}/status, not inside applications documents.
                appPayload.status = FieldValue.delete();
            } else {
                delete appPayload.status;
            }
            appPayload.leadDocPath = sourceLeadPath || studentRef.path;

            const batch = db.batch();
            const queuedNotifications: NotificationDispatchPayload[] = [];
            batch.set(appRef, appPayload, { merge: true });
            if (sourceAppRef) {
                batch.set(sourceAppRef, appPayload, { merge: true });
            }

            const nextStatus = String(updatedApplication.status || '').trim();
            if (nextStatus) {
                let shouldAppendStatusEntry = true;
                try {
                    const latestStatusSnapshot = await studentRef
                        .collection('status')
                        .orderBy('timestamp', 'desc')
                        .limit(50)
                        .get();

                    const latestForApplication = latestStatusSnapshot.docs.find((doc: any) => {
                        const data = doc.data?.() || {};
                        return (
                            String(data?.source || '').trim().toLowerCase() === 'application' &&
                            String(data?.applicationId || '').trim() === String(appData.id).trim()
                        );
                    });

                    if (latestForApplication) {
                        const latestData = latestForApplication.data?.() || {};
                        const latestStatus = String(latestData?.status || '').trim();
                        const latestMillis = toMillis(latestData?.timestamp);
                        const nextMillis = toMillis(appData.statusChanged);
                        shouldAppendStatusEntry =
                            latestStatus !== nextStatus || (nextMillis > 0 && nextMillis > latestMillis);
                    }
                } catch (statusLookupError) {
                    console.error('Error checking latest application status entry:', statusLookupError);
                }

                if (shouldAppendStatusEntry) {
                    const statusTimestamp =
                        appData.statusChanged instanceof Timestamp
                            ? appData.statusChanged.toDate()
                            : new Date();
                    const statusEntryId = `${statusTimestamp.toISOString()}-status-app-${String(appData.id).trim()}`;
                    const latestHistoryEntry = appData.history?.[0];
                    const statusPayload = {
                        id: statusEntryId,
                        status: nextStatus,
                        source: 'application',
                        applicationId: appData.id,
                        author: String(user?.displayName || '').trim() || null,
                        authorUid: String(user?.uid || '').trim() || null,
                        notes: latestHistoryEntry?.notes || null,
                        timestamp: statusTimestamp,
                    };

                    batch.set(studentRef.collection('status').doc(statusEntryId), statusPayload);
                    if (shouldMirrorToSourceLead && sourceLeadRef) {
                        batch.set(sourceLeadRef.collection('status').doc(statusEntryId), statusPayload);
                    }
                    batch.set(studentRef, { leadStatus: nextStatus }, { merge: true });
                    if (shouldMirrorToSourceLead && sourceLeadRef) {
                        batch.set(sourceLeadRef, { leadStatus: nextStatus }, { merge: true });
                    }

                    const shouldNotifyMilestone =
                        isEducationConsultantActor(userRole)
                        && isMilestoneStatus(nextStatus);

                    if (shouldNotifyMilestone) {
                        try {
                            const leadSnapshot = await studentRef.get();
                            const leadData = leadSnapshot.data?.() || {};

                            const fallbackBranch = String(user?.branch || '').trim();
                            const branchSource = String(appData.branch || leadData.branch || fallbackBranch || '').trim();
                            const branchKey = resolveMilestoneBranchKey(branchSource);
                            const targetRoles = resolveMilestoneRecipientRoles(branchKey);

                            if (branchKey && targetRoles.length) {
                                const personnelSnapshot = await db.collection('personnel').get();
                                const recipients = resolveMilestoneNotificationRecipients(
                                    personnelSnapshot.docs.map((doc: any) => ({ id: doc.id, data: doc.data?.() || {} })),
                                    {
                                        branchKey,
                                        targetRoles,
                                        excludeUid: user?.uid || null,
                                    }
                                );

                                const actorName = String(user?.displayName || 'Education Consultant').trim();
                                const applicantName = String(appData.applicantName || leadData.fullName || 'a student').trim();
                                const providerName = appData.schoolCourses
                                    .map((schoolCourse) => String(schoolCourse?.schoolName || '').trim())
                                    .filter(Boolean)
                                    .join(' / ');
                                const providerSuffix = providerName ? ` for [[${providerName}]]` : '';
                                const notificationMessage =
                                    `[[${actorName}]] updated [[${applicantName}]]'s application status to [[${nextStatus}]]${providerSuffix}.`;

                                recipients.forEach((recipientUid) => {
                                    queuedNotifications.push({
                                        recipientUid,
                                        message: notificationMessage,
                                        data: {
                                            eventKey: 'applicationMilestone',
                                            applicantId: appData.studentId,
                                            applicantName,
                                            applicationId: appData.id,
                                            applicationStatus: nextStatus,
                                            requesterName: actorName,
                                            requesterBranch: branchSource || null,
                                            requesterRole: userRole || null,
                                        },
                                    });
                                });
                            }
                        } catch (notificationError) {
                            console.error('Error creating application milestone notifications:', notificationError);
                        }
                    }
                }
            }

            await batch.commit();
            if (queuedNotifications.length) {
                try {
                    await dispatchNotifications(queuedNotifications);
                } catch (notificationError) {
                    console.error('Error dispatching application milestone notifications:', notificationError);
                }
            }
            showPopup('Application updated successfully.');
        } catch (error: any) {
            if (error.code === 'unavailable') {
                showPopup(t('offlineSaveSuccess', "You're offline, but your changes were saved locally. They'll sync automatically."));
            } else {
                console.error('Error updating application:', error);
                showPopup('Failed to update application.');
            }
        }
    }, [showPopup, t, user, userRole]);

    return { updateApplication };
};
