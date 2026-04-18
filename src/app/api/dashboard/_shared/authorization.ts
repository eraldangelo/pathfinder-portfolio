import {
  isAdministrativeStaffRole,
  isBranchManagerRole,
  isCounsellorRole,
  isDeveloperRole,
  isMarketingRole,
  isOperationsLikeRole,
  isSatelliteOfficeRole,
} from '@/utils/roles';

export const canAccessDashboardMetricsRole = (role?: string | null) =>
  isDeveloperRole(role)
  || isOperationsLikeRole(role)
  || isBranchManagerRole(role)
  || isCounsellorRole(role)
  || isAdministrativeStaffRole(role)
  || isSatelliteOfficeRole(role)
  || isMarketingRole(role);
