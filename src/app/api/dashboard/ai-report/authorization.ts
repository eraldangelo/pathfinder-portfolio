import { isDeveloperRole, isOperationsLikeRole } from '@/utils/roles';

export const canAccessDashboardAiReportRole = (role?: string | null) =>
  isDeveloperRole(role) || isOperationsLikeRole(role);

