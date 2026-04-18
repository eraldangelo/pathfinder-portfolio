import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import type { DashboardDownloadSnapshot } from '@/components/dashboard/utils/dashboardDownloadSnapshot';
import { parseDashboardAiInsights } from '@/components/dashboard/utils/dashboardAiInsights';
import { resolveFilterLabel } from '@/components/dashboard/utils/dashboardReportPeriod';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { canAccessDashboardAiReportRole } from './authorization';
import { parseJsonBodyWithSchema } from '@/app/api/_shared/bodyValidation';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { safeServerFetch } from '@/app/api/_shared/safeFetch';
import { dashboardAiReportBodySchema } from './schema';

export const runtime = 'nodejs';

const extractResponseText = (payload: any) => {
  const direct = String(payload?.output_text ?? '').trim();
  if (direct) return direct;

  const chunks: string[] = [];
  const outputItems = Array.isArray(payload?.output) ? payload.output : [];
  outputItems.forEach((item: any) => {
    const contents = Array.isArray(item?.content) ? item.content : [];
    contents.forEach((content: any) => {
      const text = typeof content?.text === 'string' ? content.text : '';
      if (text) chunks.push(text);
    });
  });
  return chunks.join('\n').trim();
};

const DEFAULT_OPENAI_REQUEST_TIMEOUT_MS = 45_000;

const resolveOpenAiRequestTimeoutMs = () => {
  const fromEnv = Number(process.env.OPENAI_REPORT_TIMEOUT_MS);
  if (!Number.isFinite(fromEnv)) return DEFAULT_OPENAI_REQUEST_TIMEOUT_MS;
  if (fromEnv < 5_000) return DEFAULT_OPENAI_REQUEST_TIMEOUT_MS;
  return Math.floor(fromEnv);
};

const OPENAI_REQUEST_TIMEOUT_MS = resolveOpenAiRequestTimeoutMs();

const isAbortLikeError = (error: unknown) => {
  const candidate = error as {
    name?: string;
    message?: string;
    cause?: { name?: string; message?: string };
  } | null;
  const name = String(candidate?.name ?? '').toLowerCase();
  const message = String(candidate?.message ?? '').toLowerCase();
  const causeName = String(candidate?.cause?.name ?? '').toLowerCase();
  const causeMessage = String(candidate?.cause?.message ?? '').toLowerCase();

  return (
    name === 'aborterror'
    || causeName === 'aborterror'
    || message.includes('aborted')
    || causeMessage.includes('aborted')
  );
};

