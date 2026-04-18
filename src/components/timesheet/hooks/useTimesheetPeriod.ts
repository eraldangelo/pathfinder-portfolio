import { useEffect, useState } from 'react';

const getInitialDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(1);

    const earliestAllowedDate = new Date(2025, 8, 1); // September 2025
    return today > earliestAllowedDate ? today : earliestAllowedDate;
};

export const useTimesheetPeriod = () => {
    const [currentDate, setCurrentDate] = useState(getInitialDate);
    const [period, setPeriod] = useState<'1-15' | '16-end'>('1-15');

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const viewingCurrentMonth =
            currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();
        if (!viewingCurrentMonth) return;

        const desiredPeriod: '1-15' | '16-end' = today.getDate() <= 15 ? '1-15' : '16-end';
        setPeriod((prev) => (prev === desiredPeriod ? prev : desiredPeriod));
    }, [currentDate]);

    return {
        currentDate,
        setCurrentDate,
        period,
        setPeriod,
    };
};
