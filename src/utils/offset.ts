const OFFSET_TZ_OFFSET_MINUTES = 8 * 60; // UTC+8 (Asia/Manila)
export const OFFSET_USE_MIN_HOURS = 1;
export const OFFSET_USE_MAX_HOURS = 7;

const toFiniteNumber = (value: unknown): number | null => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const toNonNegativeNumber = (value: unknown): number => {
    const parsed = toFiniteNumber(value);
    if (parsed === null) return 0;
    return Math.max(0, parsed);
};

const toYear = (value: unknown): number | null => {
    const parsed = toFiniteNumber(value);
    if (parsed === null) return null;
    const year = Math.trunc(parsed);
    if (year < 1970 || year > 9999) return null;
    return year;
};

export const getOffsetUseSelectableCap = (value?: number | null): number => {
    const parsed = toFiniteNumber(value);
    if (parsed === null) return 0;
    return Math.max(0, Math.min(OFFSET_USE_MAX_HOURS, Math.floor(parsed)));
};

export const isValidOffsetUseHours = (value: number): boolean =>
    Number.isInteger(value) && value >= OFFSET_USE_MIN_HOURS && value <= OFFSET_USE_MAX_HOURS;

export const getOffsetResetYear = (date: Date = new Date()): number => {
    const offsetMs = OFFSET_TZ_OFFSET_MINUTES * 60 * 1000;
    const shifted = new Date(date.getTime() + offsetMs);
    return shifted.getUTCFullYear();
};

export interface OffsetState {
    balance: number;
    used: number;
    resetYear: number;
    shouldPersist: boolean;
}

interface ResolveOffsetStateParams {
    balance?: number | null;
    used?: number | null;
    resetYear?: number | null;
    currentYear?: number;
}

export const resolveOffsetState = ({
    balance,
    used,
    resetYear,
    currentYear = getOffsetResetYear(),
}: ResolveOffsetStateParams): OffsetState => {
    const normalizedBalance = toNonNegativeNumber(balance);
    const normalizedUsed = toNonNegativeNumber(used);
    const normalizedResetYear = toYear(resetYear);
    const hasNumericBalance = typeof balance === 'number' && Number.isFinite(balance);
    const hasNumericUsed = typeof used === 'number' && Number.isFinite(used);

    let nextBalance = normalizedBalance;
    let nextUsed = normalizedUsed;
    let nextResetYear = normalizedResetYear;
    let shouldPersist = false;

    if (!hasNumericBalance || balance < 0) {
        shouldPersist = true;
    }
    if (!hasNumericUsed || used < 0) {
        shouldPersist = true;
    }

    if (nextResetYear === null) {
        nextResetYear = currentYear;
        shouldPersist = true;
    } else if (currentYear > nextResetYear) {
        if (nextBalance !== 0) {
            nextBalance = 0;
        }
        if (nextUsed !== 0) {
            nextUsed = 0;
        }
        nextResetYear = currentYear;
        shouldPersist = true;
    }

    if (nextResetYear !== normalizedResetYear) {
        shouldPersist = true;
    }

    return {
        balance: nextBalance,
        used: nextUsed,
        resetYear: nextResetYear,
        shouldPersist,
    };
};
