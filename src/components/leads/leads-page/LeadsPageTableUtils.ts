import type { AdminStatus } from './LeadsPageTypes';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GLASS_PILL_BASE = 'border backdrop-blur-sm shadow-sm';

export const STATUS_OPTIONS: AdminStatus[] = [
    'New Lead',
    'No Show',
    'No Response',
    'Undecided',
    'Genuine',
    'Non-Genuine',
    'Destination Not Offered',
    'Duplicate',
];

const toDateValue = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
        const parsed = (value as { toDate: () => Date }).toDate();
        return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
};

export const normalizePhoneDisplay = (phoneNumber: string, phoneCountryCode?: string) => {
    const rawNumber = phoneNumber || '';
    const digits = rawNumber.replace(/\D/g, '');
    if (!digits) return '';

    let countryCode = (phoneCountryCode || '').replace(/\D/g, '');
    let localDigits = digits;

    if (countryCode) {
        if (localDigits.startsWith(countryCode)) {
            localDigits = localDigits.slice(countryCode.length);
        } else if (countryCode === '63' && localDigits.startsWith('0') && localDigits.length === 11) {
            localDigits = localDigits.slice(1);
        }
    } else {
        if (localDigits.startsWith('0') && localDigits.length === 11) {
            countryCode = '63';
            localDigits = localDigits.slice(1);
        } else if (localDigits.length > 10) {
            countryCode = localDigits.slice(0, localDigits.length - 10);
            localDigits = localDigits.slice(-10);
        } else if (localDigits.length === 10) {
            countryCode = '63';
        }
    }

    if (localDigits.length > 10) {
        localDigits = localDigits.slice(-10);
    }

    if (localDigits.length < 10) {
        return countryCode ? `+${countryCode} ${localDigits}`.trim() : rawNumber;
    }

    const formattedLocal = `${localDigits.slice(0, 3)} ${localDigits.slice(3, 6)} ${localDigits.slice(6, 10)}`;
    return countryCode ? `+${countryCode} ${formattedLocal}` : formattedLocal;
};

export const formatSubmittedTimestamp = (submittedAt?: unknown) => {
    const date = toDateValue(submittedAt);
    if (!date) return '';
    const month = MONTH_NAMES[date.getMonth()];
    return `${month} ${date.getFullYear()}`;
};

export const getStatusChipClass = (status: AdminStatus) => {
    switch (status) {
        case 'New Lead':
            return `${GLASS_PILL_BASE} border-green-400/30 bg-green-500/15 text-green-800 dark:border-green-300/30 dark:bg-green-400/20 dark:text-green-200`;
        case 'No Show':
            return `${GLASS_PILL_BASE} border-red-400/35 bg-red-500/15 text-red-800 dark:border-red-300/35 dark:bg-red-400/20 dark:text-red-200`;
        case 'No Response':
            return `${GLASS_PILL_BASE} border-red-400/35 bg-red-500/15 text-red-800 dark:border-red-300/35 dark:bg-red-400/20 dark:text-red-200`;
        case 'Undecided':
            return `${GLASS_PILL_BASE} border-orange-400/35 bg-orange-500/15 text-orange-800 dark:border-orange-300/35 dark:bg-orange-400/20 dark:text-orange-200`;
        case 'Genuine':
            return `${GLASS_PILL_BASE} border-sky-400/35 bg-sky-500/15 text-sky-800 dark:border-sky-300/35 dark:bg-sky-400/20 dark:text-sky-200`;
        case 'Non-Genuine':
            return `${GLASS_PILL_BASE} border-slate-500/40 bg-slate-700/15 text-slate-800 dark:border-slate-300/35 dark:bg-slate-200/15 dark:text-slate-100`;
        case 'Destination Not Offered':
            return `${GLASS_PILL_BASE} border-yellow-400/35 bg-yellow-500/15 text-yellow-800 dark:border-yellow-300/35 dark:bg-yellow-400/20 dark:text-yellow-200`;
        case 'Duplicate':
            return `${GLASS_PILL_BASE} border-violet-400/35 bg-violet-500/15 text-violet-800 dark:border-violet-300/35 dark:bg-violet-400/20 dark:text-violet-200`;
        default:
            return `${GLASS_PILL_BASE} border-gray-400/30 bg-gray-500/15 text-gray-800 dark:border-gray-300/30 dark:bg-gray-400/20 dark:text-gray-200`;
    }
};

export const getVisaRefusalClass = (visaRefusal: 'Yes' | 'No') => {
    return visaRefusal === 'Yes'
        ? `${GLASS_PILL_BASE} border-red-400/35 bg-red-500/15 text-red-800 dark:border-red-300/35 dark:bg-red-400/20 dark:text-red-200`
        : `${GLASS_PILL_BASE} border-green-400/30 bg-green-500/15 text-green-800 dark:border-green-300/30 dark:bg-green-400/20 dark:text-green-200`;
};

export const getBranchChipClass = (branch: string) => {
    switch (String(branch || '').trim().toLowerCase()) {
        case 'manila':
            return `${GLASS_PILL_BASE} border-red-700/45 bg-red-700/20 text-red-900 dark:border-red-400/45 dark:bg-red-900/35 dark:text-red-200`;
        case 'davao':
        case 'cagayan de oro':
        case 'cagayan de oro city':
            return `${GLASS_PILL_BASE} border-sky-700/45 bg-sky-700/20 text-sky-900 dark:border-sky-400/45 dark:bg-sky-900/35 dark:text-sky-200`;
        case 'pampanga':
        case 'baguio':
        case 'baguio city':
            return `${GLASS_PILL_BASE} border-green-700/45 bg-green-700/20 text-green-900 dark:border-green-400/45 dark:bg-green-900/35 dark:text-green-200`;
        case 'cebu':
            return `${GLASS_PILL_BASE} border-violet-700/45 bg-violet-700/20 text-violet-900 dark:border-violet-400/45 dark:bg-violet-900/35 dark:text-violet-200`;
        default:
            return `${GLASS_PILL_BASE} border-gray-400/30 bg-gray-500/15 text-gray-800 dark:border-gray-300/30 dark:bg-gray-400/20 dark:text-gray-200`;
    }
};
