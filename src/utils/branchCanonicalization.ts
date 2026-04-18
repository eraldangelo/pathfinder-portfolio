const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

const BRANCH_QUERY_ALIASES: Record<string, string[]> = {
  Manila: ['Manila', 'Makati', 'Makati City', 'Manila City', 'Metro Manila', 'Manila Branch'],
  Davao: ['Davao', 'Davao City', 'Cagayan De Oro', 'Cagayan de Oro', 'Cagayan de Oro City', 'CDO'],
  Cebu: ['Cebu', 'Cebu City'],
  Pampanga: ['Pampanga', 'Baguio', 'Baguio City'],
};

const unique = (values: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const cleaned = String(value ?? '').trim();
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleaned);
  });
  return result;
};

export const toCanonicalBranch = (value?: string | null) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const key = normalize(raw);

  if (key === 'cdo' || key.includes('cagayan de oro') || key.includes('davao')) return 'Davao';
  if (key.includes('baguio') || key.includes('pampanga')) return 'Pampanga';
  if (key.includes('cebu')) return 'Cebu';
  if (key.includes('makati') || key.includes('manila')) return 'Manila';

  return raw;
};

export const normalizeCanonicalBranchKey = (value?: string | null) => normalize(toCanonicalBranch(value));

export const buildBranchQueryCandidates = (branch?: string | null) => {
  const raw = String(branch ?? '').trim();
  const canonical = toCanonicalBranch(raw);
  const aliases = BRANCH_QUERY_ALIASES[canonical] || [];
  return unique([raw, canonical, ...aliases]).slice(0, 10);
};

type SubmissionLike = {
  branch?: string | null;
  referredStaffBranch?: string | null;
  preferredBranch?: string | null;
  currentLocation?: string | null;
};

export const resolveSubmissionBranch = (submission: SubmissionLike) => {
  const explicit = String(submission.branch ?? '').trim();
  if (explicit) return explicit;

  const referred = String(submission.referredStaffBranch ?? '').trim();
  if (referred) return referred;

  const preferred = String(submission.preferredBranch ?? '').trim();
  if (preferred) return preferred;

  return String(submission.currentLocation ?? '').trim();
};
