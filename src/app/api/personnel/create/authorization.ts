import { canCreatePersonnel } from '@/utils/roles';

export const canCreatePersonnelRole = (role?: string | null) => canCreatePersonnel(role);

