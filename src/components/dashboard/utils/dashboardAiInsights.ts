import type { DashboardDownloadSnapshot } from './dashboardDownloadSnapshot';
import { buildDashboardAiInsightsFallback } from './dashboardAiInsightsFallback';

export type DashboardAiInsights = {
  executiveSummary: string;
  keyFindings: string[];
  recommendedActions: string[];
};

const MAX_FINDINGS = 12;
const MAX_ACTIONS = 3;

const normalizeNumericPhrasing = (line: string) => {
  let normalized = line.replace(
    /(\b(?:rate|ratio|achievement)\b[^0-9-]{0,20})(0?\.\d{2,})/gi,
    (_, prefix: string, ratioValue: string) => `${prefix}${(Number(ratioValue) * 100).toFixed(1)}%`
  );
  normalized = normalized.replace(/\b\d+\.\d{4,}\b/g, (value) => Number(value).toFixed(1));
  return normalized;
};

const cleanupLine = (line: string) =>
  normalizeNumericPhrasing(
    line
      .replace(/^#{1,6}\s*/, '')
      .replace(/^[-*+\u2022]\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/[`_]/g, '')
      .replace(/\\"/g, '"')
      .replace(/"+/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
  );

const normalizeList = (value: unknown, limit: number) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanupLine(String(item ?? '')))
    .filter(Boolean)
    .slice(0, limit);
};

const parseJsonObjectFromText = (text: string): Record<string, unknown> | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const candidates: string[] = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    candidates.push(trimmed.slice(jsonStart, jsonEnd + 1).trim());
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Keep trying candidates.
    }
  }

  return null;
};

const parseInsightsFromObject = (value: Record<string, unknown>): DashboardAiInsights | null => {
  const executiveSummary = cleanupLine(
    String(value.executiveSummary ?? value.executive_summary ?? value.summary ?? '')
  );
  const keyFindings = normalizeList(
    value.keyFindings ?? value.key_findings ?? value.findings,
    MAX_FINDINGS
  );
  const recommendedActions = normalizeList(
    value.recommendedActions ?? value.recommended_actions ?? value.actions,
    MAX_ACTIONS
  );

  if (!executiveSummary && !keyFindings.length && !recommendedActions.length) {
    return null;
  }

  return {
    executiveSummary,
    keyFindings,
    recommendedActions,
  };
};

const parseInsightsFromText = (text: string): DashboardAiInsights | null => {
  const rawLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (!rawLines.length) return null;

  const summaryLines: string[] = [];
  const keyFindings: string[] = [];
  const recommendedActions: string[] = [];
  let currentSection: 'summary' | 'findings' | 'actions' | null = null;

  rawLines.forEach((rawLine) => {
    const line = cleanupLine(rawLine);
    if (!line) return;

    const heading = line.toLowerCase();
    if (heading.includes('executive summary') || heading === 'summary') {
      currentSection = 'summary';
      return;
    }
    if (heading.includes('key findings') || heading === 'key highlights' || heading === 'highlights') {
      currentSection = 'findings';
      return;
    }
    if (heading.includes('recommended actions') || heading.includes('next steps')) {
      currentSection = 'actions';
      return;
    }

    if (currentSection === 'actions') {
      recommendedActions.push(line);
      return;
    }
    if (currentSection === 'findings') {
      keyFindings.push(line);
      return;
    }

    if (currentSection === 'summary' || !currentSection) {
      summaryLines.push(line);
    }
  });

  const executiveSummary = cleanupLine(summaryLines.slice(0, 2).join(' '));
  const normalizedFindings = keyFindings
    .map((line) => cleanupLine(line))
    .filter(Boolean)
    .slice(0, MAX_FINDINGS);
  const normalizedActions = recommendedActions
    .map((line) => cleanupLine(line))
    .filter(Boolean)
    .slice(0, MAX_ACTIONS);

  if (!executiveSummary && !normalizedFindings.length && !normalizedActions.length) {
    return null;
  }

  return {
    executiveSummary,
    keyFindings: normalizedFindings,
    recommendedActions: normalizedActions,
  };
};

export const parseDashboardAiInsights = (input: unknown): DashboardAiInsights | null => {
  if (!input) return null;

  if (typeof input === 'object' && !Array.isArray(input)) {
    return parseInsightsFromObject(input as Record<string, unknown>);
  }

  const text = String(input).trim();
  if (!text) return null;

  const parsedObject = parseJsonObjectFromText(text);
  if (parsedObject) {
    const parsedInsights = parseInsightsFromObject(parsedObject);
    if (parsedInsights) return parsedInsights;
  }

  return parseInsightsFromText(text);
};

export const resolveDashboardAiInsights = (
  input: unknown,
  snapshot: DashboardDownloadSnapshot
): DashboardAiInsights => {
  const fallback = buildDashboardAiInsightsFallback(snapshot);
  const parsed = parseDashboardAiInsights(input);
  if (!parsed) return fallback;

  return {
    executiveSummary: parsed.executiveSummary || fallback.executiveSummary,
    keyFindings: parsed.keyFindings.length ? parsed.keyFindings : fallback.keyFindings,
    recommendedActions: parsed.recommendedActions.length
      ? parsed.recommendedActions.slice(0, MAX_ACTIONS)
      : fallback.recommendedActions,
  };
};

export { buildDashboardAiInsightsFallback } from './dashboardAiInsightsFallback';
