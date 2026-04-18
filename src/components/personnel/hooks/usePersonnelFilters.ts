import { useMemo, useState } from 'react';
import type { PersonnelWithDetails } from '../../../data/personnel';
import { getDisplayRole } from '../utils/personnelUtils';

export const usePersonnelFilters = (allPersonnel: PersonnelWithDetails[]) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('All');
    const [selectedRole, setSelectedRole] = useState('All');

    const uniqueRoles = useMemo(
        () => ['All', ...Array.from(new Set(allPersonnel.map((person) => getDisplayRole(person.role))))],
        [allPersonnel],
    );

    const filteredPersonnel = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return allPersonnel.filter((person) => {
            const searchMatch =
                normalizedSearch === '' ||
                person.name.toLowerCase().includes(normalizedSearch) ||
                person.email.toLowerCase().includes(normalizedSearch);
            const branchMatch = selectedBranch === 'All' || person.branch === selectedBranch;
            const roleMatch = selectedRole === 'All' || getDisplayRole(person.role) === selectedRole;
            return searchMatch && branchMatch && roleMatch;
        });
    }, [allPersonnel, searchTerm, selectedBranch, selectedRole]);

    const groupedPersonnel = useMemo(() => {
        const sorted = [...filteredPersonnel].sort((a, b) => {
            const branchCompare = a.branch.localeCompare(b.branch, 'en', { sensitivity: 'base' });
            if (branchCompare !== 0) return branchCompare;
            return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
        });
        const map = new Map<string, PersonnelWithDetails[]>();
        sorted.forEach((person) => {
            if (!map.has(person.branch)) {
                map.set(person.branch, []);
            }
            map.get(person.branch)?.push(person);
        });
        return Array.from(map.entries());
    }, [filteredPersonnel]);

    return {
        viewMode,
        setViewMode,
        searchTerm,
        setSearchTerm,
        selectedBranch,
        setSelectedBranch,
        selectedRole,
        setSelectedRole,
        uniqueRoles,
        filteredPersonnel,
        groupedPersonnel,
    };
};
