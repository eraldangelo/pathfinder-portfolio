import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import { applyLeadInputChange } from '../utils/studentInfoModalHelpers';

interface UseStudentInfoModalInputParams {
    setEditedLead: React.Dispatch<React.SetStateAction<Lead>>;
}

export const useStudentInfoModalInput = ({ setEditedLead }: UseStudentInfoModalInputParams) => {
    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        setEditedLead((prev) =>
            applyLeadInputChange(prev, { name, value, type, checked })
        );
    }, [setEditedLead]);

    return { handleInputChange };
};
