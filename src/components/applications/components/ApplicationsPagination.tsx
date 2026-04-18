import React, { useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

interface ApplicationsPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const ApplicationsPagination: React.FC<ApplicationsPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    const { t } = useTranslation();

    const pageNumbers = useMemo(() => {
        const numbers: number[] = [];
        const maxPagesToShow = 5;
        const halfPages = Math.floor(maxPagesToShow / 2);

        let startPage = Math.max(1, currentPage - halfPages);
        let endPage = Math.min(totalPages, currentPage + halfPages);

        if (currentPage - halfPages < 1) {
            endPage = Math.min(totalPages, maxPagesToShow);
        }
        if (currentPage + halfPages > totalPages) {
            startPage = Math.max(1, totalPages - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i += 1) {
            numbers.push(i);
        }

        return { numbers, startPage, endPage };
    }, [currentPage, totalPages]);

    if (totalPages <= 1) {
        return null;
    }

    const buttonBase =
        'inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-full border backdrop-blur-md shadow-sm transition-colors text-xs font-semibold';
    const buttonEnabled =
        'border-white/25 bg-white/25 text-gray-700 hover:bg-white/35 dark:border-white/10 dark:bg-black/25 dark:text-gray-200 dark:hover:bg-black/35';
    const buttonDisabled =
        'border-white/15 bg-white/15 text-gray-400 opacity-60 cursor-not-allowed dark:border-white/10 dark:bg-black/10 dark:text-gray-500';
    const buttonActive =
        'border-blue-400/40 bg-blue-500/20 text-blue-800 dark:border-blue-300/35 dark:bg-blue-400/20 dark:text-blue-100';

    return (
        <nav className="flex flex-wrap items-center justify-center gap-1">
            <button
                type="button"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                aria-label={t('firstPage', 'First page')}
                className={`${buttonBase} ${currentPage === 1 ? buttonDisabled : buttonEnabled}`}
            >
                {'<<'}
            </button>
            <button
                type="button"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label={t('prev', 'Previous')}
                className={`${buttonBase} ${currentPage === 1 ? buttonDisabled : buttonEnabled}`}
            >
                {'<'}
            </button>

            {pageNumbers.startPage > 1 && <span className="px-2 py-1">...</span>}

            {pageNumbers.numbers.map((number) => (
                <button
                    key={number}
                    type="button"
                    onClick={() => onPageChange(number)}
                    aria-current={number === currentPage ? 'page' : undefined}
                    className={`${buttonBase} ${number === currentPage ? buttonActive : buttonEnabled}`}
                >
                    {number}
                </button>
            ))}

            {pageNumbers.endPage < totalPages && <span className="px-2 py-1">...</span>}

            <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label={t('next', 'Next')}
                className={`${buttonBase} ${currentPage === totalPages ? buttonDisabled : buttonEnabled}`}
            >
                {'>'}
            </button>
            <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                aria-label={t('lastPage', 'Last page')}
                className={`${buttonBase} ${currentPage === totalPages ? buttonDisabled : buttonEnabled}`}
            >
                {'>>'}
            </button>
        </nav>
    );
};

export default ApplicationsPagination;
