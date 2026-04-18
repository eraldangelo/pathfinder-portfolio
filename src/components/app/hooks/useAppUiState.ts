import { useCallback, useState } from 'react';
import type { View } from '../../../types';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { StudentInfoTab } from '../../leads/types/studentInfoTab';

type StudentModalTab = StudentInfoTab;

export const useAppUiState = () => {
    const [view, setView] = useState<View>('dashboard');
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isNotificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const [minimizedStudentModals, setMinimizedStudentModals] = useState<string[]>([]);
    const [openStudentModalId, setOpenStudentModalId] = useState<string | null>(null);
    const [openStudentModalPath, setOpenStudentModalPath] = useState<string | null>(null);
    const [modalInitialTab, setModalInitialTab] = useState<StudentModalTab | undefined>(undefined);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [leadToTransfer, setLeadToTransfer] = useState<Lead | null>(null);
    const [isRequestLeaveModalOpen, setIsRequestLeaveModalOpen] = useState(false);
    const [isRequestOffsetModalOpen, setIsRequestOffsetModalOpen] = useState(false);
    const [isRequestUseOffsetModalOpen, setIsRequestUseOffsetModalOpen] = useState(false);

    const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);
    const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
    const toggleSidebarCollapsed = useCallback(() => setIsSidebarCollapsed((prev) => !prev), []);

    const openNotifications = useCallback(() => {
        setView('notifications');
    }, []);

    const openApplicationDetail = useCallback((applicationId: string) => {
        setSelectedApplicationId(applicationId);
        setView('application-detail');
    }, []);

    const openStudentProfile = useCallback((leadId: string, targetTab?: StudentModalTab, leadDocPath?: string) => {
        setOpenStudentModalId(leadId);
        setOpenStudentModalPath(leadDocPath || null);
        setModalInitialTab(targetTab);
    }, []);

    const closeStudentModal = useCallback(() => {
        setOpenStudentModalId(null);
        setOpenStudentModalPath(null);
    }, []);

    const minimizeStudentModal = useCallback(() => {
        if (!openStudentModalId) return;
        setMinimizedStudentModals((prev) => [...prev, openStudentModalId]);
        setOpenStudentModalId(null);
        setOpenStudentModalPath(null);
    }, [openStudentModalId]);

    const restoreMinimized = useCallback((leadId: string) => {
        setMinimizedStudentModals((prev) => prev.filter((id) => id !== leadId));
        setOpenStudentModalId(leadId);
        setOpenStudentModalPath(null);
    }, []);

    const closeMinimized = useCallback((leadId: string) => {
        setMinimizedStudentModals((prev) => prev.filter((id) => id !== leadId));
    }, []);

    const openTransferModal = useCallback((lead: Lead) => {
        setLeadToTransfer(lead);
        setIsTransferModalOpen(true);
    }, []);
    const closeTransferModal = useCallback(() => {
        setIsTransferModalOpen(false);
        setLeadToTransfer(null);
    }, []);

    const openRequestLeaveModal = useCallback(() => setIsRequestLeaveModalOpen(true), []);
    const closeRequestLeaveModal = useCallback(() => setIsRequestLeaveModalOpen(false), []);
    const openRequestOffsetModal = useCallback(() => setIsRequestOffsetModalOpen(true), []);
    const closeRequestOffsetModal = useCallback(() => setIsRequestOffsetModalOpen(false), []);
    const openRequestUseOffsetModal = useCallback(() => setIsRequestUseOffsetModalOpen(true), []);
    const closeRequestUseOffsetModal = useCallback(() => setIsRequestUseOffsetModalOpen(false), []);

    return {
        view,
        setView,
        isMobileSidebarOpen,
        openMobileSidebar,
        closeMobileSidebar,
        isSidebarCollapsed,
        toggleSidebarCollapsed,
        isNotificationDropdownOpen,
        setNotificationDropdownOpen,
        openNotifications,
        selectedApplicationId,
        openApplicationDetail,
        minimizedStudentModals,
        openStudentModalId,
        openStudentModalPath,
        modalInitialTab,
        openStudentProfile,
        closeStudentModal,
        minimizeStudentModal,
        restoreMinimized,
        closeMinimized,
        isTransferModalOpen,
        leadToTransfer,
        openTransferModal,
        closeTransferModal,
        isRequestLeaveModalOpen,
        openRequestLeaveModal,
        closeRequestLeaveModal,
        isRequestOffsetModalOpen,
        isRequestUseOffsetModalOpen,
        openRequestOffsetModal,
        openRequestUseOffsetModal,
        closeRequestOffsetModal,
        closeRequestUseOffsetModal,
    };
};


