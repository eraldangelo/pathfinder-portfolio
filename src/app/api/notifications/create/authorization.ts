import {
  isAdministrativeStaffRole,
  isBranchManagerRole,
  isCounsellorRole,
  isDeveloperRole,
  isMarketingRole,
  isOperationsRole,
  isSatelliteOfficeRole,
  normalizeRole,
} from '@/utils/roles';

const isCounsellorAlias = (role?: string | null) => {
  const normalized = normalizeRole(role).toLowerCase();
  return normalized === 'education counsellor' || normalized === 'education counselor';
};

export const canCreateCrossUserNotificationsRole = (role?: string | null) => {
  return (
    isDeveloperRole(role) ||
    isOperationsRole(role) ||
    isBranchManagerRole(role) ||
    isCounsellorRole(role) ||
    isCounsellorAlias(role) ||
    isAdministrativeStaffRole(role) ||
    isSatelliteOfficeRole(role) ||
    isMarketingRole(role)
  );
};

