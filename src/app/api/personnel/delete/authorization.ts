import { canCreatePersonnel } from '@/utils/roles';

export const canDeletePersonnelRole = (role?: string | null) => canCreatePersonnel(role);

