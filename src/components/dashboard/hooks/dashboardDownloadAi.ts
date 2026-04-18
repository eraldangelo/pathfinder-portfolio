import { auth, ensureFirebaseReady } from '../../../services/firebase';
import type { DashboardDownloadSnapshot } from '../utils/dashboardDownloadSnapshot';
import {
  buildDashboardAiInsightsFallback,
  resolveDashboardAiInsights,
  type DashboardAiInsights,
} from '../utils/dashboardAiInsights';
import { DASHBOARD_AI_FETCH_TIMEOUT_MS } from './dashboardDownloadHelpers';

export const requestDashboardAiInsights = async (
  snapshot: DashboardDownloadSnapshot,
): Promise<DashboardAiInsights> => {
  const fallbackInsights = buildDashboardAiInsightsFallback(snapshot);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

  try {
    if (controller) {
      timeoutId = setTimeout(
        () => controller.abort('dashboard-ai-timeout'),
        DASHBOARD_AI_FETCH_TIMEOUT_MS,
      );
    }

    const firebaseReady = await ensureFirebaseReady();
    if (!firebaseReady || !auth?.currentUser) {
      return fallbackInsights;
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch('/api/dashboard/ai-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ snapshot }),
      signal: controller?.signal,
    });

    if (!response.ok) {
      return fallbackInsights;
    }

    const payload = (await response.json()) as {
      report?: string;
      insights?: DashboardAiInsights | Record<string, unknown>;
    };
    return resolveDashboardAiInsights(payload.insights ?? payload.report, snapshot);
  } catch (error) {
    if (controller?.signal.aborted) {
      return fallbackInsights;
    }
    console.error('Failed to fetch AI narrative for export:', error);
    return fallbackInsights;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

