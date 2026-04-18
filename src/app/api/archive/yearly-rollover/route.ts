import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { canRunYearlyArchiveRole } from './authorization';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { enforceRequestSizeHeaderLimit } from '@/app/api/_shared/requestSize';
import {
  createBatchWriter,
  getManilaYear,
  resolveApplicationCompletionDate,
  resolveLeadBaseDate,
  toDate,
} from './utils';
import { moveLeadToYearArchive, type ApplicationEvaluation } from './archiveMove';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const rateLimit = await enforceRateLimit(request, {
      id: 'archive-yearly-rollover',
      windowMs: 10 * 60_000,
      max: 4,
    });
    if (rateLimit) return rateLimit;

    const sizeLimit = enforceRequestSizeHeaderLimit(request, {
      maxBytes: 1024,
      tooLargeMessage: 'Archive rollover request payload is too large.',
    });
    if (sizeLimit) return sizeLimit;

    const configuredJobKey = String(process.env.ARCHIVE_JOB_KEY || '').trim();
    const requestJobKey = String(request.headers.get('x-archive-job-key') || '').trim();
    const isSchedulerRequest =
      configuredJobKey !== ''
      && requestJobKey !== ''
      && configuredJobKey === requestJobKey;

    let requesterUid = 'system-scheduler';
    let requesterRole: string | null = 'system';

    if (!isSchedulerRequest) {
      const auth = requireBearerToken(request);
      if (auth.response) {
        return auth.response;
      }
      const token = auth.token;

      const adminAuth = getAdminAuth();
      let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
      try {
        decoded = await adminAuth.verifyIdToken(token);
      } catch (error) {
        const unauthorized = toUnauthorizedResponseFromVerifyError(error);
        if (unauthorized) return unauthorized;
        throw error;
      }
      requesterUid = decoded.uid;
      const adminDb = getAdminDb();
      const requesterDoc = await adminDb.collection('personnel').doc(requesterUid).get();
      requesterRole = requesterDoc.exists ? requesterDoc.data()?.role : null;

      if (!canRunYearlyArchiveRole(requesterRole)) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    }

    const adminDb = getAdminDb();
    const manilaYear = getManilaYear();
    const archiveYear = manilaYear - 1;
    const archiveYearRef = adminDb.collection('archives').doc(String(archiveYear));

    const existingRollover = await archiveYearRef.get();
    if (existingRollover.exists && existingRollover.data()?.status === 'completed') {
      const existingData = existingRollover.data() || {};
      return NextResponse.json({
        status: 'already-completed',
        archiveYear,
        message: `Yearly archive already completed for ${archiveYear}.`,
        summary: {
          archivedLeads: Number(existingData.archivedLeads || 0),
          archivedApplications: Number(existingData.archivedApplications || 0),
          activeApplicationsKept: Number(existingData.activeApplicationsKept || 0),
        },
      });
    }
    if (existingRollover.exists && existingRollover.data()?.status === 'running') {
      const runningData = existingRollover.data() || {};
      const startedAt = toDate(runningData.startedAt);
      const startedMillis = startedAt?.getTime() || 0;
      if (startedMillis && Date.now() - startedMillis < 15 * 60 * 1000) {
        return NextResponse.json(
          {
            status: 'running',
            archiveYear,
            message: `Yearly archive for ${archiveYear} is already running.`,
          },
          { status: 409 }
        );
      }
    }

    await archiveYearRef.set(
      {
        status: 'running',
        archiveYear,
        startedAt: new Date(),
        requestedByUid: requesterUid,
        requestedByRole: requesterRole || null,
      },
      { merge: true }
    );

    const leadsSnapshot = await adminDb.collection('leads').get();

    let archivedLeads = 0;
    let archivedApplications = 0;
    let activeApplicationsKept = 0;
    const batchWriter = createBatchWriter(adminDb);

    for (const leadDoc of leadsSnapshot.docs) {
      const leadData = (leadDoc.data() || {}) as Record<string, unknown>;
      if (leadData?.isArchived === true) {
        continue;
      }

      const applicationsSnapshot = await leadDoc.ref.collection('applications').get();
      const applicationEvaluations: ApplicationEvaluation[] = applicationsSnapshot.docs.map((applicationDoc) => {
        const appData = (applicationDoc.data() || {}) as Record<string, unknown>;
        const completionDate = resolveApplicationCompletionDate(appData);
        const completionYear = completionDate?.getFullYear() ?? null;
        const isCompleted = Boolean(completionDate);
        const shouldArchiveApp =
          appData?.isArchived !== true
          && isCompleted
          && completionYear !== null
          && completionYear <= archiveYear;

        return {
          ref: applicationDoc.ref,
          appData,
          shouldArchiveApp,
          isArchivedAlready: appData?.isArchived === true,
        };
      });

      const activeApplicationsForLead = applicationEvaluations.filter(
        (evaluation) => !evaluation.shouldArchiveApp && !evaluation.isArchivedAlready
      ).length;
      const hasActiveApplications = activeApplicationsForLead > 0;

      const leadBaseDate = resolveLeadBaseDate(leadData);
      const leadYear = leadBaseDate?.getFullYear() ?? null;
      const hasArchivableOrArchivedApplications =
        applicationEvaluations.length > 0
        && applicationEvaluations.every((evaluation) => evaluation.shouldArchiveApp || evaluation.isArchivedAlready);

      const shouldArchiveLead =
        !hasActiveApplications
        && (
          (leadYear !== null && leadYear <= archiveYear)
          || hasArchivableOrArchivedApplications
        );

      if (hasActiveApplications) {
        activeApplicationsKept += activeApplicationsForLead;
      }
      if (!shouldArchiveLead) {
        for (const evaluation of applicationEvaluations) {
          if (!evaluation.shouldArchiveApp) continue;
          batchWriter.queueMerge(evaluation.ref, {
            isArchived: true,
            archivedAt: new Date(),
            archivedYear: archiveYear,
            archivedReason: 'yearly-rollover',
            archivedByUid: requesterUid,
          });
          archivedApplications += 1;
          await batchWriter.commitIfNeeded();
        }
        continue;
      }

      archivedApplications += applicationEvaluations.filter((evaluation) => evaluation.shouldArchiveApp).length;
      await moveLeadToYearArchive({
        leadDoc,
        leadData,
        archiveYear,
        requesterUid,
        yearArchiveRef: archiveYearRef,
        archiveStartedAt: new Date(),
        applicationEvaluations,
        batchWriter,
      });
      archivedLeads += 1;
    }

    await batchWriter.flush();

    await archiveYearRef.set(
      {
        status: 'completed',
        archiveYear,
        completedAt: new Date(),
        storageMode: 'year-doc-subcollection',
        archivedLeads,
        archivedApplications,
        activeApplicationsKept,
      },
      { merge: true }
    );

    return NextResponse.json({
      status: 'completed',
      archiveYear,
      message: `Yearly archive completed for ${archiveYear}. Moved ${archivedLeads} leads and ${archivedApplications} applications into archive storage. Kept ${activeApplicationsKept} active in-progress applications.`,
      summary: {
        archivedLeads,
        archivedApplications,
        activeApplicationsKept,
      },
    });
  } catch (error: any) {
    console.error('Yearly archive failed:', error);
    return NextResponse.json(
      { error: 'Yearly archive failed.' },
      { status: 500 }
    );
  }
}
