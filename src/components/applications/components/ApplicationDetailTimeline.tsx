import React from 'react';
import type { ApplicationStatusHistory } from '../../../data/applications';
import type { FirebaseTimestamp } from '../../../types';
import { useTranslation } from '../../../contexts/LanguageContext';
import { getStatusLabel, getStatusTimelineDotClass } from '../utils/ApplicationDetailUtils';

interface TimelineSectionProps {
    history: ApplicationStatusHistory[];
    formatTimelineDate: (date: FirebaseTimestamp) => string;
}

const TimelineSection: React.FC<TimelineSectionProps> = ({ history, formatTimelineDate }) => {
    const { t } = useTranslation();

    return (
        <div className="p-6 rounded-2xl backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-lg border border-white/40 dark:border-white/10">
            <h2 className="text-xl font-semibold text-[#004097] dark:text-blue-300 mb-6">{t('applicationTimeline')}</h2>
            <ol className="relative border-l border-gray-300 dark:border-gray-600">
                {history.map((item, index) => (
                    <li key={index} className="mb-10 ml-6">
                        <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white/30 dark:ring-black/20 ${getStatusTimelineDotClass(item.status)}`}>
                            {/* Optional icon inside dot */}
                        </span>
                        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
                            <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white">{getStatusLabel(t, item.status)}</h3>
                            <time className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">{formatTimelineDate(item.date)}</time>
                            {item.notes && <p className="text-base font-normal text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{item.notes}</p>}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default TimelineSection;
