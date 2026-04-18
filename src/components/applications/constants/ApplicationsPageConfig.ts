export const APPLICATION_BRANCH_OPTIONS = [
  'Philippines',
  'Cebu',
  'Davao',
  'Manila',
  'Pampanga',
];

const normalizeBranchKey = (value: string) => value.trim().toLowerCase();

const APPLICATION_BRANCH_FILTER_EQUIVALENTS: Record<string, string[]> = {
  davao: ['davao', 'cagayan de oro', 'cagayan de oro city'],
  pampanga: ['pampanga', 'baguio', 'baguio city'],
};

export const matchesApplicationBranchFilter = (selectedBranch: string, applicationBranch: string) => {
  const selectedKey = normalizeBranchKey(selectedBranch || '');
  if (!selectedKey || selectedKey === 'philippines') return true;

  const branchKey = normalizeBranchKey(applicationBranch || '');
  if (!branchKey) return false;

  const equivalents = APPLICATION_BRANCH_FILTER_EQUIVALENTS[selectedKey];
  if (!equivalents) {
    return branchKey === selectedKey;
  }

  return equivalents.includes(branchKey);
};
