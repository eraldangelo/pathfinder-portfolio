import type { DailyLog, TimeEvent } from '../data/timesheet';
import type { TimeLogEntry, TimeTrackingStatus } from '../types';
import { parseDate } from './date';

export type TimesheetEventKey = 'timeIn' | 'lunchStart' | 'lunchEnd' | 'timeOut';

export interface FirestoreTimeEvent {
    time?: string;
    at?: unknown;
    ip?: string | null;
    location?: string | null;
}

export interface FirestoreTimesheetDoc {
    dateKey?: string;
    timeIn?: FirestoreTimeEvent | null;
    lunchStart?: FirestoreTimeEvent | null;
    lunchEnd?: FirestoreTimeEvent | null;
    timeOut?: FirestoreTimeEvent | null;
    totalHours?: string | null;
    status?: string | null;
    remarks?: string | null;
    notes?: string | null;
    updatedAt?: unknown;
    createdAt?: unknown;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EVENT_ORDER: TimesheetEventKey[] = ['timeIn', 'lunchStart', 'lunchEnd', 'timeOut'];
const TIMESHEET_TZ_OFFSET_MINUTES = 8 * 60; // UTC+8 (Asia/Manila)

const getTimesheetDateParts = (date: Date): { year: number; month: number; day: number } => {
    const offsetMs = TIMESHEET_TZ_OFFSET_MINUTES * 60 * 1000;
    const shifted = new Date(date.getTime() + offsetMs);
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth() + 1,
        day: shifted.getUTCDate(),
    };
};

export const getLocalDateKey = (date: Date = new Date()): string => {
    const { year, month, day } = getTimesheetDateParts(date);
    return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
};

export const getNextTimesheetReset = (date: Date = new Date()): Date => {
    const offsetMs = TIMESHEET_TZ_OFFSET_MINUTES * 60 * 1000;
    const shifted = new Date(date.getTime() + offsetMs);
    const nextMidnightShifted = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + 1));
    return new Date(nextMidnightShifted.getTime() - offsetMs);
};

export const parseLocalDateKey = (dateKey: string): Date => {
    const [year, month, day] = dateKey.split('-').map((value) => Number(value));
    return new Date(year, month - 1, day);
};

const toTimeEvent = (event?: FirestoreTimeEvent | null): TimeEvent | null => {
    if (!event?.time) return null;
    return {
        time: event.time,
        ip: event.ip || 'N/A',
        location: event.location || 'N/A',
    };
};

const getEventDate = (event?: FirestoreTimeEvent | null): Date | null => {
    if (!event) return null;
    return parseDate(event.at as any);
};

const formatHours = (totalMinutes: number): string => {
    const clamped = Math.max(0, Math.round(totalMinutes));
    const hours = Math.floor(clamped / 60);
    const minutes = clamped % 60;
    return `${hours}h ${minutes}m`;
};

const normalizeTimesheetStatus = (rawStatus: unknown, fallback: DailyLog['status']): DailyLog['status'] => {
    if (!rawStatus) return fallback;
    const normalized = String(rawStatus).trim().toLowerCase();
    if (!normalized) return fallback;

    if (normalized.includes('lieu')) return 'On Leave';
    if (normalized.includes('offset')) return 'Offset';

    const statusMap: Record<string, DailyLog['status']> = {
        present: 'Present',
        absent: 'Absent',
        'on leave': 'On Leave',
        onleave: 'On Leave',
        leave: 'On Leave',
        offset: 'Offset',
        'offset use': 'Offset',
        'use offset': 'Offset',
        holiday: 'Holiday',
        weekend: 'Weekend',
        pending: 'Pending',
    };

    return statusMap[normalized] ?? fallback;
};

const computeTotalHoursFromDoc = (doc: FirestoreTimesheetDoc): string | null => {
    const timeInAt = getEventDate(doc.timeIn);
    const timeOutAt = getEventDate(doc.timeOut);
    if (!timeInAt || !timeOutAt) return null;

    let totalMinutes = (timeOutAt.getTime() - timeInAt.getTime()) / 60000;
    if (totalMinutes < 0) return null;

    const lunchStartAt = getEventDate(doc.lunchStart);
    const lunchEndAt = getEventDate(doc.lunchEnd);
    if (lunchStartAt && lunchEndAt && lunchEndAt > lunchStartAt) {
        totalMinutes -= (lunchEndAt.getTime() - lunchStartAt.getTime()) / 60000;
    }

    if (totalMinutes < 0) return null;
    return formatHours(totalMinutes);
};

export const mapTimesheetDocToDailyLog = (doc: FirestoreTimesheetDoc): DailyLog | null => {
    if (!doc?.dateKey) return null;

    const date = parseLocalDateKey(doc.dateKey);
    const day = WEEKDAYS[date.getDay()];
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    const fallbackStatus: DailyLog['status'] = isWeekend ? 'Weekend' : doc.timeIn?.time ? 'Present' : 'Pending';
    const status = normalizeTimesheetStatus(doc.status, fallbackStatus);

    return {
        date,
        day,
        status,
        timeIn: toTimeEvent(doc.timeIn),
        lunchStart: toTimeEvent(doc.lunchStart),
        lunchEnd: toTimeEvent(doc.lunchEnd),
        timeOut: toTimeEvent(doc.timeOut),
        totalHours: doc.totalHours ?? computeTotalHoursFromDoc(doc),
        notes: doc.notes ?? null,
        remarks: doc.remarks ?? null,
    };
};

export const buildTimeLogEntries = (doc: FirestoreTimesheetDoc, t?: (key: string) => string): TimeLogEntry[] => {
    const entries: TimeLogEntry[] = [];

    EVENT_ORDER.forEach((key) => {
        const event = doc[key] as FirestoreTimeEvent | null | undefined;
        if (event?.time) {
            entries.push({
                event: t ? t(key) : key,
                eventKey: key,
                time: event.time,
            });
        }
    });

    return entries;
};

export const deriveTimeTrackingStatus = (doc: FirestoreTimesheetDoc): TimeTrackingStatus => {
    if (doc.timeOut?.time) return 'timed-out';
    if (doc.lunchStart?.time && !doc.lunchEnd?.time) return 'on-lunch';
    if (doc.timeIn?.time) return 'timed-in';
    return 'timed-out';
};
