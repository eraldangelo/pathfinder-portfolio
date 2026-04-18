import type { ApplicationData } from '../../leads/student-info-modal/StudentInfoModal';
import type { EntryMode } from '../types/CreateApplicationConfirmModalTypes';

export const emptyApplicationData: ApplicationData = {
    country: '',
    schools: [],
    isPackage: null,
    programsBySchool: {},
    notes: '',
    assistedBy: 'None',
};

export const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';

    if (dateString.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateString.split('-');
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const m = date.toLocaleString('en-US', { month: 'short' });
        const y = date.getFullYear();
        return `${m}-${y}`;
    }

    if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    const d = date.getDate().toString();
    const m = date.toLocaleString('en-US', { month: 'short' });
    const y = date.getFullYear();
    return `${d.padStart(2, '0')}-${m}-${y}`;
};

export const filterSchools = (
    country: string,
    searchTerm: string,
    schoolsByCountry: Record<string, string[]>,
): string[] => {
    if (!country) return [];
    const schools = schoolsByCountry[country] || [];
    if (!searchTerm) return schools;
    return schools.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
};

export const ensureProgramsBySchool = (data: ApplicationData): ApplicationData => {
    const programsBySchool: Record<string, { name: string; intakeDate: string }[]> = {};
    for (const school of data.schools) {
        programsBySchool[school] = data.programsBySchool[school] || [{ name: '', intakeDate: '' }];
    }
    return { ...data, programsBySchool };
};

export const isStepValid = (step: number, data: ApplicationData, entryMode: EntryMode): boolean => {
    switch (step) {
        case 1:
            return !!data.country;
        case 2:
            if (entryMode === 'manual') {
                return data.schools.length > 0 && data.schools[0].length >= 15;
            }
            return data.schools.length > 0 && data.schools[0].trim() !== '';
        case 3:
            return data.isPackage !== null;
        case 4:
            return data.isPackage ? data.schools.length > 1 : true;
        case 5:
            return Object.values(data.programsBySchool).flat().some(p => p.name.trim() !== '');
        case 6:
            return data.notes.trim().length >= 20 && data.assistedBy.trim() !== '';
        default:
            return true;
    }
};
