import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useTranslation } from '../../../contexts/LanguageContext';
import { type Lead } from '../leads-page/LeadsPage';
import { allBranches, PersonnelWithDetails } from '../../../data/personnel';
import { modalOverlay, modalSurfaceSoft, inputField, buttonPrimary, buttonSecondary } from '../../common/styles/ui';
import { isConsultantLikeRole } from '../../../utils/roles';
import { CustomSelect } from '../components/CustomSelect';
import { IMAGE_LINKS } from '@/config/imageLinks';

// --- Icons ---
const TransferIcon: React.FC = () => (
    <div className="w-14 h-14 mx-auto mb-5 p-3 flex items-center justify-center rounded-full bg-[#3B82F6]">
        <Image
            src={IMAGE_LINKS.ui.transferIcon}
            alt="Transfer Icon"
            width={56}
            height={56}
            className="w-full h-full object-contain brightness-0 invert"
        />
    </div>
);


interface RequestTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    allPersonnel: PersonnelWithDetails[];
    onSubmit: (data: { leadId: string; reason: string; newBranch: string; newCounsellor: string; }) => void;
}

const RequestTransferModal: React.FC<RequestTransferModalProps> = ({ isOpen, onClose, lead, allPersonnel, onSubmit }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const [newBranch, setNewBranch] = useState('');
    const [newCounsellor, setNewCounsellor] = useState('');
    
    // Reset state when modal is opened or lead changes
    useEffect(() => {
        if (isOpen) {
            setReason('');
            setNewBranch('');
            setNewCounsellor('');
        }
    }, [isOpen, lead]);
    
    const availableCounsellors = useMemo(() => {
        if (!newBranch) return [];
        return allPersonnel
            .filter(p => p.branch === newBranch && isConsultantLikeRole(p.role))
            .map(p => p.name)
            .sort();
    }, [newBranch, allPersonnel]);

    useEffect(() => {
        setNewCounsellor('');
    }, [newBranch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!lead || !isFormValid) return;
        onSubmit({
            leadId: lead.id,
            reason,
            newBranch,
            newCounsellor
        });
    };

    const isFormValid = reason.trim().length >= 50 && newBranch !== '' && newCounsellor !== '';

    if (!isOpen || !lead) return null;

    const availableBranches = allBranches.filter((branch) => branch !== lead.branch);

    return (
        <div 
            className={`${modalOverlay} z-[70] flex items-start justify-center p-4 pt-20 animate-fade-in`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-modal-title"
        >
            <div 
                className="relative w-full max-w-lg transition-all duration-300 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background Layer */}
                <div className={`absolute inset-0 ${modalSurfaceSoft}`} aria-hidden="true"></div>

                {/* Content Layer */}
                <div className="relative p-6 sm:p-8">
                    <form onSubmit={handleSubmit}>
                        <TransferIcon />
                        <h2 id="transfer-modal-title" className="text-xl sm:text-2xl font-bold text-center text-[#004097] dark:text-blue-300">
                            {t('requestTransferTitle')}
                        </h2>
                        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center">
                            {t('requestTransferMessage')}
                        </p>

                        <div className="mt-6 space-y-4 text-left">
                            <div>
                                <label htmlFor="transferReason" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{t('reasonForTransfer')}</label>
                                <textarea
                                    id="transferReason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    maxLength={150}
                                    rows={3}
                                    placeholder={t('reasonForTransferPlaceholder')}
                                    className={inputField}
                                />
                                <p className={`text-xs text-right mt-1 ${reason.trim().length < 50 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {t('charactersMinimum', { current: reason.trim().length, min: 50 })}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="newBranch" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{t('selectNewBranch')}</label>
                                    <CustomSelect
                                        placeholder={t('branch')}
                                        options={availableBranches}
                                        value={newBranch}
                                        onChange={setNewBranch}
                                        translateFunc={t}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newCounsellor" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{t('selectNewCounsellor')}</label>
                                    <CustomSelect
                                        placeholder={t('counsellor')}
                                        options={availableCounsellors}
                                        value={newCounsellor}
                                        onChange={setNewCounsellor}
                                        disabled={!newBranch || availableCounsellors.length === 0}
                                        translateFunc={t}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                            <button 
                                type="button"
                                onClick={onClose}
                                className={buttonSecondary}
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                type="submit"
                                disabled={!isFormValid}
                                className={`${buttonPrimary} disabled:bg-blue-600/50 disabled:cursor-not-allowed`}
                            >
                                {t('submitRequest')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.15s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default RequestTransferModal;

