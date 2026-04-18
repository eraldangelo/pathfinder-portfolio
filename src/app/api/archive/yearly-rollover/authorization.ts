import { isArchiveViewerRole } from '@/utils/roles';

export const canRunYearlyArchiveRole = (role?: string | null) => isArchiveViewerRole(role);

