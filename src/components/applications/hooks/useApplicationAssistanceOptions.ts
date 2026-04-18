import { useMemo } from 'react';
import type { PersonnelWithDetails } from '../../../data/personnel';
import { isAdministrativeStaffRole } from '../../../utils/roles';

const ALWAYS_INCLUDE_ASSISTANCE_UIDS = [
    'mKD07A924GOWkDJI2nDoEHHD1Lw2',
    'cwmPH06lHEO0boPB8MnMGDd65ib2',
    'tAHfo8q8FsYSpSqTFHp8GjCFem22',
] as const;

const ALWAYS_INCLUDE_ASSISTANCE_NAMES = [
    'Melbourne Office',
] as const;

export const useApplicationAssistanceOptions = (allPersonnel: PersonnelWithDetails[]) =>
    useMemo(() => {
        const names = new Map<string, string>();
        const addName = (value: unknown) => {
            const name = String(value || '').trim();
            if (!name) return;
            const key = name.toLowerCase();
            if (!names.has(key)) {
                names.set(key, name);
            }
        };

        addName('None');
        allPersonnel.forEach((person) => {
            if (!isAdministrativeStaffRole(person.role)) return;
            addName(person.name);
        });
        ALWAYS_INCLUDE_ASSISTANCE_UIDS.forEach((uid) => {
            const forcedPersonnel = allPersonnel.find((person) => String(person.uid || '').trim() === uid);
            addName(forcedPersonnel?.name);
        });
        ALWAYS_INCLUDE_ASSISTANCE_NAMES.forEach((name) => addName(name));

        const noneLabel = names.get('none') ?? 'None';
        const sortedOthers = [...names.values()]
            .filter((name) => name.toLowerCase() !== 'none')
            .sort((a, b) => a.localeCompare(b));

        return [noneLabel, ...sortedOthers];
    }, [allPersonnel]);
