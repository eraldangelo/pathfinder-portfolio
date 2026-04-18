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

type SsoClaimInput = {
  admin?: unknown;
  staff?: unknown;
  support?: unknown;
  personnelRole?: string | null;
};

type StudyNaviSsoClaims = {
  source: 'pathfinder';
  admin?: true;
  staff?: true;
  support?: true;
  pathfinderRole?: string;
};

function isTrue(value: unknown): boolean {
  return value === true;
}

function isStaffEquivalentPathfinderRole(role: string): boolean {
  return (
    isDeveloperRole(role)
    || isOperationsRole(role)
    || isBranchManagerRole(role)
    || isCounsellorRole(role)
    || isAdministrativeStaffRole(role)
    || isSatelliteOfficeRole(role)
    || isMarketingRole(role)
  );
}

export function buildStudyNaviSsoClaims(input: SsoClaimInput): StudyNaviSsoClaims {
  const claims: StudyNaviSsoClaims = { source: 'pathfinder' };
  const normalizedRole = normalizeRole(input.personnelRole);
  const hasPathfinderStaffRole = normalizedRole ? isStaffEquivalentPathfinderRole(normalizedRole) : false;

  if (isTrue(input.admin)) claims.admin = true;
  if (isTrue(input.support)) claims.support = true;
  if (isTrue(input.admin) || isTrue(input.staff) || isTrue(input.support) || hasPathfinderStaffRole) {
    claims.staff = true;
  }
  if (normalizedRole) {
    claims.pathfinderRole = normalizedRole;
  }

  return claims;
}
