import React from 'react';
import type { NotificationRecord } from './notificationUtils';
import { parseLocalDateKey } from '../../../utils/timesheet';

const stripBracketTokens = (value: string) => value.replace(/\[\[|\]\]/g, '');
const stripBranchSuffix = (value: string) => value.replace(/\s*\([^)]*\)\s*$/, '').trim();

export const buildLeadEndorsedMessage = (leadName: string, counsellorName: string) =>
    `[[${leadName}]]'s status has been changed to Genuine and endorsed to [[${counsellorName}]].`;

export const normalizeLeadEndorsedMessage = (message: string) => {
    const cleaned = stripPathfinderPrefix(message);
    const patterns: RegExp[] = [
        /^Lead\s+\[\[(.+?)\]\]\s+tagged\s+Genuine\s+and\s+endorsed\s+to\s+\[\[(.+?)\]\](?:\s*\([^)]*\))?\.?$/i,
        /^Lead\s+(.+?)\s+tagged\s+Genuine\s+and\s+endorsed\s+to\s+(.+?)(?:\s*\([^)]*\))?\.?$/i,
        /^(.+?)'s\s+profile\s+has\s+been\s+tagged\s+as\s+Genuine\s+and\s+Endorsed\s+to\s+(.+?)(?:\s*\([^)]*\))?\.?$/i,
        /^(.+?)'s\s+status\s+has\s+been\s+changed\s+to\s+Genuine\s+and\s+endorsed\s+to\s+(.+?)(?:\s*\([^)]*\))?\.?$/i,
    ];
    for (const pattern of patterns) {
        const match = cleaned.match(pattern);
        if (!match) continue;
        const leadName = stripBranchSuffix(stripBracketTokens(match[1] ?? '')).trim();
        const counsellorName = stripBranchSuffix(stripBracketTokens(match[2] ?? '')).trim();
        if (leadName && counsellorName) {
            return buildLeadEndorsedMessage(leadName, counsellorName);
        }
    }
    return null;
};

export const detectEventKey = (notification: NotificationRecord) => {
    if (notification.eventKey) return notification.eventKey;
    const message = notification.message.toLowerCase();
    if (message.includes('assessment submission')) return 'newSubmission';
    if (message.includes('endorsed')) return 'leadEndorsed';
    if (message.includes('timed in') || message.includes('time in')) return 'timeIn';
    if ((message.includes('lunch') && message.includes('started')) || message.includes('lunch start')) return 'lunchStart';
    if (message.includes('back to work') || message.includes('welcome back')) return 'lunchEnd';
    if (message.includes('timed out') || message.includes('time out')) return 'timeOut';
    if (message.includes('leave request')) {
        if (message.includes('approved') || message.includes('rejected')) return 'leaveDecision';
        if (message.includes('submitted') || message.includes('pending')) return 'leaveRequest';
    }
    if (message.includes('offset request')) {
        if (message.includes('approved') || message.includes('rejected')) return 'offsetDecision';
        if (message.includes('submitted') || message.includes('pending')) return 'offsetRequest';
    }
    return null;
};

export const stripPathfinderPrefix = (message: string) => message.replace(/^Pathfinder:\s*/i, '').trim();

export const parseLegacyMessage = (message: string) => {
    const normalized = stripPathfinderPrefix(message);
    const match = normalized.match(/^(.+?)\s*\([^)]*\)\s*(.+?)\s*at\s*(.+?)\.?$/i);
    if (!match) return { name: null, time: null, isTeam: false };
    return {
        name: match[1]?.trim() || null,
        time: match[3]?.trim() || null,
        isTeam: true,
    };
};