export async function POST(request: Request) {
  const rateLimit = await enforceRateLimit(request, {
    id: 'dashboard-ai-report',
    windowMs: 60_000,
    max: 12,
  });
  if (rateLimit) return rateLimit;

  const auth = requireBearerToken(request);
  if (auth.response) {
    return auth.response;
  }
  const token = auth.token;

  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured on the server.' }, { status: 500 });
  }

  const parsedBody = await parseJsonBodyWithSchema(request, dashboardAiReportBodySchema, {
    maxBytes: 256 * 1024,
    invalidMessage: 'Invalid dashboard snapshot payload.',
    tooLargeMessage: 'Dashboard snapshot payload is too large.',
  });
  if (parsedBody.response) {
    return parsedBody.response;
  }
  const snapshot = parsedBody.data?.snapshot as DashboardDownloadSnapshot;

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch (error) {
      const unauthorized = toUnauthorizedResponseFromVerifyError(error);
      if (unauthorized) return unauthorized;
      throw error;
    }
    const requesterUid = decoded.uid;
    const requesterDoc = await adminDb.collection('personnel').doc(requesterUid).get();
    const requesterRole = requesterDoc.exists ? requesterDoc.data()?.role : null;

    if (!canAccessDashboardAiReportRole(requesterRole)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const filterLabel = resolveFilterLabel(
      snapshot.selectedFunnelMonth,
      snapshot.selectedQuarter,
      snapshot.selectedFunnelYear,
    );
    const reportPayload = {
      metadata: {
        generatedBy: snapshot.userName,
        reportDate: snapshot.reportDate,
        funnelScope: snapshot.selectedFunnelLocation,
        filterBy: filterLabel,
      },
      sections: {
        applicationFunnel: snapshot.funnelData,
        pathfinderTargetVsActual: snapshot.targetVsActual,
        topCountryDestination: snapshot.topDestinations,
        preferredCourseOfStudy: snapshot.preferredCourses,
        topLeadSources: snapshot.topLeadSources,
        topVisaGrantCounsellors: snapshot.topVisaGrantCounsellors,
        topStaffReferrers: snapshot.topStaffReferrers,
        visaApprovalRateTrend: {
          location: snapshot.selectedLocation,
          points: snapshot.trendData,
        },
      },
    };

    const systemPrompt =
      'You are a reporting analyst for an education consultancy dashboard. ' +
      'Use only the provided numbers. Do not invent data.';

    const userPrompt =
      'Return a JSON object only with this exact shape:\n' +
      '{\n' +
      '  "executiveSummary": "string",\n' +
      '  "keyFindings": ["string", "string", "string"],\n' +
      '  "recommendedActions": ["string", "string", "string"]\n' +
      '}\n\n' +
      'Rules:\n' +
      '- executiveSummary: 3 to 5 complete sentences in simple English that a high-school reader can understand.\n' +
      '- keyFindings: 8 to 12 detailed bullets, each bullet written in 2 to 4 short sentences.\n' +
      '- For each key finding, explain: what happened, why it likely happened based on the provided data, and why it matters for performance.\n' +
      '- keyFindings must include funnel conversion details, decision rates, target-vs-actual gaps, and top-ranking contributor observations when data is available.\n' +
      '- recommendedActions: exactly 3 concrete actions tied to the weakest metric(s) and observed bottleneck(s).\n' +
      '- Use simple everyday words. Avoid jargon, buzzwords, and complex analyst language.\n' +
      '- Do not invent reasons. If a clear reason is not visible in the data, say the reason is unclear from current data.\n' +
      '- Never compute a rate when the denominator is zero; write "No data available" for that rate.\n' +
      '- If decisions (granted + refused) are higher than newly lodged in the same window, explain that decisions can include cases lodged in earlier periods.\n' +
      '- Keep numbers readable: counts as integers, rates as percentages with one decimal and a % sign.\n' +
      '- If a section has no data, say "No data available".\n' +
      '- No markdown, no code fences, no extra keys.\n\n' +
      `Dashboard data:\n${JSON.stringify(reportPayload, null, 2)}`;

    const model = process.env.OPENAI_REPORT_MODEL || 'gpt-4.1-mini';
    const openAiResponse = await safeServerFetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    }, { timeoutMs: OPENAI_REQUEST_TIMEOUT_MS });

    if (!openAiResponse.ok) {
      return NextResponse.json({ error: 'AI provider request failed.' }, { status: 502 });
    }

    const payload = await openAiResponse.json();
    const report = extractResponseText(payload);
    if (!report) {
      return NextResponse.json({ error: 'AI returned an empty report.' }, { status: 502 });
    }

    const insights = parseDashboardAiInsights(report);
    if (!insights) {
      return NextResponse.json({ error: 'AI response could not be parsed into insights.' }, { status: 502 });
    }

    return NextResponse.json({ report, insights });
  } catch (error: unknown) {
    if (isAbortLikeError(error)) {
      console.warn('AI report generation timed out.', { timeoutMs: OPENAI_REQUEST_TIMEOUT_MS });
      return NextResponse.json(
        { error: 'AI report request timed out.', code: 'dashboard-ai-timeout' },
        { status: 504 },
      );
    }
    console.error('AI report generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate AI report.' }, { status: 500 });
  }
}
