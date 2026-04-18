const LEAD_CHILD_SUBCOLLECTIONS = ['logs', 'notes', 'status'] as const;

export interface ApplicationEvaluation {
  ref: any;
  appData: Record<string, unknown>;
  shouldArchiveApp: boolean;
  isArchivedAlready: boolean;
}

interface MoveLeadToArchiveParams {
  leadDoc: any;
  leadData: Record<string, unknown>;
  archiveYear: number;
  requesterUid: string;
  yearArchiveRef: any;
  archiveStartedAt: Date;
  applicationEvaluations: ApplicationEvaluation[];
  batchWriter: {
    queueSet: (ref: any, payload: Record<string, unknown>) => void;
    queueDelete: (ref: any) => void;
    commitIfNeeded: () => Promise<void>;
  };
}

const buildArchivedApplicationPayload = ({
  appData,
  shouldArchiveApp,
  archiveYear,
  archiveStartedAt,
  requesterUid,
}: {
  appData: Record<string, unknown>;
  shouldArchiveApp: boolean;
  archiveYear: number;
  archiveStartedAt: Date;
  requesterUid: string;
}) => {
  const isAlreadyArchived = appData?.isArchived === true;
  if (isAlreadyArchived && !shouldArchiveApp) {
    return {
      ...appData,
      isArchived: true,
      archivedYear:
        Number.isFinite(Number(appData?.archivedYear)) ? Number(appData?.archivedYear) : archiveYear,
      archivedAt: appData?.archivedAt || archiveStartedAt,
      archivedReason: String(appData?.archivedReason || 'yearly-rollover'),
      archivedByUid: String(appData?.archivedByUid || requesterUid),
    };
  }

  return {
    ...appData,
    isArchived: true,
    archivedAt: archiveStartedAt,
    archivedYear: archiveYear,
    archivedReason: 'yearly-rollover',
    archivedByUid: requesterUid,
  };
};

const moveChildCollection = async ({
  sourceLeadRef,
  targetLeadRef,
  childCollectionName,
  batchWriter,
}: {
  sourceLeadRef: any;
  targetLeadRef: any;
  childCollectionName: string;
  batchWriter: {
    queueSet: (ref: any, payload: Record<string, unknown>) => void;
    queueDelete: (ref: any) => void;
    commitIfNeeded: () => Promise<void>;
  };
}) => {
  const childSnapshot = await sourceLeadRef.collection(childCollectionName).get();
  for (const childDoc of childSnapshot.docs) {
    batchWriter.queueSet(
      targetLeadRef.collection(childCollectionName).doc(childDoc.id),
      childDoc.data() || {},
    );
    batchWriter.queueDelete(childDoc.ref);
    await batchWriter.commitIfNeeded();
  }
};

export const moveLeadToYearArchive = async ({
  leadDoc,
  leadData,
  archiveYear,
  requesterUid,
  yearArchiveRef,
  archiveStartedAt,
  applicationEvaluations,
  batchWriter,
}: MoveLeadToArchiveParams) => {
  const archivedLeadRef = yearArchiveRef.collection('leads').doc(leadDoc.id);
  batchWriter.queueSet(archivedLeadRef, {
    ...leadData,
    isArchived: true,
    archivedAt: archiveStartedAt,
    archivedYear: archiveYear,
    archivedReason: 'yearly-rollover',
    archivedByUid: requesterUid,
    archivedFromPath: String(leadDoc.ref?.path || `leads/${leadDoc.id}`),
  });
  await batchWriter.commitIfNeeded();

  for (const evaluation of applicationEvaluations) {
    const archivedPayload = buildArchivedApplicationPayload({
      appData: evaluation.appData,
      shouldArchiveApp: evaluation.shouldArchiveApp,
      archiveYear,
      archiveStartedAt,
      requesterUid,
    });
    batchWriter.queueSet(
      archivedLeadRef.collection('applications').doc(evaluation.ref.id),
      archivedPayload,
    );
    batchWriter.queueDelete(evaluation.ref);
    await batchWriter.commitIfNeeded();
  }

  for (const childCollectionName of LEAD_CHILD_SUBCOLLECTIONS) {
    await moveChildCollection({
      sourceLeadRef: leadDoc.ref,
      targetLeadRef: archivedLeadRef,
      childCollectionName,
      batchWriter,
    });
  }

  batchWriter.queueDelete(leadDoc.ref);
  await batchWriter.commitIfNeeded();
};
