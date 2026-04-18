import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, FieldValue } from '../../../../services/firebase';
import type { AdminStatus, ConsultationStatus, Lead, LeadRow } from '../LeadsPageTypes';
import type { User } from '../../../../types';

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
    'Submitted Application',
    'No Show',
    'Non-Genuine Student',
];

const isConsultationStatusValue = (value?: string | null): value is ConsultationStatus => {
    return CONSULTATION_STATUS_OPTIONS.includes((value ?? '').trim() as ConsultationStatus);
};

interface UseLeadStatusSyncParams {
    paginatedLeads: LeadRow[];
    leads: Lead[];
    user: User;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

const createUniqueId = (suffix: string) => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${crypto.randomUUID()}-${suffix}`;
    }
    return `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}-${suffix}`;
};

const writeStatusEntry = async (leadId: string, status: AdminStatus, user: User) => {
    if (!db || !leadId) return;
    const entry = {
        id: createUniqueId('status'),
        status,
        source: 'admin',
        author: user.displayName || 'System User',
        authorUid: user.uid,
        timestamp: new Date(),
    };
    await db.collection('leads').doc(leadId).collection('status').doc(entry.id).set(entry);
};

export const useLeadStatusSync = ({
    paginatedLeads,
    leads,
    user,
    onAddLogEntry,
    showPopup,
    t,
}: UseLeadStatusSyncParams) => {
    const [statusOverrides, setStatusOverrides] = useState<Record<string, AdminStatus>>({});
    const [consultationStatusOverrides, setConsultationStatusOverrides] = useState<
        Record<string, ConsultationStatus>
    >({});

    useEffect(() => {
        if (!db || paginatedLeads.length === 0) return;

        const activeIds = new Set(paginatedLeads.map((lead) => lead.id));
        setStatusOverrides((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((id) => {
                if (!activeIds.has(id)) {
                    delete next[id];
                }
            });
            return next;
        });
        setConsultationStatusOverrides((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((id) => {
                if (!activeIds.has(id)) {
                    delete next[id];
                }
            });
            return next;
        });

        const unsubscribers = paginatedLeads.map((lead) => {
            const collectionName = 'leads';
            return db
                .collection(collectionName)
                .doc(lead.id)
                .collection('status')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .onSnapshot(
                    (snapshot: any) => {
                        const docs = snapshot.docs ?? [];
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
                        const matchingApplication = docs.find((doc: any) => {
                            const data = doc.data?.() || {};
                            const statusValue = String(data.status ?? '').trim();
                            const sourceValue = String(data.source ?? '').trim().toLowerCase();
                            return (
                                sourceValue === 'application' &&
                                (statusValue === 'Submitted Application' || statusValue === 'Submitted')
                            );
                        });
                        const statusValue = matchingAdmin?.data?.()?.status;
                        const consultationStatusValue = matchingConsultation?.data?.()?.status;
                        const applicationStatusValue = matchingApplication?.data?.()?.status;
                        setStatusOverrides((prev) => {
                            const next = { ...prev };
                            if (statusValue && isAdminStatusValue(statusValue)) {
                                next[lead.id] = statusValue as AdminStatus;
                            } else {
                                delete next[lead.id];
                            }
                            return next;
                        });
                        setConsultationStatusOverrides((prev) => {
                            const next = { ...prev };
                            if (
                                applicationStatusValue === 'Submitted Application' ||
                                applicationStatusValue === 'Submitted'
                            ) {
                                next[lead.id] = 'Submitted Application';
                                return next;
                            }
                            if (
                                consultationStatusValue &&
                                isConsultationStatusValue(consultationStatusValue)
                            ) {
                                next[lead.id] = consultationStatusValue as ConsultationStatus;
                            } else {
                                delete next[lead.id];
                            }
                            return next;
                        });
                    },
                    (error: any) => console.error('Error loading status history:', error)
                );
        });

        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [paginatedLeads]);

    const paginatedLeadsWithStatus = useMemo(
        () =>
            paginatedLeads.map((lead) => {
                const adminOverride = statusOverrides[lead.id];
                const consultationOverride = consultationStatusOverrides[lead.id];
                if (!adminOverride && !consultationOverride) return lead;
                return {
                    ...lead,
                    ...(adminOverride ? { adminStatus: adminOverride } : {}),
                    ...(consultationOverride ? { consultationStatus: consultationOverride } : {}),
                };
            }),
        [paginatedLeads, statusOverrides, consultationStatusOverrides]
    );

    const handleStatusChange = useCallback(
        (leadId: string, newStatus: AdminStatus) => {
            const leadToUpdate = leads.find((lead) => lead.id === leadId);
            if (!leadToUpdate) return;

            const leadName = leadToUpdate.fullName?.trim() || t('leadNameFallback', 'This lead');
            const logMessage = (() => {
                const translated = t('logLeadStatusChanged', { name: leadName, status: newStatus });
                return translated === 'logLeadStatusChanged'
                    ? `${leadName}'s status has been changed to ${newStatus}.`
                    : translated;
            })();
            onAddLogEntry(leadId, logMessage);
            showPopup(logMessage);
            setStatusOverrides((prev) => ({ ...prev, [leadId]: newStatus }));

            if (FieldValue?.delete) {
                db.collection('leads')
                    .doc(leadId)
                    .set(
                        {
                            adminStatus: FieldValue.delete(),
                            adminNotes: FieldValue.delete(),
                            notes: FieldValue.delete(),
                            logs: FieldValue.delete(),
                        },
                        { merge: true }
                    )
                    .catch((error: any) => {
                        console.error('Error clearing legacy status fields:', error);
                    });
            }

            writeStatusEntry(leadId, newStatus, user).catch((error) => {
                console.error('Error writing status entry:', error);
            });
        },
        [leads, onAddLogEntry, showPopup, t, user]
    );

    return {
        paginatedLeadsWithStatus,
        handleStatusChange,
    };
};
