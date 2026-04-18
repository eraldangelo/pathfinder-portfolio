import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { CalendarIcon, ChevronDownIcon } from './TimesheetPageIcons';

type TimesheetPeriod = '1-15' | '16-end';

interface TimesheetPageControlsProps {
    currentDate: Date;
    period: TimesheetPeriod;
    onMonthChange: (date: Date) => void;
    onPeriodChange: (period: TimesheetPeriod) => void;
}

export const TimesheetPageControls: React.FC<TimesheetPageControlsProps> = ({
    currentDate,
    period,
    onMonthChange,
    onPeriodChange,
}) => {
    const { t } = useTranslation();
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const monthPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
                setIsMonthPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formattedMonthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const monthOptions = useMemo(() => {
        const options: Date[] = [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        today.setDate(1);

        const earliestAllowedDate = new Date(2025, 8, 1); // September 2025
        const startDate = today > earliestAllowedDate ? today : earliestAllowedDate;

        const endDate = new Date(2026, 11, 1); // December 2026
        let dateIterator = new Date(startDate);

        while (dateIterator <= endDate) {
            options.push(new Date(dateIterator));
            dateIterator.setMonth(dateIterator.getMonth() + 1);
        }
        return options;
    }, []);

    const handleMonthSelect = (date: Date) => {
        onMonthChange(date);
        setIsMonthPickerOpen(false);
    };

    return (
        <div className="mb-6 backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-md border border-white/40 dark:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-20">
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative" ref={monthPickerRef}>
                    <button
                        onClick={() => setIsMonthPickerOpen(prev => !prev)}
                        className="flex items-center gap-3 cursor-pointer bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg py-2 px-4 focus-within:ring-2 focus-within:ring-blue-500 transition-colors hover:bg-white/80 dark:hover:bg-black/50"
                        aria-haspopup="true"
                        aria-expanded={isMonthPickerOpen}
                    >
                        <CalendarIcon />
                        <span className="font-semibold text-gray-800 dark:text-white">{formattedMonthYear}</span>
                        <ChevronDownIcon />
                    </button>
                    {isMonthPickerOpen && (
                        <div className="absolute z-30 mt-2 w-56 bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-lg shadow-2xl animate-fade-in-fast">
                            <ul className="max-h-60 overflow-y-auto custom-scrollbar p-1 text-sm text-gray-700 dark:text-gray-200">
                                {monthOptions.map((dateOption) => {
                                    const isSelected = dateOption.getFullYear() === currentDate.getFullYear() && dateOption.getMonth() === currentDate.getMonth();
                                    return (
                                        <li key={dateOption.toISOString()}>
                                            <button
                                                onClick={() => handleMonthSelect(dateOption)}
                                                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
                                            >
                                                {dateOption.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="flex items-center p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <button
                        onClick={() => onPeriodChange('1-15')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${period === '1-15' ? 'bg-white dark:bg-gray-800 shadow text-[#004097] dark:text-blue-300' : 'text-gray-500'}`}
                    >
                        {t('period1_15', '1 - 15')}
                    </button>
                    <button
                        onClick={() => onPeriodChange('16-end')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${period === '16-end' ? 'bg-white dark:bg-gray-800 shadow text-[#004097] dark:text-blue-300' : 'text-gray-500'}`}
                    >
                        {t('period16_end', '16 - End')}
                    </button>
                </div>
            </div>
        </div>
    );
};
