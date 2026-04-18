import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { auth } from '../../../services/firebase';
import type { TimeTrackingStatus, View } from '../../../types';
import type { ConfirmModalState } from './useConfirmModal';
import { ClockIcon } from '../icons';

interface UseAppAuthActionsParams {
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
    showPopup: (message: string) => void;
    openConfirm: (payload: Omit<ConfirmModalState, 'isOpen'>) => void;
    setConfirmModal: Dispatch<SetStateAction<ConfirmModalState>>;
    clearNotifications: () => void;
    clearPersistentNotifications: () => void;
    resetTimeTracking: () => void;
    setIsReady: (ready: boolean) => void;
    setView: (view: View) => void;
    timeTrackingStatus: TimeTrackingStatus;
}

export const useAppAuthActions = ({
    t,
    showPopup,
    openConfirm,
    setConfirmModal,
    clearNotifications,
    clearPersistentNotifications,
    resetTimeTracking,
    setIsReady,
    setView,
    timeTrackingStatus,
}: UseAppAuthActionsParams) => {
    const handleLogout = useCallback(() => {
        if (timeTrackingStatus !== 'timed-out') {
            openConfirm({
                title: t('timeOutRequiredTitle'),
                message: t('timeOutRequiredMessage'),
                onConfirm: () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} }),
                confirmButtonText: t('ok'),
                confirmButtonClassName: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
                icon: <ClockIcon />,
            });
            return;
        }

        auth
            .signOut()
            .then(() => {
                showPopup(t('logoutSuccess'));
                setIsReady(false);
                clearNotifications();
                clearPersistentNotifications();
                resetTimeTracking();

                if (typeof window !== 'undefined') {
                    window.location.replace('/login?next=/navigation');
                    return;
                }
                setView('logout');
            })
            .catch((error) => {
                console.error('Logout Error:', error);
                showPopup(t('logoutFailed'));
            });
    }, [
        clearNotifications,
        clearPersistentNotifications,
        openConfirm,
        resetTimeTracking,
        setConfirmModal,
        setIsReady,
        setView,
        showPopup,
        t,
        timeTrackingStatus,
    ]);

    const handleForcePasswordReset = useCallback(async (newPassword: string): Promise<boolean> => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            showPopup('Error: User session not found.');
            handleLogout();
            return false;
        }
        try {
            const idToken = await firebaseUser.getIdToken();
            const response = await fetch('/api/personnel/force-password-reset', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: newPassword }),
            });
            if (!response.ok) {
                throw new Error('Password reset request failed.');
            }
            showPopup(t('passwordUpdateSuccess'));
            await auth.currentUser?.getIdToken(true);
            await auth.currentUser?.reload();
            return true;
        } catch (error) {
            console.error('Error forcing password reset:', error);
            showPopup(t('passwordUpdateFailed'));
            return false;
        }
    }, [handleLogout, showPopup, t]);

    return { handleLogout, handleForcePasswordReset };
};
