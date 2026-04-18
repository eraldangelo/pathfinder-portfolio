import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

interface LeadsPagePaginationProps {
    currentPage: number;
    totalPages: number;
    pageCount: number;
    totalCount: number;
    onFirst: () => void;
    onPrev: () => void;
    onNext: () => void;
    onLast: () => void;
    onPageChange: (page: number) => void;
}

export const LeadsPagePagination: React.FC<LeadsPagePaginationProps> = ({
    currentPage,
    totalPages,
    pageCount,
    totalCount,
    onFirst,
    onPrev,
    onNext,
    onLast,
    onPageChange,
}) => {
    const { t } = useTranslation();

    const visiblePages = (() => {
        const maxButtons = 5;
        if (totalPages <= maxButtons) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }
        const halfWindow = Math.floor(maxButtons / 2);
        let start = Math.max(1, currentPage - halfWindow);
        let end = start + maxButtons - 1;
        if (end > totalPages) {
            end = totalPages;
            start = Math.max(1, end - maxButtons + 1);
        }
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    })();

    const buttonBase =
        'inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-full border backdrop-blur-md shadow-sm transition-colors text-xs font-semibold';
    const buttonEnabled =
        'border-white/25 bg-white/25 text-gray-700 hover:bg-white/35 dark:border-white/10 dark:bg-black/25 dark:text-gray-200 dark:hover:bg-black/35';
    const buttonDisabled =
        'border-white/15 bg-white/15 text-gray-400 opacity-60 cursor-not-allowed dark:border-white/10 dark:bg-black/10 dark:text-gray-500';
    const buttonActive =
        'border-blue-400/40 bg-blue-500/20 text-blue-800 dark:border-blue-300/35 dark:bg-blue-400/20 dark:text-blue-100';

    return (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 sm:justify-self-start">
                {t('showingRecords', { count: pageCount, total: totalCount })}
            </p>
            {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-self-center">
                    <button
                        type="button"
                        onClick={onFirst}
                        disabled={currentPage === 1}
                        aria-label={t('firstPage', 'First page')}
                        className={`${buttonBase} ${currentPage === 1 ? buttonDisabled : buttonEnabled}`}
                    >
                        {'<<'}
                    </button>
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={currentPage === 1}
                        aria-label={t('prev', 'Previous')}
                        className={`${buttonBase} ${currentPage === 1 ? buttonDisabled : buttonEnabled}`}
                    >
                        {'<'}
                    </button>

                    {visiblePages.map((page) => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            aria-current={page === currentPage ? 'page' : undefined}
                            className={`${buttonBase} ${page === currentPage ? buttonActive : buttonEnabled}`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={onNext}
                        disabled={currentPage === totalPages}
                        aria-label={t('next', 'Next')}
                        className={`${buttonBase} ${currentPage === totalPages ? buttonDisabled : buttonEnabled}`}
                    >
                        {'>'}
                    </button>
                    <button
                        type="button"
                        onClick={onLast}
                        disabled={currentPage === totalPages}
                        aria-label={t('lastPage', 'Last page')}
                        className={`${buttonBase} ${currentPage === totalPages ? buttonDisabled : buttonEnabled}`}
                    >
                        {'>>'}
                    </button>
                </div>
            )}
            {totalPages > 1 && <div aria-hidden className="hidden sm:block" />}
        </div>
    );
};
