import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import type { Tab } from '../utils/StudentInfoModalTypes';

interface UseStudentInfoModalStateParams {
    lead: Lead;
    onClose: () => void;
}

export const useStudentInfoModalState = ({ lead, onClose }: UseStudentInfoModalStateParams) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedLead, setEditedLead] = useState<Lead>(lead);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setEditedLead(lead);
        setIsEditing(false);
    }, [lead]);

    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.classList.add('animate-fade-in-scale');
        }
    }, []);

    const handleCancel = useCallback(() => {
        setEditedLead(lead);
        setIsEditing(false);
    }, [lead]);

    const handleClose = useCallback(() => {
        if (modalRef.current) {
            modalRef.current.classList.remove('animate-fade-in-scale');
            modalRef.current.classList.add('animate-fade-out-scale');
            setTimeout(onClose, 200);
        } else {
            onClose();
        }
    }, [onClose]);

    const handleEditClick = useCallback((activeTab: Tab, setActiveTab: (tab: Tab) => void) => {
        setIsEditing(true);
        setActiveTab(activeTab === 'admin' ? 'admin' : 'studentInfo');
    }, []);

    return {
        isEditing,
        setIsEditing,
        editedLead,
        setEditedLead,
        modalRef,
        handleCancel,
        handleClose,
        handleEditClick,
    };
};
