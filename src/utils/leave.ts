import { parseLocalDateKey } from './timesheet';

const LEAVE_TZ_OFFSET_MINUTES = 8 * 60; // UTC+8 (Asia/Manila)

export const LEAVE_MONTHLY_ACCRUAL = 2;
export const LEAVE_MAX_BALANCE = 24;
export const LEAVE_MAX_CARRYOVER = 5;

const toNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    return 0;
};

const clampLeaveBalance = (value: number, maxBalance: number): number => {
    return Math.min(maxBalance, Math.max(0, value));
};

const getAccruedSinceJanuary = (currentMonthKey: string, monthlyAccrual: number, maxBalance: number): number => {
    const current = parseMonthKey(currentMonthKey);
    if (!current) {
        return clampLeaveBalance(monthlyAccrual, maxBalance);
    }
    const startKey = `${current.year}-01`;
    const monthsSinceStart = diffLeaveMonths(startKey, currentMonthKey);
    const monthsInclusive = Math.max(0, monthsSinceStart) + 1;
    return clampLeaveBalance(monthsInclusive * monthlyAccrual, maxBalance);
};

export const getLeaveMonthKey = (date: Date = new Date()): string => {
    const offsetMs = LEAVE_TZ_OFFSET_MINUTES * 60 * 1000;
    const shifted = new Date(date.getTime() + offsetMs);
    const year = shifted.getUTCFullYear();
    const month = shifted.getUTCMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
};

const parseMonthKey = (key: string): { year: number; month: number } | null => {
    const match = /^(\d{4})-(\d{2})$/.exec(key);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
        return null;
    }
    return { year, month };
};

export const diffLeaveMonths = (fromKey: string, toKey: string): number => {
    const from = parseMonthKey(fromKey);
    const to = parseMonthKey(toKey);
    if (!from || !to) return 0;
    return (to.year - from.year) * 12 + (to.month - from.month);
};

const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
};

export const countWeekdaysBetween = (startKey?: string | null, endKey?: string | null): number => {
    if (!startKey || !endKey) return 0;
    const start = parseLocalDateKey(startKey);
    const end = parseLocalDateKey(endKey);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

    const from = start <= end ? start : end;
    const to = start <= end ? end : start;
    let count = 0;
    const cursor = new Date(from);
    while (cursor <= to) {
        if (isWeekday(cursor)) {
            count += 1;
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
};

export interface LeaveState {
    balance: number;
    used: number;
    accruedMonthKey: string;
    shouldPersist: boolean;
}

interface ResolveLeaveStateParams {
    balance?: number | null;
    used?: number | null;
    accruedMonthKey?: string | null;
    currentMonthKey?: string;
    monthlyAccrual?: number;
    maxBalance?: number;
    maxCarryover?: number;
}

export const resolveLeaveState = ({
    balance,
    used,
    accruedMonthKey,
    currentMonthKey = getLeaveMonthKey(),
    monthlyAccrual = LEAVE_MONTHLY_ACCRUAL,
    maxBalance = LEAVE_MAX_BALANCE,
    maxCarryover = LEAVE_MAX_CARRYOVER,
}: ResolveLeaveStateParams): LeaveState => {
    const rawBalance = toNumber(balance);
    const rawUsed = toNumber(used);
    const normalizedBalance = clampLeaveBalance(rawBalance, maxBalance);
    const normalizedUsed = Math.max(0, rawUsed);
    const hasBalance = typeof balance === 'number' && Number.isFinite(balance);
    const hasUsed = typeof used === 'number' && Number.isFinite(used);

    let nextBalance = normalizedBalance;
    let nextUsed = normalizedUsed;
    let nextAccruedMonthKey = typeof accruedMonthKey === 'string' && accruedMonthKey.trim() !== '' ? accruedMonthKey : '';
    let shouldPersist = false;

    if (rawBalance !== normalizedBalance) {
        shouldPersist = true;
    }
    if (rawUsed !== normalizedUsed) {
        shouldPersist = true;
    }

    const currentParts = parseMonthKey(currentMonthKey);
    const accruedParts = nextAccruedMonthKey ? parseMonthKey(nextAccruedMonthKey) : null;
    if (currentParts && accruedParts && currentParts.year !== accruedParts.year) {
        const carryoverBalance = clampLeaveBalance(normalizedBalance, maxCarryover);
        const accruedThisYear = getAccruedSinceJanuary(currentMonthKey, monthlyAccrual, maxBalance);
        nextBalance = clampLeaveBalance(carryoverBalance + accruedThisYear, maxBalance);
        if (nextUsed !== 0) {
            nextUsed = 0;
        }
        nextAccruedMonthKey = currentMonthKey;
        shouldPersist = true;
    }

    if (nextUsed !== normalizedUsed) {
        shouldPersist = true;
    }

    const expectedAccrued = getAccruedSinceJanuary(currentMonthKey, monthlyAccrual, maxBalance);
    const expectedAvailable = clampLeaveBalance(Math.max(0, expectedAccrued - nextUsed), maxBalance);

    if (!nextAccruedMonthKey) {
        if (!hasBalance) {
            nextBalance = expectedAvailable;
        } else if (!hasUsed && normalizedBalance === 0) {
            nextBalance = expectedAvailable;
        }
        nextAccruedMonthKey = currentMonthKey;
        shouldPersist = true;
    } else {
        const monthDiff = diffLeaveMonths(nextAccruedMonthKey, currentMonthKey);
        if (monthDiff > 0) {
            nextBalance = clampLeaveBalance(normalizedBalance + monthDiff * monthlyAccrual, maxBalance);
            nextAccruedMonthKey = currentMonthKey;
            shouldPersist = true;
        }
    }

    if (nextBalance < expectedAvailable) {
        nextBalance = expectedAvailable;
        shouldPersist = true;
    }

    if (nextAccruedMonthKey !== accruedMonthKey) {
        shouldPersist = true;
    }

    return {
        balance: nextBalance,
        used: nextUsed,
        accruedMonthKey: nextAccruedMonthKey || currentMonthKey,
        shouldPersist,
    };
};
