import { useEffect, useRef } from 'react';
import { db } from '../../../../services/firebase';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import { getLeadDocRef, isRootLeadDocPath } from '../../../../utils/leadDocPath';

interface UseStudentInfoModalLogParams {
    lead: Lead;
    leadDocPath?: string;
    isSubmission: boolean;
    shouldLog?: boolean;
    viewerName?: string | null;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

export const useStudentInfoModalLog = ({
    lead,
    leadDocPath,
    isSubmission,
    shouldLog = true,
    viewerName,
    onAddLogEntry,
    t,
}: UseStudentInfoModalLogParams) => {
    const lastLoggedAtRef = useRef(0);
    useEffect(() => {
        if (!shouldLog) return;
        const newLogAction = t('logViewedProfile', `viewed ${lead.fullName}'s profile.`);
        if (Date.now() - lastLoggedAtRef.current < 5000) return;
        lastLoggedAtRef.current = Date.now();

        if (isSubmission || !isRootLeadDocPath(leadDocPath)) {
            const author = viewerName || 'System User';
            const newLog = {
                id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                    ? `${crypto.randomUUID()}-log`
                    : `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}-log`,
                timestamp: new Date(),
                author,
                action: newLogAction,
            };
            getLeadDocRef(db, lead.id, leadDocPath)
                .collection('logs')
                .doc(newLog.id)
                .set(newLog)
                .catch((error: any) => {
                if (error?.code !== 'unavailable') {
                    console.error('Error logging viewed profile:', error);
                }
            });
            return;
        }

        onAddLogEntry(lead.id, newLogAction);
    }, [isSubmission, lead.fullName, lead.id, leadDocPath, onAddLogEntry, shouldLog, t, viewerName]);
};