export const renderHighlightedMessage = (text: string) => {
    const regex = /\[\[(.+?)\]\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        parts.push(
            <span key={`hl-${match.index}`} className="font-semibold text-gray-900 dark:text-white">
                {match[1]}
            </span>
        );
        lastIndex = match.index + match[0].length;
    }
    if (parts.length) {
        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }
        return <>{parts}</>;
    }

    const profileMatch = text.match(/^(.+?)'s\s+profile\s+has\s+been\s+tagged\s+as\s+Genuine\s+and\s+Endorsed\s+to\s+(.+?)(\.\s*|$)/i);
    if (profileMatch) {
        const leadName = stripBracketTokens(profileMatch[1]).trim();
        const counsellorRaw = profileMatch[2] ?? '';
        const counsellorName = stripBranchSuffix(stripBracketTokens(counsellorRaw));
        const suffix = profileMatch[3] ?? '';
        if (leadName && counsellorName) {
            return (
                <>
                    <span className="font-semibold text-gray-900 dark:text-white">{leadName}</span>
                    {"'s profile has been tagged as Genuine and Endorsed to "}
                    <span className="font-semibold text-gray-900 dark:text-white">{counsellorName}</span>
                    {suffix}
                </>
            );
        }
    }

    const legacyMatch = text.match(/^(Lead\s+)?(.+?)\s+tagged\s+Genuine\s+and\s+endorsed\s+to\s+(.+?)(\.\s*|$)/i);
    if (legacyMatch) {
        const leadPrefix = legacyMatch[1] ?? '';
        const leadName = stripBracketTokens(legacyMatch[2]).trim();
        const counsellorRaw = legacyMatch[3] ?? '';
        const counsellorName = stripBranchSuffix(stripBracketTokens(counsellorRaw));
        const suffix = legacyMatch[4] ?? '';
        if (leadName && counsellorName) {
            return (
                <>
                    {leadPrefix}
                    <span className="font-semibold text-gray-900 dark:text-white">{leadName}</span>
                    {" tagged Genuine and endorsed to "}
                    <span className="font-semibold text-gray-900 dark:text-white">{counsellorName}</span>
                    {suffix}
                </>
            );
        }
    }

    const statusMatch = text.match(/^(.+?)'s\s+status\s+has\s+been\s+changed\s+to\s+Genuine\s+and\s+endorsed\s+to\s+(.+?)(\.\s*|$)/i);
    if (statusMatch) {
        const leadName = stripBracketTokens(statusMatch[1]).trim();
        const counsellorRaw = statusMatch[2] ?? '';
        const counsellorName = stripBranchSuffix(stripBracketTokens(counsellorRaw));
        const suffix = statusMatch[3] ?? '';
        if (leadName && counsellorName) {
            return (
                <>
                    <span className="font-semibold text-gray-900 dark:text-white">{leadName}</span>
                    {"'s status has been changed to Genuine and endorsed to "}
                    <span className="font-semibold text-gray-900 dark:text-white">{counsellorName}</span>
                    {suffix}
                </>
            );
        }
    }

    const endorsedMatch = text.match(/(endorsed to )(.+?)(\.\s*|$)/i);
    if (endorsedMatch && typeof endorsedMatch.index === 'number') {
        const before = text.slice(0, endorsedMatch.index);
        const nameRaw = endorsedMatch[2] ?? '';
        const nameClean = stripBracketTokens(nameRaw).replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (nameClean) {
            const suffix = endorsedMatch[3] ?? '';
            const after = text.slice(endorsedMatch.index + endorsedMatch[0].length);
            return (
                <>
                    {before}
                    {endorsedMatch[1]}
                    <span className="font-semibold text-gray-900 dark:text-white">{nameClean}</span>
                    {suffix}
                    {after}
                </>
            );
        }
    }

    return text;
};

export const formatLeaveDate = (value?: string | null) => {
    if (!value) return '';
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

export const formatOffsetHours = (
    value: number | null | undefined,
    t: (key: string, options?: { [key: string]: string | number } | string) => string
) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '';
    const amount = Number.isInteger(value) ? value.toFixed(0) : String(value);
    return `${amount} ${value === 1 ? t('hour', 'hour') : t('hours', 'hours')}`;
};

export const formatPossessive = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return '';
    const lastChar = trimmed[trimmed.length - 1];
    return lastChar.toLowerCase() === 's' ? `${trimmed}'` : `${trimmed}'s`;
};

export const getStatusLabel = (eventKey: string | null) => {
    switch (eventKey) {
        case 'timeIn':
            return 'Timed In';
        case 'lunchStart':
            return 'On Lunch';
        case 'lunchEnd':
            return 'Back to Work';
        case 'timeOut':
            return 'Timed Out';
        default:
            return '';
    }
};
