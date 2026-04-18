import type { TimesheetEventKey } from '../../../../utils/timesheet';
import type { User } from '../../../../types';
import { db } from '../../../../services/firebase';
import { dispatchNotifications } from '../../../../services/notificationsApi';

interface NotifyBranchLeadsParams {
    eventKey: TimesheetEventKey;
    time: string;
    user: User;
    userRole: string;
    t: (key: string, fallback?: string) => string;
}

const normalize = (value: string) => value.trim().toLowerCase();

const resolveActionLabel = (eventKey: TimesheetEventKey, t: (key: string, fallback?: string) => string) => {
    switch (eventKey) {
        case 'timeIn':
            return t('timeIn', 'Time In');
        case 'lunchStart':
            return t('lunchStart', 'Lunch Start');
        case 'lunchEnd':
            return t('backToWork', 'Back to Work');
        case 'timeOut':
            return t('timeOut', 'Time Out');
        default:
            return eventKey;
    }
};

const resolveStatusLabel = (eventKey: TimesheetEventKey, actionLabel: string) => {
    switch (eventKey) {
        case 'timeIn':
            return 'Timed In';
        case 'lunchStart':
            return 'On Lunch';
        case 'lunchEnd':
            return 'Back to Work';
        case 'timeOut':
            return 'Timed Out';
        default:
            return actionLabel;
    }
};

const resolveBranchKey = (normalizedBranch: string) => {
    if (normalizedBranch.includes('manila')) return 'manila';
    if (normalizedBranch.includes('davao')) return 'davao';
    if (normalizedBranch.includes('cebu')) return 'cebu';
    if (normalizedBranch.includes('pampanga')) return 'pampanga';
    return '';
};

const matchesRole = (roleValue: string, targetRole: string) => {
    const role = normalize(roleValue);
    return role === targetRole || role.startsWith(targetRole) || role.includes(targetRole);
};

export const notifyBranchLeads = async ({ eventKey, time, user, userRole, t }: NotifyBranchLeadsParams) => {
    if (!user?.uid || !userRole || !db) return;

    const branch = (user.branch || '').trim();
    if (!branch) return;

    const normalizedBranch = normalize(branch);
    const normalizedRole = normalize(userRole);

    const branchKey = resolveBranchKey(normalizedBranch);
    if (!branchKey) return;

    const branchConfig: Record<string, { recipientRole: string; notifyRoles: string[] }> = {
        manila: {
            recipientRole: 'operations',
            notifyRoles: ['education consultant', 'administrative staff', 'marketing staff'],
        },
        davao: {
            recipientRole: 'operations',
            notifyRoles: ['education consultant', 'administrative staff'],
        },
        cebu: {
            recipientRole: 'branch manager',
            notifyRoles: ['education consultant', 'administrative staff'],
        },
        pampanga: {
            recipientRole: 'branch manager',
            notifyRoles: ['education consultant', 'administrative staff'],
        },
    };

    const config = branchConfig[branchKey];
    if (!config) return;

    if (!config.notifyRoles.some((role) => matchesRole(normalizedRole, role))) return;

    const actionLabel = resolveActionLabel(eventKey, t);
    const staffName = user.preferredName || user.displayName || 'Staff';
    const statusLabel = resolveStatusLabel(eventKey, actionLabel);
    const message = `${staffName} is now ${statusLabel} at ${time}.`;

    try {
        const recipientsSnapshot = await db.collection('personnel').get();
        const notifications = recipientsSnapshot.docs
            .map((doc: any) => ({ id: doc.id, data: doc.data() || {} }))
            .filter(({ id, data }: { id: string; data: any }) => {
                if (!id || id === user.uid) return false;
                const recipientBranch = normalize(String(data.branch || ''));
                const recipientRole = normalize(String(data.role || ''));
                const branchMatches = recipientBranch.includes(branchKey);
                const roleMatches = matchesRole(recipientRole, config.recipientRole);
                return branchMatches && roleMatches;
            })
            .map(({ id }: { id: string }) => id);

        if (!notifications.length) return;

        await dispatchNotifications(
            notifications.map((uid: string) => ({
                recipientUid: uid,
                message,
                data: {
                    createdBy: user.uid,
                    branch,
                    role: userRole,
                    eventKey,
                    eventTime: time,
                    actorName: staffName,
                    actorRole: userRole,
                    actorBranch: branch,
                },
            }))
        );
    } catch (error) {
        console.error('Error sending manager notification:', error);
    }
};
