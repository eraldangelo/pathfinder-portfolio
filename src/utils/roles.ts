export const normalizeRole = (role?: string | null) => (role ?? '').trim().replace(/\s+/g, ' ');

const roleKey = (role?: string | null) => normalizeRole(role).toLowerCase();

export const isDeveloperRole = (role?: string | null) => {
  const normalized = roleKey(role);
  return normalized === 'developer' || normalized.startsWith('developer (');
};

export const isOperationsRole = (role?: string | null) => roleKey(role) === 'operations';

export const isBranchManagerRole = (role?: string | null) => roleKey(role) === 'branch manager';

export const isOperationsLikeRole = (role?: string | null) => isOperationsRole(role);

export const isCounsellorRole = (role?: string | null) => roleKey(role) === 'education consultant';

export const isAdministrativeStaffRole = (role?: string | null) => roleKey(role) === 'administrative staff';

export const isSatelliteOfficeRole = (role?: string | null) => roleKey(role) === 'satellite office staff';

export const isMarketingRole = (role?: string | null) => {
  const normalized = roleKey(role);
  return normalized === 'marketing staff' || normalized === 'marketing';
};

export const isConsultantLikeRole = (role?: string | null) => {
  return isCounsellorRole(role) || isBranchManagerRole(role);
};

export const isAdminLikeRole = (role?: string | null) => {
  return isAdministrativeStaffRole(role) || isSatelliteOfficeRole(role);
};

export const isArchiveViewerRole = (role?: string | null) => {
  return isDeveloperRole(role) || isOperationsRole(role) || isBranchManagerRole(role);
};

// Archive read access is intentionally broader than yearly rollover execution.
// Keep this split aligned with docs/README.md and docs/LOGIC_CONTRACT.md.
export const canViewArchiveRole = (role?: string | null) => {
  return (
    isArchiveViewerRole(role) ||
    isMarketingRole(role) ||
    isAdministrativeStaffRole(role) ||
    isCounsellorRole(role)
  );
};

export const canCreatePersonnel = (role?: string | null) => isDeveloperRole(role) || isOperationsRole(role);

export const hasConsultationAccess = (role?: string | null) =>
  isDeveloperRole(role) || isOperationsLikeRole(role) || isConsultantLikeRole(role) || isMarketingRole(role);
