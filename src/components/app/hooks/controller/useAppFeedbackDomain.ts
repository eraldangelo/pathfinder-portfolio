import { useNotifications } from '../useNotifications';
import { useConfirmModal } from '../useConfirmModal';
import { useTimeTracking } from '../useTimeTracking';
import { useAppAuthActions } from '../useAppAuthActions';
import { useTimeTrackingGuard } from '../useTimeTrackingGuard';
import type { TranslateFn } from '../../../../types/translation';
import type { User } from '../../../../types';
import type { View } from '../../../../types';

interface UseAppFeedbackDomainParams {
    user: User | null;
    userRole: string | null;
    t: TranslateFn;
    setIsReady: (value: boolean) => void;
    setView: (view: View) => void;
}

export const useAppFeedbackDomain = ({
    user,
    userRole,
    t,
    setIsReady,
    setView,
}: UseAppFeedbackDomainParams) => {
    const notifications = useNotifications({ user });
    const confirmModal = useConfirmModal();
    const timeTracking = useTimeTracking({
        t,
        showPopup: notifications.showPopup,
        openConfirm: confirmModal.openConfirm,
        closeConfirm: confirmModal.closeConfirm,
        user,
        userRole,
    });

    const authActions = useAppAuthActions({
        t,
        showPopup: notifications.showPopup,
        openConfirm: confirmModal.openConfirm,
        setConfirmModal: confirmModal.setConfirmModal,
        clearNotifications: notifications.clearNotifications,
        clearPersistentNotifications: notifications.clearPersistentNotifications,
        resetTimeTracking: timeTracking.resetTimeTracking,
        setIsReady,
        setView,
        timeTrackingStatus: timeTracking.timeTrackingStatus,
    });

    useTimeTrackingGuard({
        timeTrackingStatus: timeTracking.timeTrackingStatus,
        t,
    });

    const notificationsState = {
        persistentNotifications: notifications.persistentNotifications,
        notifications: notifications.notifications,
        unreadCount: notifications.unreadCount,
        clearPersistentNotifications: notifications.clearPersistentNotifications,
        removeNotification: notifications.removeNotification,
    };

    const timeTrackingState = {
        timeTrackingStatus: timeTracking.timeTrackingStatus,
        timeLog: timeTracking.timeLog,
        hasTimedInToday: timeTracking.hasTimedInToday,
        hasTakenLunchToday: timeTracking.hasTakenLunchToday,
        promptTimeIn: timeTracking.promptTimeIn,
        promptTimeOut: timeTracking.promptTimeOut,
        handleStartLunch: timeTracking.handleStartLunch,
        handleEndLunch: timeTracking.handleEndLunch,
    };

    return {
        ...notifications,
        confirmModal,
        confirmModalState: confirmModal.confirmModal,
        notificationsState,
        timeTracking,
        timeTrackingState,
        authActions,
        authHandlers: {
            handleLogout: authActions.handleLogout,
            handleForcePasswordReset: authActions.handleForcePasswordReset,
        },
        showPopup: notifications.showPopup,
    };
};
