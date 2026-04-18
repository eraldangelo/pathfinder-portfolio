import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { PersonnelWithDetails } from '../../../data/personnel';
import { useTranslation } from '../../../contexts/LanguageContext';
import { getDisplayRole, getStatusMeta } from '../utils/personnelUtils';
import { modalBackdropDim } from '../../common/styles/ui';
import { IMAGE_LINKS } from '@/config/imageLinks';

const MailIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const BriefcaseIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
const OfficeBuildingIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>;
const PhoneIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L9.91 10.09a16 16 0 0 0 6 6l.76-.18a2 2 0 0 1 2.11.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z"></path></svg>;
const TrashIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>;

const DEFAULT_PROFILE_IMAGE = IMAGE_LINKS.branding.defaultAvatar;

interface PersonnelProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    personnel: PersonnelWithDetails | null;
    canDelete?: boolean;
    onDeletePersonnel?: (personnel: PersonnelWithDetails) => Promise<boolean>;
}

export const PersonnelProfileModal: React.FC<PersonnelProfileModalProps> = ({
    isOpen,
    onClose,
    personnel,
    canDelete = false,
    onDeletePersonnel,
}) => {
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    const [photoSrc, setPhotoSrc] = useState<string>(DEFAULT_PROFILE_IMAGE);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setPhotoSrc(personnel?.photoURL || DEFAULT_PROFILE_IMAGE);
    }, [personnel?.photoURL]);

    if (!isMounted || !isOpen || !personnel) return null;

    const statusMeta = getStatusMeta(personnel, t);
    const normalizedRole = getDisplayRole(personnel.role);
    const translatedRole = t(normalizedRole.toLowerCase().replace(/\s/g, ''), normalizedRole);
    const translatedBranch = t(personnel.branch.toLowerCase().replace(/[\s()]/g, ''), personnel.branch);
    const personalEmail = personnel.personalEmail || '';
    const formatPhone = (countryCode: string | undefined, rawNumber: string | undefined) => {
        if (!rawNumber) return '';
        const digits = rawNumber.replace(/\D/g, '');
        const country = (countryCode || '').trim() || '+';
        if (digits.length <= 3) return `${country} ${digits}`.trim();
        if (digits.length <= 6) return `${country} ${digits.slice(0, 3)} ${digits.slice(3)}`.trim();
        return `${country} ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`.trim();
    };

    const personalMobile = formatPhone(personnel.personalMobileCountryCode, personnel.personalMobileNumber);
    const businessMobile = formatPhone(personnel.businessMobileCountryCode, personnel.businessMobileNumber);

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="personnel-profile-title"
        >
            <div className={`${modalBackdropDim} animate-fade-in`} aria-hidden="true" />
            <div
                className="relative flex flex-col w-full h-full md:h-auto md:max-h-[90svh] md:max-w-lg bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-white/30 dark:border-white/20 rounded-none md:rounded-3xl shadow-2xl text-gray-800 dark:text-white transform opacity-0 scale-95 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="relative p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-center items-center flex-shrink-0">
                    <h2 id="personnel-profile-title" className="text-lg font-bold text-[#004097] dark:text-blue-400">
                        {t('personnelProfile')}
                    </h2>
                    <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2">
                        <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600" aria-label={t('closeModal')} />
                    </div>
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="p-6 flex flex-col items-center">
                        <div className="relative">
                            <Image
                                src={photoSrc}
                                alt={personnel.name}
                                width={96}
                                height={96}
                                className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400"
                                onError={() => setPhotoSrc(DEFAULT_PROFILE_IMAGE)}
                            />
                            <span className={`absolute bottom-1 right-1 block h-5 w-5 rounded-full ${statusMeta.colorClass} border-2 border-white dark:border-gray-800`}></span>
                        </div>
                        <h3 className="mt-4 text-2xl font-bold text-[#004097] dark:text-blue-300">{personnel.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{statusMeta.tooltip}</p>
                    </div>

                    <div className="px-6 border-t border-black/10 dark:border-white/10 pt-5 text-gray-700 dark:text-gray-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3">
                                <BriefcaseIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('role')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-h-[1.25rem]">{translatedRole}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <OfficeBuildingIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('branch')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-h-[1.25rem]">{translatedBranch}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MailIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('email')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-h-[1.25rem] break-all">{personnel.email || ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MailIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('personalEmail', 'Personal Email')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-h-[1.25rem] break-all">{personalEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <PhoneIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('personalMobileNumber', 'Personal Mobile Number')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-h-[1.25rem]">{personalMobile}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <PhoneIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('businessMobileNumber', 'Business Mobile Number')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-h-[1.25rem]">{businessMobile}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {canDelete && onDeletePersonnel && (
                    <footer className="p-4 sm:p-5 border-t border-black/5 dark:border-white/5 flex-shrink-0 flex items-center justify-center">
                        <button
                            onClick={async () => {
                                const deleted = await onDeletePersonnel(personnel);
                                if (deleted) {
                                    onClose();
                                }
                            }}
                            className="w-12 h-12 rounded-full bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 shadow-lg hover:bg-white dark:hover:bg-black/60 transition-colors flex items-center justify-center text-red-500"
                            aria-label={t('deletePersonnel', 'Delete Personnel')}
                            title={t('deletePersonnel', 'Delete Personnel')}
                        >
                            <TrashIcon />
                        </button>
                    </footer>
                )}
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; animation-delay: 0.05s; }
            `}</style>
        </div>,
        document.body
    );
};
