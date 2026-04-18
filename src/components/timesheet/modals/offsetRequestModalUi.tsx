import React from 'react';

export const OFFSET_HOUR_OPTIONS = Array.from({ length: 15 }, (_, index) => {
    const value = 1 + index * 0.5;
    return Number.isInteger(value) ? value.toFixed(0) : String(value);
});

export const USE_OFFSET_OPTIONS: Array<{ labelKey: string; labelFallback: string; value: number }> = [
    { labelKey: 'offsetUseOneHour', labelFallback: '1 hour', value: 1 },
    { labelKey: 'offsetUseTwoHours', labelFallback: '2 hours', value: 2 },
    { labelKey: 'offsetUseThreeHours', labelFallback: '3 hours', value: 3 },
    { labelKey: 'offsetUseFourHours', labelFallback: '4 hours', value: 4 },
    { labelKey: 'offsetUseFiveHours', labelFallback: '5 hours', value: 5 },
    { labelKey: 'offsetUseSixHours', labelFallback: '6 hours', value: 6 },
    { labelKey: 'offsetUseSevenHours', labelFallback: '7 hours', value: 7 },
];

export const ClockPlusIcon: React.FC = () => (
    <div className="w-14 h-14 mx-auto mb-5 p-3 flex items-center justify-center rounded-full bg-[#3B82F6]">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 3v4m-2-2h4" />
        </svg>
    </div>
);

export const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
    </svg>
);

export const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
    </svg>
);
