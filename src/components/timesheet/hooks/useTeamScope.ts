import { useMemo } from 'react';
import type { User } from '../../../types';
import { isBranchManagerRole, isDeveloperRole, isMarketingRole, isOperationsRole, normalizeRole } from '../../../utils/roles';

type TeamScope = { mode: 'all' } | { mode: 'branch'; branches: string[] };

export const useTeamScope = (user: User, userRole: string) => {
    const teamScope = useMemo<TeamScope | null>(() => {
        const normalizedRole = normalizeRole(userRole);
        const restrictedRoles = new Set([
            'Education Consultant',
            'Administrative Staff',
            'Marketing Staff',
            'Satellite Office Staff',
            'Satellite Office Account',
            'Satellite Office Acccount',
        ]);
        if (restrictedRoles.has(normalizedRole)) return null;
        if (isMarketingRole(normalizedRole)) return null;

        if (isDeveloperRole(normalizedRole)) {
            return { mode: 'all' };
        }

        if (isOperationsRole(normalizedRole)) {
            if (user.branch === 'Davao' || user.branch === 'Melbourne') {
                return { mode: 'all' };
            }
            if (user.branch === 'Manila') {
                return { mode: 'branch', branches: ['Manila'] };
            }
        }

        if (isBranchManagerRole(normalizedRole)) {
            if (user.branch === 'Pampanga') {
                return { mode: 'branch', branches: ['Pampanga'] };
            }
            if (user.branch === 'Cebu') {
                return { mode: 'branch', branches: ['Cebu'] };
            }
        }

        return null;
    }, [user.branch, userRole]);

    return {
        teamScope,
        showMyTeamTab: Boolean(teamScope),
    };
};
