import { useEffect, useMemo, useState } from 'react';
import { getOffsetUseSelectableCap, isValidOffsetUseHours } from '../../../utils/offset';
import { getOffsetUseEndTime, getOffsetUseStartTimeOptions } from '../../../utils/offsetUse';
import type { OffsetRequestMode } from './RequestOffsetModal';

const toIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface UseOffsetRequestModalStateParams {
    isOpen: boolean;
    mode: OffsetRequestMode;
    maxHours?: number;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

export const useOffsetRequestModalState = ({ isOpen, mode, maxHours, t }: UseOffsetRequestModalStateParams) => {
    const [date, setDate] = useState('');
    const [hours, setHours] = useState('');
    const [startTime, setStartTime] = useState('');
    const [reason, setReason] = useState('');
    const isUseMode = mode === 'use';

    const todayIso = useMemo(() => toIsoDate(new Date()), []);
    const tomorrowIso = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return toIsoDate(tomorrow);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setDate('');
        setHours('');
        setStartTime('');
        setReason('');
    }, [isOpen]);

    const parsedHours = useMemo(() => {
        const value = Number(hours);
        return Number.isFinite(value) ? value : 0;
    }, [hours]);
    const isDateValid = Boolean(date) && (isUseMode ? date >= tomorrowIso : date <= todayIso);
    const selectableUseHoursCap = useMemo(() => (isUseMode ? getOffsetUseSelectableCap(maxHours) : null), [isUseMode, maxHours]);
    const isHoursValid = isUseMode ? isValidOffsetUseHours(parsedHours) : parsedHours > 0;
    const exceedsBalance = isUseMode && selectableUseHoursCap !== null && parsedHours > selectableUseHoursCap;
    const startTimeOptions = useMemo(
        () => (isUseMode && isHoursValid ? getOffsetUseStartTimeOptions(parsedHours) : []),
        [isUseMode, isHoursValid, parsedHours]
    );
    const endTime = useMemo(() => {
        if (!isUseMode || !isHoursValid || !startTime) return null;
        return getOffsetUseEndTime(startTime, parsedHours);
    }, [isUseMode, isHoursValid, startTime, parsedHours]);
    const isTimeSlotValid = !isUseMode || (Boolean(startTime) && Boolean(endTime));
    const useAvailabilityHint = useMemo(() => {
        if (!isUseMode || selectableUseHoursCap === null || selectableUseHoursCap <= 0) return '';
        const template = t('offsetUseAvailabilityHint', 'Available: {{count}} hour(s). Minimum use is 1 hour.');
        return template.replace('{{count}}', String(selectableUseHoursCap));
    }, [isUseMode, selectableUseHoursCap, t]);
    const isFormValid = isDateValid && isHoursValid && reason.trim().length >= 20 && !exceedsBalance && isTimeSlotValid;

    useEffect(() => {
        if (!isUseMode) return;
        if (!isHoursValid || !startTimeOptions.length) {
            if (startTime) {
                setStartTime('');
            }
            return;
        }
        if (!startTimeOptions.includes(startTime)) {
            setStartTime(startTimeOptions[0]);
        }
    }, [isUseMode, isHoursValid, startTimeOptions, startTime]);

    return {
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
    };
};
