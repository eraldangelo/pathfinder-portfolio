import {
    ALL_MONTHS_VALUE,
    ALL_QUARTERS_VALUE,
    QUARTER_1_VALUE,
    QUARTER_2_VALUE,
    QUARTER_3_VALUE,
    QUARTER_4_VALUE,
} from '../../utils/funnelFilters';

export const DASHBOARD_MONTH_OPTIONS = [
    { value: ALL_MONTHS_VALUE, label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
] as const;

const QUARTER_MONTH_VALUE_MAP: Record<string, ReadonlySet<string>> = {
    [QUARTER_1_VALUE]: new Set(['0', '1', '2']),
    [QUARTER_2_VALUE]: new Set(['3', '4', '5']),
    [QUARTER_3_VALUE]: new Set(['6', '7', '8']),
    [QUARTER_4_VALUE]: new Set(['9', '10', '11']),
};

const normalizeFilterValue = (value?: string | null) => String(value ?? '').trim().toLowerCase();

export const getDashboardMonthOptions = (selectedQuarter: string) => {
    const normalizedQuarter = normalizeFilterValue(selectedQuarter);
    if (!normalizedQuarter || normalizedQuarter === ALL_QUARTERS_VALUE) {
        return DASHBOARD_MONTH_OPTIONS;
    }

    const allowedMonthValues = QUARTER_MONTH_VALUE_MAP[normalizedQuarter];
    if (!allowedMonthValues) {
        return DASHBOARD_MONTH_OPTIONS;
    }

    return DASHBOARD_MONTH_OPTIONS.filter(
        (option) => option.value === ALL_MONTHS_VALUE || allowedMonthValues.has(option.value)
    );
};

export const DASHBOARD_QUARTER_OPTIONS = [
    { value: ALL_QUARTERS_VALUE, label: 'All Quarter' },
    { value: QUARTER_1_VALUE, label: 'Quarter 1' },
    { value: QUARTER_2_VALUE, label: 'Quarter 2' },
    { value: QUARTER_3_VALUE, label: 'Quarter 3' },
    { value: QUARTER_4_VALUE, label: 'Quarter 4' },
] as const;
