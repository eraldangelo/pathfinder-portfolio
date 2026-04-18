import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { modalOverlay, modalSurfaceSoft, inputField } from '../../common/styles/ui';
import { CheckIcon, ClockPlusIcon, OFFSET_HOUR_OPTIONS, USE_OFFSET_OPTIONS, XIcon } from './offsetRequestModalUi';
import { useOffsetRequestModalState } from './useOffsetRequestModalState';

export type OffsetRequestMode = 'add' | 'use';

export interface RequestOffsetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { date: string; hours: number; reason: string; mode: OffsetRequestMode; startTime?: string; endTime?: string }) => void;
    titleKey?: 'requestOffsetAddTitle' | 'requestOffsetUseTitle';
    messageKey?: 'requestOffsetMessage' | 'requestOffsetUseMessage';
    reasonLabelKey?: 'offsetReasonQuestion' | 'reason';
    reasonPlaceholderKey?: 'requestOffsetReasonPlaceholder' | 'requestOffsetUseReasonPlaceholder';
    maxHours?: number;
    mode?: OffsetRequestMode;
}

const RequestOffsetModal: React.FC<RequestOffsetModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    titleKey = 'requestOffsetAddTitle',
    messageKey = 'requestOffsetMessage',
    reasonLabelKey = 'offsetReasonQuestion',
    reasonPlaceholderKey = 'requestOffsetReasonPlaceholder',
    maxHours,
    mode = 'add',
}) => {
    const { t } = useTranslation();
    const {
        date,
        setDate,
        hours,
        setHours,
        parsedHours,
        startTime,
        setStartTime,
        reason,
        setReason,
        isUseMode,
        todayIso,
        tomorrowIso,
        selectableUseHoursCap,
        isHoursValid,
        exceedsBalance,
        startTimeOptions,
        endTime,
        useAvailabilityHint,
        isFormValid,
    } = useOffsetRequestModalState({ isOpen, mode, maxHours, t });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        onSubmit({
            date,
            hours: parsedHours,
            reason,
            mode,
            startTime: isUseMode ? startTime : undefined,
            endTime: isUseMode ? endTime ?? undefined : undefined,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className={`${modalOverlay} z-[70] flex items-start justify-center p-4 pt-20 animate-fade-in`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offset-request-modal-title"
        >
            <div
                className="relative w-full max-w-lg transition-all duration-300 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`absolute inset-0 ${modalSurfaceSoft}`} aria-hidden="true"></div>

                <div className="relative p-6 sm:p-8">
                    <form onSubmit={handleSubmit}>
                        <ClockPlusIcon />
                        <h2 id="offset-request-modal-title" className="text-xl sm:text-2xl font-bold text-center text-[#004097] dark:text-blue-300">
                            {t(
                                titleKey,
                                titleKey === 'requestOffsetUseTitle'
                                    ? 'Request to use Offset'
                                    : 'Request to add offset hours'
                            )}
                        </h2>
                        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center">
                            {t(messageKey, 'Please select the date and offset hours, then provide details.')}
                        </p>

                        <div className="mt-6 space-y-4 text-left">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="offsetDate" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{t('requestDate', 'Date')}</label>
                                    <input
                                        id="offsetDate"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={isUseMode ? tomorrowIso : undefined}
                                        max={mode === 'add' ? todayIso : undefined}
                                        className={inputField}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="offsetHours" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{t('offsetHours', 'Offset Hours')}</label>
                                    <select
                                        id="offsetHours"
                                        value={hours}
                                        onChange={(e) => setHours(e.target.value)}
                                        className={inputField}
                                    >
                                        <option value="">{t('selectOffsetHours', 'Select hours')}</option>
                                        {isUseMode
                                            ? USE_OFFSET_OPTIONS.map((option) => {
                                                const disabled =
                                                    selectableUseHoursCap !== null &&
                                                    option.value > selectableUseHoursCap;
                                                return (
                                                    <option key={option.value} value={String(option.value)} disabled={disabled}>
                                                        {t(option.labelKey, option.labelFallback)}
                                                    </option>
                                                );
                                            })
                                            : OFFSET_HOUR_OPTIONS.map((value) => (
                                                <option key={value} value={value}>
                                                    {value}
                                                </option>
                                            ))}
                                    </select>
                                    {isUseMode && selectableUseHoursCap !== null && (selectableUseHoursCap <= 0 || exceedsBalance) ? (
                                        <p className="mt-2 text-xs text-red-500">
                                            {t('offsetBalanceExceeded', { count: selectableUseHoursCap })}
                                        </p>
                                    ) : null}
                                    {isUseMode && selectableUseHoursCap !== null && selectableUseHoursCap > 0 ? (
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{useAvailabilityHint}</p>
                                    ) : null}
                                </div>
                            </div>
                            {isUseMode && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="offsetStartTime" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                                            {t('offsetUseStartTime', 'Preferred Start Time')}
                                        </label>
                                        <select
                                            id="offsetStartTime"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className={inputField}
                                            disabled={!isHoursValid || startTimeOptions.length === 0}
                                        >
                                            <option value="">{t('selectStartTime', 'Select start time')}</option>
                                            {startTimeOptions.map((timeOption) => (
                                                <option key={timeOption} value={timeOption}>
                                                    {timeOption}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="offsetEndTime" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                                            {t('offsetUseEndTime', 'End Time')}
                                        </label>
                                        <input
                                            id="offsetEndTime"
                                            type="text"
                                            value={endTime ?? ''}
                                            readOnly
                                            className={inputField}
                                            placeholder={t('autoCalculated', 'Auto-calculated')}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="offsetReason" className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                                    {t(reasonLabelKey, 'Where did you acquire the offset hours?')}
                                </label>
                                <textarea
                                    id="offsetReason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    placeholder={t(reasonPlaceholderKey, 'Provide details on where you acquired the offset hours (minimum 20 characters)...')}
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
                                disabled={!isFormValid}
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

export default RequestOffsetModal;
