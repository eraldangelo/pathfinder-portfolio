import { useEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import { db } from '../../../../services/firebase';
import { mapArchiveApplicationDoc, mapArchiveLeadDoc } from './archivePageUtils';
import type { ArchiveApplicationRow, ArchiveLeadRow } from './types';
import {
  choosePreferredLeadDoc,
  isYearlyArchiveLeadPath,
  leadIdFromLeadPath,
  parseLeadPathFromStatusPath,
  resolveArchivedDateForRow,
  resolveArchivedDateFromStatusData,
  resolveMergedCaseId,
  setLatestDate,
} from './archiveDataHelpers';

interface UseArchiveSubscriptionsParams {
  canViewArchive: boolean;
  allowApplicationsTab: boolean;
  archivedStatusDatesRef: MutableRefObject<{
    byPath: Map<string, Date>;
    byLeadId: Map<string, Date>;
  }>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setArchivedLeads: Dispatch<SetStateAction<ArchiveLeadRow[]>>;
  setArchivedApplications: Dispatch<SetStateAction<ArchiveApplicationRow[]>>;
}

export const useArchiveSubscriptions = ({
  canViewArchive,
  allowApplicationsTab,
  archivedStatusDatesRef,
  setIsLoading,
  setArchivedLeads,
  setArchivedApplications,
}: UseArchiveSubscriptionsParams) => {
  useEffect(() => {
    if (!canViewArchive) {
      setIsLoading(false);
      return () => {};
    }

    let active = true;
    let leadLoaded = false;
    let appLoaded = !allowApplicationsTab;
    const finalizeLoading = () => {
      if (!active) return;
      if (leadLoaded && appLoaded) setIsLoading(false);
    };

    if (!allowApplicationsTab) {
      setArchivedApplications([]);
    }

    const leadsUnsubscribe = db.collectionGroup('leads').onSnapshot(
      (snapshot: any) => {
        if (!active) return;

        const groupedByLeadId = new Map<string, any[]>();
        snapshot.docs.forEach((doc: any) => {
          const existing = groupedByLeadId.get(doc.id) || [];
          existing.push(doc);
          groupedByLeadId.set(doc.id, existing);
        });

        const nextLeads = Array.from(groupedByLeadId.values())
          .map((docs: any[]) => {
            const archivedDocs = docs.filter((doc: any) => {
              const data = doc.data?.() || {};
              return data.isArchived === true || isYearlyArchiveLeadPath(String(doc?.ref?.path || ''));
            });
            if (archivedDocs.length === 0) return null;

            const preferredDoc = archivedDocs.reduce((current, incoming) => {
              if (!current) return incoming;
              return choosePreferredLeadDoc(current, incoming);
            }, null as any);
            if (!preferredDoc) return null;

            const row = mapArchiveLeadDoc(preferredDoc);
            const resolvedArchivedAt = resolveArchivedDateForRow(
              row,
              archivedStatusDatesRef.current.byPath,
              archivedStatusDatesRef.current.byLeadId,
            );
            const rowWithStatusArchivedAt = { ...row, archivedAt: resolvedArchivedAt || null };
            const mergedCaseId = resolveMergedCaseId(docs);
            if (!mergedCaseId) return rowWithStatusArchivedAt;

            return {
              ...rowWithStatusArchivedAt,
              caseId: mergedCaseId,
              modalLead: {
                ...rowWithStatusArchivedAt.modalLead,
                caseId: mergedCaseId,
              },
            };
          })
          .filter(Boolean) as ArchiveLeadRow[];
        setArchivedLeads(nextLeads);
        leadLoaded = true;
        finalizeLoading();
      },
      (error: any) => {
        console.error('Error loading archived leads:', error);
        leadLoaded = true;
        finalizeLoading();
      }
    );

    const statusesUnsubscribe = db
      .collectionGroup('status')
      .onSnapshot(
        (snapshot: any) => {
          if (!active) return;

          const nextByPath = new Map<string, Date>();
          const nextByLeadId = new Map<string, Date>();

          snapshot.docs.forEach((doc: any) => {
            const leadPath = parseLeadPathFromStatusPath(String(doc?.ref?.path || ''));
            if (!leadPath) return;

            const statusData = (doc.data?.() || {}) as Record<string, unknown>;
            if (String(statusData.status || '').trim() !== 'Archived') return;
            const archivedDate = resolveArchivedDateFromStatusData(statusData);
            if (!archivedDate) return;

            setLatestDate(nextByPath, leadPath, archivedDate);
            setLatestDate(nextByLeadId, leadIdFromLeadPath(leadPath), archivedDate);
          });

          archivedStatusDatesRef.current = { byPath: nextByPath, byLeadId: nextByLeadId };
          setArchivedLeads((previous) =>
            previous.map((row) => {
              const resolvedArchivedAt = resolveArchivedDateForRow(row, nextByPath, nextByLeadId);
              const previousMillis = row.archivedAt?.getTime() || 0;
              const nextMillis = resolvedArchivedAt?.getTime() || 0;
              if (previousMillis === nextMillis) return row;
              return { ...row, archivedAt: resolvedArchivedAt };
            })
          );
        },
        (error: any) => {
          console.error('Error loading archived status timestamps:', error);
        }
      );

    const applicationsUnsubscribe = allowApplicationsTab
      ? db.collectionGroup('applications').where('isArchived', '==', true).onSnapshot(
          (snapshot: any) => {
            if (!active) return;
            const nextApps = snapshot.docs.map((doc: any) => mapArchiveApplicationDoc(doc));
            setArchivedApplications(nextApps);
            appLoaded = true;
            finalizeLoading();
          },
          (error: any) => {
            console.error('Error loading archived applications:', error);
            appLoaded = true;
            finalizeLoading();
          }
        )
      : () => {};

    finalizeLoading();

    return () => {
      active = false;
      leadsUnsubscribe();
      statusesUnsubscribe();
      applicationsUnsubscribe();
    };
  }, [allowApplicationsTab, canViewArchive, archivedStatusDatesRef, setArchivedApplications, setArchivedLeads, setIsLoading]);
};
