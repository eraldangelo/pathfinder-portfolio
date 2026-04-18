import { useEffect, useState } from 'react';
import { db } from '../../../../services/firebase';
import type { AdminStatus, ConsultationStatus } from '../../leads-page/LeadsPageTypes';
import { getLeadDocRef } from '../../../../utils/leadDocPath';

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

const isAdminStatusValue = (value?: string | null): value is AdminStatus => {
    return ADMIN_STATUS_OPTIONS.includes((value ?? '').trim() as AdminStatus);
};

const CONSULTATION_STATUS_OPTIONS: ConsultationStatus[] = [
    'Genuine Student',
    'Consulted',
    'Still undecided',
    'Pending Documents',
    'No Show',
    'Non-Genuine Student',
];

const isConsultationStatusValue = (value?: string | null): value is ConsultationStatus => {
    return CONSULTATION_STATUS_OPTIONS.includes((value ?? '').trim() as ConsultationStatus);
};

const normalizeAdminStatus = (value?: string | null): AdminStatus => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return 'New Lead';
    return ADMIN_STATUS_OPTIONS.includes(trimmed as AdminStatus) ? (trimmed as AdminStatus) : 'New Lead';
};

const normalizeConsultationStatus = (value?: string | null): ConsultationStatus => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return 'Genuine Student';
    return CONSULTATION_STATUS_OPTIONS.includes(trimmed as ConsultationStatus)
        ? (trimmed as ConsultationStatus)
        : 'Genuine Student';
};

export const useStudentInfoModalStatus = (
    leadId: string,
    leadDocPath: string | undefined,
    _isSubmission: boolean,
    fallbackStatus?: string | null,
    fallbackConsultationStatus?: string | null,
) => {
    const fallback = normalizeAdminStatus(fallbackStatus);
    const fallbackConsultation = normalizeConsultationStatus(fallbackConsultationStatus);
    const [currentStatus, setCurrentStatus] = useState<AdminStatus>(fallback);
    const [currentConsultationStatus, setCurrentConsultationStatus] = useState<ConsultationStatus>(
        fallbackConsultation,
    );

    useEffect(() => {
        if (!leadId) return;
        const leadRef = getLeadDocRef(db, leadId, leadDocPath);

        const statusRef = leadRef
            .collection('status')
            .orderBy('timestamp', 'desc')
            .limit(10);

        const unsubscribe = statusRef.onSnapshot(
            (snapshot: any) => {
                const docs = snapshot.docs ?? [];
                if (!docs.length) {
                    setCurrentStatus(fallback);
                    setCurrentConsultationStatus(fallbackConsultation);
                    return;
                }
                const matchingAdmin = docs.find((doc: any) => {
                    const data = doc.data?.() || {};
                    const statusValue = String(data.status ?? '').trim();
                    const sourceValue = String(data.source ?? '').trim().toLowerCase();
                    return (
                        (sourceValue === 'admin' && isAdminStatusValue(statusValue)) ||
                        (!sourceValue && isAdminStatusValue(statusValue))
                    );
                });
                const matchingConsultation = docs.find((doc: any) => {
                    const data = doc.data?.() || {};
                    const statusValue = String(data.status ?? '').trim();
                    const sourceValue = String(data.source ?? '').trim().toLowerCase();
                    const isLegacyConsultationStatus =
                        !sourceValue &&
                        isConsultationStatusValue(statusValue) &&
                        !isAdminStatusValue(statusValue);
                    return (
                        (sourceValue === 'consultation' && isConsultationStatusValue(statusValue)) ||
                        isLegacyConsultationStatus
                    );
                });
                if (matchingAdmin) {
                    const adminData = matchingAdmin.data?.() || {};
                    setCurrentStatus(normalizeAdminStatus(adminData.status));
                } else {
                    setCurrentStatus(fallback);
                }
                if (matchingConsultation) {
                    const consultationData = matchingConsultation.data?.() || {};
                    setCurrentConsultationStatus(normalizeConsultationStatus(consultationData.status));
                } else {
                    setCurrentConsultationStatus(fallbackConsultation);
                }
            },
            (error: any) => {
                console.error('Error loading status history:', error);
                setCurrentStatus(fallback);
                setCurrentConsultationStatus(fallbackConsultation);
            }
        );

        return () => unsubscribe();
    }, [fallback, fallbackConsultation, leadId, leadDocPath]);

    return { currentStatus, currentConsultationStatus };
};
