import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import {
    isBranchManagerRole,
    isDeveloperRole,
    isOperationsLikeRole,
} from '../../../utils/roles';
import { ChevronDownIcon, DownloadIcon } from './icons';
import { dropdownPanel } from '../../common/styles/ui';

interface DashboardHeaderProps {
    titleAnimationClasses: string;
    role: string;
    onDownloadPDF: () => Promise<void>;
    onDownloadExcel: () => Promise<void>;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    titleAnimationClasses,
    role,
    onDownloadPDF,
    onDownloadExcel,
}) => {
    const { t } = useTranslation();
    const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
    const [activeDownloadType, setActiveDownloadType] = useState<'pdf' | 'excel' | null>(null);
    const downloadDropdownRef = useRef<HTMLDivElement>(null);
    const isDownloading = activeDownloadType !== null;
    const canDownloadReports =
        isDeveloperRole(role)
        || isOperationsLikeRole(role)
        || isBranchManagerRole(role);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
                setIsDownloadDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const runDownloadAction = async (type: 'pdf' | 'excel', action: () => Promise<void>) => {
        if (isDownloading) return;
        setActiveDownloadType(type);
        try {
            await action();
        } catch (error) {
            console.error('Error while downloading report:', error);
            alert('Failed to download report. Please try again.');
        } finally {
            setActiveDownloadType(null);
            setIsDownloadDropdownOpen(false);
        }
    };

    return (
        <header className={`relative z-10 mb-6 ${titleAnimationClasses}`}>
            <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                <div className="flex min-w-0 items-center">
                    <h1 className="text-2xl font-bold text-[#004097] dark:text-blue-300 sm:text-3xl">{t('dashboard')}</h1>
                </div>
                {canDownloadReports && (
                    <div className="relative w-full sm:w-auto" ref={downloadDropdownRef}>
                        <button
                            disabled={isDownloading}
                            onClick={() => setIsDownloadDropdownOpen((prev) => !prev)}
                            data-testid="dashboard-download-trigger"
                            className={`glass-btn pathfinder-green flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold sm:w-auto ${isDownloading ? 'cursor-not-allowed opacity-70' : ''}`}
                        >
                            <DownloadIcon />
                            <span className="hidden sm:inline">
                                {activeDownloadType === 'pdf'
                                    ? 'Downloading PDF...'
                                    : activeDownloadType === 'excel'
                                        ? 'Downloading Excel...'
                                        : t('downloadReport')}
                            </span>
                            {isDownloading && (
                                <span
                                    aria-hidden="true"
                                    data-testid="dashboard-download-spinner"
                                    className="inline-block h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin"
                                />
                            )}
                            <ChevronDownIcon />
                        </button>
                        {isDownloadDropdownOpen && (
                            <div
                                data-testid="dashboard-download-menu"
                                className={`${dropdownPanel} absolute right-0 mt-2 w-48 z-20 animate-fade-in-fast`}
                            >
                                <ul className="p-1 text-sm text-gray-700 dark:text-gray-200">
                                    <li>
                                        <button
                                            disabled={isDownloading}
                                            onClick={() => runDownloadAction('pdf', onDownloadPDF)}
                                            data-testid="dashboard-download-pdf"
                                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                                                isDownloading
                                                    ? 'opacity-60 cursor-not-allowed'
                                                    : 'hover:bg-black/10 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            {activeDownloadType === 'pdf' ? 'Downloading PDF...' : 'Download PDF'}
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            disabled={isDownloading}
                                            onClick={() => runDownloadAction('excel', onDownloadExcel)}
                                            data-testid="dashboard-download-excel"
                                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                                                isDownloading
                                                    ? 'opacity-60 cursor-not-allowed'
                                                    : 'hover:bg-black/10 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            {activeDownloadType === 'excel' ? 'Downloading Excel...' : 'Download Excel'}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default DashboardHeader;

