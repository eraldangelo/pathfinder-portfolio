import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User, View } from '../../../../types';
import type { TranslateFn } from '../../../../types/translation';
import type { BranchChangeRequestFormData } from '../../../../types/branchChangeRequest';
import { useLeadActions } from '../useLeadActions';
import { useApplicationActions } from '../useApplicationActions';
import { useAppLeadHandlers } from '../useAppLeadHandlers';
import { submitBranchChangeRequest } from '../branchChangeRequest';

interface UseAppInteractionDomainParams {
    user: User | null;
    setUser: Dispatch<SetStateAction<User | null>>;
    userRole: string | null;
    t: TranslateFn;
    showPopup: (message: string, meta?: { eventKey?: string; persist?: boolean }) => void;
    setView: (view: View) => void;
    setIsReady: (value: boolean) => void;
    closeTransferModal: () => void;
    closeRequestLeaveModal: () => void;
    closeRequestOffsetModal: () => void;
}

export const useAppInteractionDomain = ({
    user,
    setUser,
    userRole,
    t,
    showPopup,
    setView,
    setIsReady,
    closeTransferModal,
    closeRequestLeaveModal,
    closeRequestOffsetModal,
}: UseAppInteractionDomainParams) => {
    const { updateLead, addLogEntry, addNote } = useLeadActions({ user, showPopup, t });
    const { updateApplication } = useApplicationActions({ user, userRole, showPopup, t });
    const {
        handleSubmitTransfer,
        handleRequestLeaveSubmit,
        handleRequestOffsetSubmit,
        handleStatusUpdateWithNote,
    } = useAppLeadHandlers({
        user,
        userRole,
        t,
        showPopup,
        addLogEntry,
        addNote,
        closeTransferModal,
        closeRequestLeaveModal,
        closeRequestOffsetModal,
    });

    const handleProfileUpdate = useCallback(
        (newPhotoURL?: string, updates?: Partial<User>) => {
            setUser((prevUser) =>
                prevUser
                    ? {
                          ...prevUser,
                          photoURL: newPhotoURL || prevUser.photoURL,
                          ...updates,
                      }
                    : null
            );
        },
        [setUser]
    );

    const handleLoginAgain = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.location.replace('/login?next=/navigation');
            return;
        }
        setView('dashboard');
        setIsReady(false);
    }, [setIsReady, setView]);

    const handleBranchChangeRequestSubmit = useCallback(
        async (data: BranchChangeRequestFormData) => {
            await submitBranchChangeRequest({ user, userRole, t, showPopup }, data);
        },
        [showPopup, t, user, userRole]
    );

    const handlers = {
        updateLead,
        addLogEntry,
        addNote,
        updateApplication,
        handleSubmitTransfer,
        handleRequestLeaveSubmit,
        handleRequestOffsetSubmit,
        handleStatusUpdateWithNote,
        handleProfileUpdate,
        handleLoginAgain,
        handleBranchChangeRequestSubmit,
    };

    return {
        ...handlers,
        handlers,
    };
};
