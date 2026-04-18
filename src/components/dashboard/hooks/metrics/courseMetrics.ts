import type { AssessmentSubmission } from '../../../../types';

const OTHERS_TOKEN = 'Others';
const OTHER_BREAKDOWN_DETAILS_PREFIX = '__others_breakdown__:';

const normalizeSpace = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeKey = (value: unknown) => normalizeSpace(value).toLowerCase().replace(/[’]/g, "'");
const normalizeLooseKey = (value: unknown) =>
  normalizeKey(value)
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeOtherLabel = (value: unknown) => {
  const trimmed = normalizeSpace(value);
  if (!trimmed) return null;

  const loose = normalizeLooseKey(trimmed);
  if (loose.includes('internship')) return 'Internship';
  if (loose.includes('recommendation')) {
    return 'What is your recommendations?';
  }
  if (loose.includes('not sure')) return "I'm not sure";

  return trimmed;
};

const splitOtherValues = (value: string | null) =>
  String(value ?? '')
    .split(/[;|]/)
    .map((part) => normalizeSpace(part))
    .filter(Boolean);

const sortOtherBreakdown = (left: { label: string; apps: number }, right: { label: string; apps: number }) => {
  if (right.apps !== left.apps) return right.apps - left.apps;
  return left.label.localeCompare(right.label);
};

export const buildPreferredCoursesData = (assessmentSubmissions: AssessmentSubmission[]) => {
  const courseCounts = new Map<string, number>();
  const otherDetailCounts = new Map<string, number>();

  assessmentSubmissions.forEach((submission) => {
    const values = Array.isArray(submission.preferredCoursesOfStudy)
      ? submission.preferredCoursesOfStudy.map((value) => normalizeSpace(value)).filter(Boolean)
      : [];

    const hasOthers = values.some((value) => value === OTHERS_TOKEN);

    values.forEach((value) => {
      if (value === OTHERS_TOKEN) return;
      courseCounts.set(value, (courseCounts.get(value) || 0) + 1);
    });

    if (!hasOthers) return;

    const otherRaw = normalizeSpace(submission.otherPreferredCourseOfStudy);
    const otherValues = splitOtherValues(otherRaw || null);
    if (otherValues.length === 0) return;

    otherValues.forEach((otherValue) => {
      const normalizedLabel = normalizeOtherLabel(otherValue);
      if (!normalizedLabel) return;
      otherDetailCounts.set(normalizedLabel, (otherDetailCounts.get(normalizedLabel) || 0) + 1);
    });
  });

  const rankedCourses = Array.from(courseCounts.entries())
    .map(([name, apps]) => ({ name, apps }))
    .sort((a, b) => b.apps - a.apps);

  const otherBreakdown = Array.from(otherDetailCounts.entries())
    .map(([label, apps]) => ({ label, apps }))
    .sort(sortOtherBreakdown);

  if (otherBreakdown.length === 0) return rankedCourses;

  const totalOthers = otherBreakdown.reduce((sum, item) => sum + item.apps, 0);
  const serializedBreakdown = `${OTHER_BREAKDOWN_DETAILS_PREFIX}${JSON.stringify(otherBreakdown)}`;

  return [
    ...rankedCourses,
    {
      name: OTHERS_TOKEN,
      apps: totalOthers,
      details: serializedBreakdown,
    },
  ];
};

export const parseOthersBreakdownDetails = (details?: string) => {
  if (!details || !details.startsWith(OTHER_BREAKDOWN_DETAILS_PREFIX)) return null;
  const json = details.slice(OTHER_BREAKDOWN_DETAILS_PREFIX.length);

  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .map((item) => ({
        label: normalizeSpace((item as { label?: unknown })?.label),
        apps: Number((item as { apps?: unknown })?.apps || 0),
      }))
      .filter((item) => item.label && Number.isFinite(item.apps) && item.apps > 0);
  } catch {
    return null;
  }
};
