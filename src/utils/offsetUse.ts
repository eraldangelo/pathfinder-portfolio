import { isValidOffsetUseHours } from './offset';

const WORKDAY_START_MINUTES = 9 * 60;
const WORKDAY_END_MINUTES = 17 * 60;
const LUNCH_START_MINUTES = 12 * 60;
const LUNCH_END_MINUTES = 13 * 60;

const pad = (value: number) => String(value).padStart(2, '0');

const getLunchOverlapMinutes = (startMinutes: number, endMinutes: number) => {
    const overlapStart = Math.max(startMinutes, LUNCH_START_MINUTES);
    const overlapEnd = Math.min(endMinutes, LUNCH_END_MINUTES);
    return Math.max(0, overlapEnd - overlapStart);
};

const getUsageMinutesBetween = (startMinutes: number, endMinutes: number): number | null => {
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return null;
    if (startMinutes < WORKDAY_START_MINUTES || endMinutes > WORKDAY_END_MINUTES || endMinutes <= startMinutes) {
        return null;
    }

    const elapsedMinutes = endMinutes - startMinutes;
    const lunchOverlap = getLunchOverlapMinutes(startMinutes, endMinutes);
    const usageMinutes = elapsedMinutes - lunchOverlap;
    return usageMinutes >= 0 ? usageMinutes : null;
};

export const parseOffsetUseTime = (value?: string | null): number | null => {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
    const [hourRaw, minuteRaw] = value.split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
};

export const formatOffsetUseTime = (minutes: number): string => {
    const clamped = Math.max(0, Math.floor(minutes));
    const hours = Math.floor(clamped / 60);
    const mins = clamped % 60;
    return `${pad(hours)}:${pad(mins)}`;
};

export const getOffsetUseStartTimeOptions = (hours: number): string[] => {
    if (!isValidOffsetUseHours(hours)) return [];

    const options: string[] = [];
    for (let minute = WORKDAY_START_MINUTES; minute < WORKDAY_END_MINUTES; minute += 60) {
        if (minute === LUNCH_START_MINUTES) continue;
        const startTime = formatOffsetUseTime(minute);
        if (getOffsetUseEndTime(startTime, hours)) {
            options.push(startTime);
        }
    }
    return options;
};

export const getOffsetUseEndTime = (startTime: string, hours: number): string | null => {
    if (!isValidOffsetUseHours(hours)) return null;
    const startMinutes = parseOffsetUseTime(startTime);
    if (startMinutes === null) return null;
    if (startMinutes >= LUNCH_START_MINUTES && startMinutes < LUNCH_END_MINUTES) return null;
    const requestedUsageMinutes = hours * 60;

    for (let endMinutes = startMinutes + 60; endMinutes <= WORKDAY_END_MINUTES; endMinutes += 60) {
        const usageMinutes = getUsageMinutesBetween(startMinutes, endMinutes);
        if (usageMinutes === requestedUsageMinutes) {
            return formatOffsetUseTime(endMinutes);
        }
    }

    return null;
};

export const getOffsetUseUsageHours = (startTime?: string | null, endTime?: string | null): number | null => {
    const startMinutes = parseOffsetUseTime(startTime);
    const endMinutes = parseOffsetUseTime(endTime);
    if (startMinutes === null || endMinutes === null) return null;
    const usageMinutes = getUsageMinutesBetween(startMinutes, endMinutes);
    if (usageMinutes === null) return null;
    return usageMinutes / 60;
};
