import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { modalOverlay, modalSurfaceSoft, inputField } from '../../common/styles/ui';
import { countWeekdaysBetween } from '../../../utils/leave';
import { CalendarPlusIcon, CheckIcon, XIcon } from './RequestLeaveModalIcons';

interface RequestLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { fromDate: string; toDate: string; dayCount: number; reason: string }) => void;
    leaveBalance: number;
}

const RequestLeaveModal: React.FC<RequestLeaveModalProps> = ({ isOpen, onClose, onSubmit, leaveBalance }) => {
    const { t } = useTranslation();
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isMultipleDays, setIsMultipleDays] = useState(false);
    const [reason, setReason] = useState('');
    const todayKey = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);
    
    useEffect(() => {
        if (isOpen) {
            setFromDate('');
            setToDate('');
            setIsMultipleDays(false);
            setReason('');
        }
    }, [isOpen]);

    const handleMultipleDaysToggle = () => {
        setIsMultipleDays((prev) => {
            const next = !prev;
            if (!next) {
                setToDate('');
            } else if (fromDate && !toDate) {
                setToDate(fromDate);
            }
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        onSubmit({ fromDate: effectiveFrom, toDate: effectiveTo, dayCount, reason });
    };

    const effectiveFrom = fromDate;
    const effectiveTo = isMultipleDays ? toDate : fromDate;
    const isRangeValid = Boolean(
        effectiveFrom &&
            effectiveTo &&
            effectiveFrom >= todayKey &&
            effectiveTo >= todayKey &&
            effectiveFrom <= effectiveTo
    );
    const dayCount = useMemo(() => countWeekdaysBetween(effectiveFrom, effectiveTo), [effectiveFrom, effectiveTo]);
    const safeLeaveBalance = Number.isFinite(leaveBalance) ? Math.max(0, Math.floor(leaveBalance)) : 0;
    const isOverBalance = dayCount > 0 && dayCount > safeLeaveBalance;
    const isFormValid = isRangeValid && dayCount > 0 && reason.trim().length >= 20;

    if (!isOpen) return null;

    return (
        <div 
            className={`${modalOverlay} z-[70] flex items-start justify-center p-4 pt-20 animate-fade-in`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-request-modal-title"
        >
            <div 
                className="relative w-full max-w-lg transition-all duration-300 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`absolute inset-0 ${modalSurfaceSoft}`} aria-hidden="true"></div>

                <div className="relative p-6 sm:p-8">
                    <form onSubmit={handleSubmit}>
                        <CalendarPlusIcon />
                        <h2 id="leave-request-modal-title" className="text-xl sm:text-2xl font-bold text-center text-[#004097] dark:text-blue-300">
                            {t('requestLeave', 'Request Leave')}
                        </h2>
                        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center">
                            {t('requestLeaveMessage', 'Please select the date(s) and provide a reason for your leave request.')}
                        </p>

                        <div className="mt-6 space-y-4 text-left">
                            <label htmlFor="leaveMultipleDays" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                                <span className="relative flex items-center justify-center w-4 h-4">
                                    <input
                                        id="leaveMultipleDays"
                                        type="checkbox"
                                        checked={isMultipleDays}
                                        onChange={handleMultipleDaysToggle}
                                        className="appearance-none h-4 w-4 border border-gray-400 dark:border-gray-500 rounded-sm bg-white dark:bg-gray-700 checked:bg-blue-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 dark:focus:ring-offset-gray-800 cursor-pointer"
                                    />
                                    <svg
                                        className={`absolute w-3 h-3 text-white transition-opacity pointer-events-none ${isMultipleDays ? 'opacity-100' : 'opacity-0'}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span>{t('multipleDays', 'Multiple Days?')}</span>
                            </label>

                            {isMultipleDays ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="leaveFromDate" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{t('dateFrom', 'From')}</label>
                                        <input
                                            id="leaveFromDate"
                                            type="date"
                                            value={fromDate}
                                            min={todayKey}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                const clamped = next && next < todayKey ? todayKey : next;
                                                setFromDate(clamped);
                                                if (clamped && isMultipleDays) {
                                                    const minTo = clamped >= todayKey ? clamped : todayKey;
                                                    if (toDate && toDate < minTo) setToDate(minTo);
                                                }
                                            }}
                                            className={inputField}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="leaveToDate" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{t('dateTo', 'To')}</label>
                                        <input
                                            id="leaveToDate"
                                            type="date"
                                            value={toDate}
                                            min={(fromDate && fromDate >= todayKey ? fromDate : todayKey)}
                                            onChange={(e) => {
                                                const minTo = (fromDate && fromDate >= todayKey ? fromDate : todayKey);
                                                const next = e.target.value;
                                                setToDate(next && next < minTo ? minTo : next);
                                            }}
                                            className={inputField}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="leaveSingleDate" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{t('requestDate', 'Date')}</label>
                                    <input
                                        id="leaveSingleDate"
                                        type="date"
                                        value={fromDate}
                                        min={todayKey}
                                        onChange={(e) => {
                                            const next = e.target.value;
                                            setFromDate(next && next < todayKey ? todayKey : next);
                                        }}
                                        className={inputField}
                                    />
                                </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('numberOfDays', 'Days')}</span>{' '}
                                {dayCount > 0 ? dayCount : '0'}
                                <span className="ml-2">{t('weekendsExcluded', 'Weekends are excluded.')}</span>
                                {((effectiveFrom && effectiveFrom < todayKey) || (effectiveTo && effectiveTo < todayKey)) ? (
                                    <span className="ml-2 text-red-500">{t('pastDateNotAllowed', 'Past dates are not allowed.')}</span>
                                ) : null}
                                {isOverBalance ? (
                                    <span className="ml-2 text-red-500">
                                        {t('leaveBalanceExceeded', { count: safeLeaveBalance })}
                                    </span>
                                ) : null}
                                {!isRangeValid && fromDate && toDate ? (
                                    <span className="ml-2 text-red-500">{t('invalidDateRange', 'End date must be after start date.')}</span>
                                ) : null}
                                {isRangeValid && dayCount === 0 ? (
                                    <span className="ml-2 text-red-500">{t('noWeekdaysInRange', 'No weekdays in the selected range.')}</span>
                                ) : null}
                            </div>
                            <div>
                                <label htmlFor="leaveReason" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{t('reason', 'Reason')}</label>
                                <textarea
                                    id="leaveReason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    placeholder={t('leaveReasonPlaceholder', 'Provide a detailed reason for your leave request (minimum 20 characters)...')}
                                    className={inputField}
                                />
                                <p className={`text-xs text-right mt-1 ${reason.trim().length < 20 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {t('charactersMinimum', { current: reason.trim().length, min: 20 })}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-4">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                aria-label={t('cancel', 'Cancel')}
                                title={t('cancel', 'Cancel')}
                            >
                                <XIcon />
                            </button>
                            <button 
                                type="submit"
                                disabled={!isFormValid || isOverBalance}
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-blue-600/50 disabled:cursor-not-allowed"
                                aria-label={t('submitRequest', 'Submit Request')}
                                title={t('submitRequest', 'Submit Request')}
                            >
                                <CheckIcon />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default RequestLeaveModal;
