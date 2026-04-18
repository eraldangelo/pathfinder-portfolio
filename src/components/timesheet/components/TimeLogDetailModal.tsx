import React from 'react';
import type { DailyLog, TimeEvent } from '../../../data/timesheet';
import { useTranslation } from '../../../contexts/LanguageContext';
import { modalOverlay } from '../../common/styles/ui';

// Icons
const IpIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const ClockIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;


interface TimeLogDetailModalProps {
    log: DailyLog | null;
    onClose: () => void;
}

const EventDetail: React.FC<{ title: string; event: TimeEvent | null }> = ({ title, event }) => {
    const { t } = useTranslation();
    return (
        <div className="py-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
            {event ? (
                <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <ClockIcon />
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <IpIcon />
                        <span>{event.ip}</span>
                    </div>
                </div>
            ) : (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 italic">{t('notRecorded', 'Not recorded.')}</p>
            )}
        </div>
    );
};


const TimeLogDetailModal: React.FC<TimeLogDetailModalProps> = ({ log, onClose }) => {
    const { t, locale } = useTranslation();
    if (!log) return null;
    
    const formattedDate = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(log.date);

    const events = [
        { title: t('amTimeIn', 'AM TIME IN'), data: log.timeIn },
        { title: t('amTimeOut', 'AM TIME OUT'), data: log.lunchStart },
        { title: t('pmTimeIn', 'PM TIME IN'), data: log.lunchEnd },
        { title: t('pmTimeOut', 'PM TIME OUT'), data: log.timeOut },
    ];

    return (
        <div 
            className={`${modalOverlay} z-[60] flex items-center justify-center p-4 animate-fade-in`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-detail-title"
        >
            <div 
                className="relative flex flex-col w-full max-w-lg bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-white/30 dark:border-white/20 rounded-3xl shadow-2xl text-gray-800 dark:text-white transform opacity-0 scale-95 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="relative p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-center items-center flex-shrink-0">
                    <h2 id="log-detail-title" className="text-lg font-bold text-[#004097] dark:text-blue-400">
                        {t('logDetails', 'Log Details')}
                    </h2>
                    <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2">
                        <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600" aria-label={t('closeModal', 'Close')} />
                    </div>
                </header>

                <div className="p-6">
                    <p className="font-semibold text-center mb-4 text-gray-700 dark:text-gray-300">{formattedDate}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 border-t border-black/10 dark:border-white/10 pt-2">
                    {events.map(event => (
                        <EventDetail key={event.title} title={event.title} event={event.data} />
                    ))}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; animation-delay: 0.05s; }
            `}</style>
        </div>
    );
};

export default TimeLogDetailModal;
