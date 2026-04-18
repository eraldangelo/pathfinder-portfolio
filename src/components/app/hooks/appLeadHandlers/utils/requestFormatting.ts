import { parseLocalDateKey } from '../../../../../utils/timesheet';

export const formatLocalDate = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const parsed = parseLocalDateKey(value);
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
            .format(parsed)
            .replace(/ /g, '-');
    }
    return value;
};

export const formatLeaveRange = (from: string, to: string, t: (key: string, fallback?: string) => string) => {
    const fromLabel = formatLocalDate(from);
    const toLabel = formatLocalDate(to);
    if (fromLabel && toLabel && fromLabel !== toLabel) {
        return `${fromLabel} ${t('to', 'to')} ${toLabel}`;
    }
    return fromLabel || toLabel;
};

export const formatOffsetHours = (value: number) => {
    const amount = Number.isInteger(value) ? value.toFixed(0) : String(value);
    return `${amount} ${value === 1 ? 'hour' : 'hours'}`;
};
