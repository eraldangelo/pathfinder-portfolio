import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';

export interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    icon?: ReactNode;
    confirmButtonText?: string;
    confirmButtonClassName?: string;
}

const emptyConfirmModal: ConfirmModalState = {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
};

export const useConfirmModal = () => {
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(emptyConfirmModal);

    const openConfirm = useCallback((payload: Omit<ConfirmModalState, 'isOpen'>) => {
        setConfirmModal({ ...payload, isOpen: true });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const resetConfirm = useCallback(() => {
        setConfirmModal(emptyConfirmModal);
    }, []);

    return { confirmModal, openConfirm, closeConfirm, resetConfirm, setConfirmModal };
};
