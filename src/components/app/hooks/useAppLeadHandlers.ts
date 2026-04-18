import { useCallback, useMemo } from 'react';
import type { User } from '../../../types';
import type { LeadHandlersBaseDeps } from './appLeadHandlers/types';
import { submitLeaveRequest } from './appLeadHandlers/leaveRequest';
import { submitOffsetRequest } from './appLeadHandlers/offsetRequest';
import { logStatusUpdateWithOptionalNote } from './appLeadHandlers/statusNote';
import { submitTransferRequest } from './appLeadHandlers/transfer';

interface UseAppLeadHandlersParams {
    user: User | null;
    userRole: string | null;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
    showPopup: (message: string, meta?: { eventKey?: string; persist?: boolean }) => void;
    addLogEntry: (studentId: string, logMessage: string) => void;
    addNote: (studentId: string, subject: string, content: string, options?: { silent?: boolean }) => void | Promise<void>;
    closeTransferModal: () => void;
    closeRequestLeaveModal: () => void;
    closeRequestOffsetModal: () => void;
}

export const useAppLeadHandlers = ({
    user,
    userRole,
    t,
    showPopup,
    addLogEntry,
    addNote,
    closeTransferModal,
    closeRequestLeaveModal,
    closeRequestOffsetModal,
}: UseAppLeadHandlersParams) => {
    const baseDeps: LeadHandlersBaseDeps = useMemo(() => ({ user, userRole, t, showPopup }), [showPopup, t, user, userRole]);

    const handleSubmitTransfer = useCallback(
        ({ leadId, reason, newBranch, newCounsellor }: { leadId: string; reason: string; newBranch: string; newCounsellor?: string }) => {
            submitTransferRequest(baseDeps, { leadId, reason, newBranch, newCounsellor }, closeTransferModal);
        },
        [baseDeps, closeTransferModal]
    );

    const handleRequestLeaveSubmit = useCallback(
        async (data: { fromDate: string; toDate: string; dayCount: number; reason: string }) => {
            await submitLeaveRequest(baseDeps, data);
            closeRequestLeaveModal();
        },
        [baseDeps, closeRequestLeaveModal]
    );

    const handleStatusUpdateWithNote = useCallback(
        (studentId: string, newStatus: string, providerName: string, noteContent: string) => {
            logStatusUpdateWithOptionalNote(
                { addLogEntry, addNote, t },
                { studentId, newStatus, providerName, noteContent }
            );
        },
        [addLogEntry, addNote, t]
    );

    const handleRequestOffsetSubmit = useCallback(
        async (data: { date: string; hours: number; reason: string; mode?: 'add' | 'use'; startTime?: string; endTime?: string }) => {
            await submitOffsetRequest(baseDeps, data);
            closeRequestOffsetModal();
        },
        [baseDeps, closeRequestOffsetModal]
    );

    return {
        handleSubmitTransfer,
        handleRequestLeaveSubmit,
        handleRequestOffsetSubmit,
        handleStatusUpdateWithNote,
    };
};
