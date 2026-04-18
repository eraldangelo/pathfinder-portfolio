// utils/date.ts
import { Timestamp } from '../services/firebase';
import type { FirebaseTimestamp } from '../types';

/**
 * Parses a date value (string, Date, or Firestore Timestamp) into a valid Date object.
 * Returns null if the date input is invalid or null/undefined.
 * This is a robust helper as suggested by the engineering team review.
 */
export const parseDate = (dateInput: string | Date | FirebaseTimestamp | null | undefined): Date | null => {
    if (!dateInput) {
        return null;
    }
    if (dateInput instanceof Date) {
        return dateInput;
    }
    if (typeof dateInput === 'string') {
        const date = new Date(dateInput);
        return isNaN(date.getTime()) ? null : date;
    }
    // FIX: Replaced `instanceof Timestamp` with a more robust duck-typing check for Firestore Timestamp objects to resolve a TypeScript type-narrowing error. The new implementation correctly handles both class instances and plain objects that conform to the FirebaseTimestamp interface.
    // Duck-typing for Firestore Timestamps. This covers both instances of Timestamp
    // and plain objects that have been deserialized but still have the toDate method.
    if (typeof (dateInput as any).toDate === 'function') {
        return (dateInput as FirebaseTimestamp).toDate();
    }
    console.warn('Unexpected date format received by parseDate:', dateInput);
    return null;
};


/**
 * Formats a date value into a locale-aware, human-readable string.
 * This function serves as a centralized formatter for the entire application.
 * @param dateInput - The date to format (string, Date, Timestamp, null, or undefined).
 * @param options - Intl.DateTimeFormat options to customize the output.
 * @param locale - The locale to use for formatting (e.g., 'en-US', 'ja-JP').
 * @returns The formatted date string, or an empty string if the input is invalid.
 */
export const formatReadableDate = (
    dateInput: string | Date | FirebaseTimestamp | null | undefined,
    options: Intl.DateTimeFormatOptions,
    locale: string = 'en-US'
): string => {
    const date = parseDate(dateInput);
    if (!date) return '';

    try {
        return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
        console.error(`Error formatting date for locale ${locale}:`, error);
        // Fallback to a default, safe locale if the provided one fails.
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }
};

export const formatDdMmmYyyy = (value: string | null | undefined) => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return '';

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndexByKey = new Map(monthNames.map((name, index) => [name.toLowerCase(), index]));

    const formatDate = (year: string, monthIndex: number, day: string) => {
        if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex >= monthNames.length) {
            return null;
        }
        const dayValue = Number(day);
        if (!Number.isFinite(dayValue) || dayValue < 1 || dayValue > 31) {
            return null;
        }
        const yearValue = Number(year);
        if (!Number.isFinite(yearValue) || yearValue < 1000) {
            return null;
        }
        return `${String(dayValue).padStart(2, '0')}-${monthNames[monthIndex]}-${String(yearValue).padStart(4, '0')}`;
    };

    const ymdDashMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdDashMatch) {
        const [, year, month, day] = ymdDashMatch;
        const formatted = formatDate(year, Number(month) - 1, day);
        if (formatted) return formatted;
    }

    const ymdSlashMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    if (ymdSlashMatch) {
        const [, year, month, day] = ymdSlashMatch;
        const formatted = formatDate(year, Number(month) - 1, day);
        if (formatted) return formatted;
    }

    const dmySlashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmySlashMatch) {
        const [, day, month, year] = dmySlashMatch;
        const formatted = formatDate(year, Number(month) - 1, day);
        if (formatted) return formatted;
    }

    const dmyMonthMatch = trimmed.match(/^(\d{1,2})[-\\s]([a-zA-Z]{3,})[-\\s](\d{4})$/);
    if (dmyMonthMatch) {
        const [, day, monthRaw, year] = dmyMonthMatch;
        const monthKey = monthRaw.trim().slice(0, 3).toLowerCase();
        const monthIndex = monthIndexByKey.get(monthKey);
        if (typeof monthIndex === 'number') {
            const formatted = formatDate(year, monthIndex, day);
            if (formatted) return formatted;
        }
    }

    return trimmed;
};
