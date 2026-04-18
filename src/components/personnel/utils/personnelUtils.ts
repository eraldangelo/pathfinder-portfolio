import type { PersonnelWithDetails } from '../../../data/personnel';
import { getActivityStatusColorClass, getActivityStatusLabelKey, resolveActivityStatus } from '../../../utils/activityStatus';
import { isDeveloperRole } from '../../../utils/roles';

type Translator = (key: string, fallback?: string) => string;

export const getDisplayRole = (role: string) => (isDeveloperRole(role) ? 'Developer' : role);

export const getStatusMeta = (person: PersonnelWithDetails, t: Translator) => {
    const resolved = resolveActivityStatus(person.activityStatus);
    const labelKey = getActivityStatusLabelKey(resolved.status);
    const fallback =
        labelKey === 'online'
            ? 'Online'
            : labelKey === 'onLunch'
            ? 'On Lunch'
            : labelKey === 'leave'
            ? 'Leave'
            : 'Offline';
    const label = t(labelKey, fallback);
    const tooltip = resolved.time ? `${label} - ${resolved.time}` : label;
    return {
        colorClass: getActivityStatusColorClass(resolved.status),
        label,
        tooltip,
    };
};
