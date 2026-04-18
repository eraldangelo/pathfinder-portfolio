export type MilestoneBranchKey = 'manila' | 'davao' | 'cebu' | 'pampanga' | '';

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

const MILESTONE_STATUS_KEYS = new Set([
  'unconditional offer',
  'coe/loa received',
  'visa granted',
  'visa refused',
]);

const BRANCH_ROLE_RULES: Record<Exclude<MilestoneBranchKey, ''>, string[]> = {
  manila: ['operations', 'developer'],
  davao: ['operations'],
  cebu: ['branch manager'],
  pampanga: ['branch manager'],
};

export const resolveMilestoneBranchKey = (branch?: string | null): MilestoneBranchKey => {
  const normalized = normalize(branch);
  if (!normalized) return '';
  if (normalized.includes('makati') || normalized.includes('manila')) return 'manila';
  if (normalized.includes('davao')) return 'davao';
  if (normalized.includes('cebu')) return 'cebu';
  if (normalized.includes('pampanga')) return 'pampanga';
  return '';
};

export const isMilestoneStatus = (status?: string | null) => MILESTONE_STATUS_KEYS.has(normalize(status));

export const isEducationConsultantActor = (role?: string | null) => {
  const normalized = normalize(role);
  return (
    normalized === 'education consultant'
    || normalized.includes('education consult')
    || normalized.includes('education counsellor')
    || normalized.includes('education counselor')
  );
};

export const resolveMilestoneRecipientRoles = (branchKey: MilestoneBranchKey) => {
  if (!branchKey) return [] as string[];
  return BRANCH_ROLE_RULES[branchKey];
};

const matchesRole = (roleValue: string, targetRole: string) => {
  const role = normalize(roleValue);
  const target = normalize(targetRole);
  return role === target || role.startsWith(target) || role.includes(target);
};

export const resolveMilestoneNotificationRecipients = (
  docs: Array<{ id: string; data: any }>,
  {
    branchKey,
    targetRoles,
    excludeUid,
  }: {
    branchKey: MilestoneBranchKey;
    targetRoles: string[];
    excludeUid?: string | null;
  }
) => {
  if (!branchKey || !targetRoles.length) return [] as string[];

  const recipientUids = new Set<string>();
  docs.forEach(({ id, data }) => {
    if (!id) return;
    if (excludeUid && id === excludeUid) return;

    const recipientBranchKey = resolveMilestoneBranchKey(String(data?.branch ?? ''));
    if (recipientBranchKey !== branchKey) return;

    const role = String(data?.role ?? '');
    const isRoleAllowed = targetRoles.some((targetRole) => matchesRole(role, targetRole));
    if (!isRoleAllowed) return;

    recipientUids.add(id);
  });

  return [...recipientUids];
};

