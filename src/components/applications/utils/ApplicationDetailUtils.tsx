import React from 'react';
import { getCountryCode } from '../../../data/reference/countries';
import type { TranslateFn } from '../../../types/translation';
import FlagIcon from '@/components/common/components/FlagIcon';

export type { TranslateFn } from '../../../types/translation';

const STATUS_KEY_REGEX = /[\s-/]/g;
const STATUS_NORMALIZE_REGEX = /[^a-z0-9]/g;
const STATUS_DISPLAY_BY_NORMALIZED_KEY: Record<string, string> = {
    submitted: 'Submitted',
    submittedapplication: 'Submitted Application',
    moreinformationrequired: 'More Information Required',
    withdrawn: 'Withdrawn',
    applicationrejected: 'Application Rejected',
    conditionaloffer: 'Conditional Offer',
    unconditionaloffer: 'Unconditional Offer',
    paymentprocessed: 'Payment Processed',
    coeloareceived: 'CoE/LoA Received',
    visalodged: 'Visa Lodged',
    visagranted: 'Visa Granted',
    visarefused: 'Visa Refused',
    visawithdrawn: 'Visa Withdrawn',
    predepartureorientation: 'Pre-Departure Orientation',
    refundprocessing: 'Refund Processing',
    applicationended: 'Application Ended',
};

const statusToKey = (status: string) => String(status || '').replace(STATUS_KEY_REGEX, '');

const normalizeStatusKey = (status: string) =>
    String(status || '')
        .trim()
        .toLowerCase()
        .replace(STATUS_NORMALIZE_REGEX, '');

const humanizeStatus = (status: string) =>
    String(status || '')
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();

export const formatApplicationStatusLabel = (status: string) => {
    const trimmed = String(status || '').trim();
    if (!trimmed) return '';

    const normalizedKey = normalizeStatusKey(trimmed);
    if (normalizedKey && STATUS_DISPLAY_BY_NORMALIZED_KEY[normalizedKey]) {
        return STATUS_DISPLAY_BY_NORMALIZED_KEY[normalizedKey];
    }

    return humanizeStatus(trimmed);
};

export const getStatusLabel = (t: TranslateFn, status: string) => {
    const formattedLabel = formatApplicationStatusLabel(status);
    return t(statusToKey(formattedLabel || status), formattedLabel || status);
};

export const getStatusChipClass = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('granted')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (lowerStatus.includes('unconditional') || lowerStatus.includes('received')) return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
    if (lowerStatus.includes('required') || lowerStatus.includes('refused') || lowerStatus.includes('withdrawn') || lowerStatus.includes('rejected')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (lowerStatus.includes('conditional') || lowerStatus.includes('refund')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (lowerStatus.includes('submitted') || lowerStatus.includes('lodged') || lowerStatus.includes('processed')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

export const getStatusTimelineDotClass = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('granted')) return 'bg-green-500';
    if (lowerStatus.includes('unconditional') || lowerStatus.includes('received')) return 'bg-sky-500';
    if (lowerStatus.includes('required') || lowerStatus.includes('refused') || lowerStatus.includes('withdrawn') || lowerStatus.includes('rejected')) return 'bg-red-500';
    if (lowerStatus.includes('conditional') || lowerStatus.includes('refund')) return 'bg-yellow-500';
    if (lowerStatus.includes('submitted') || lowerStatus.includes('lodged') || lowerStatus.includes('processed')) return 'bg-blue-500';
    return 'bg-gray-500';
};

const CitizenshipFlagBase: React.FC<{ country: string, className?: string }> = ({ country, className = "w-6 h-[18px] rounded-sm object-contain" }) => {
    const code = getCountryCode(country);
    if (code) {
        return (
            <FlagIcon
                countryCode={code}
                label={country}
                className={className}
            />
        );
    }
    return <div className={`flex items-center justify-center text-xs font-bold bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 ${className}`}>?</div>;
};

export const CitizenshipFlag = React.memo(CitizenshipFlagBase);

CitizenshipFlag.displayName = 'CitizenshipFlag';
