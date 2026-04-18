import React from 'react';

export const TimeInIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`${className} flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
            <circle cx="12" cy="12" r="12" fill="#22C55E" />
            <path fill="white" d="M10.243 16.314L6.43 12.5l1.414-1.414 2.399 2.4 5.6-5.6 1.414 1.414-7 7z" />
        </svg>
    </div>
);

export const LunchStartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`${className} flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
            <circle cx="12" cy="12" r="12" fill="#F59E0B" />
            <g transform="scale(0.8) translate(3, 3)">
                <g transform="translate(0, 1)">
                    <path fill="white" d="M6 7C6 5.34315 7.34315 4 9 4H15C16.6569 4 18 5.34315 18 7V9H6V7Z" />
                    <rect fill="white" x="6" y="10" width="12" height="2" rx="1" />
                    <path fill="white" d="M6 15C6 16.6569 7.34315 18 9 18H15C16.6569 18 18 16.6569 18 15V13H6V15Z" />
                </g>
            </g>
        </svg>
    </div>
);

export const BackToWorkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`${className} flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
            <circle cx="12" cy="12" r="12" fill="#3B82F6" />
            <g transform="scale(0.7) translate(4.5, 4.5)">
                <path fill="white" d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
            </g>
        </svg>
    </div>
);

export const TimeOutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`${className} flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
            <circle cx="12" cy="12" r="12" fill="#EF4444" />
            <g transform="scale(0.9) translate(2.5, 2.5)">
                <path fill="white" d="M10 7h4v2h-4v6h4v2h-4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
                <path fill="white" d="M13 12l4-3v2h3v2h-3v2l-4-3z" />
            </g>
        </svg>
    </div>
);

export const LeaveSubmittedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`${className} flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
            <circle cx="12" cy="12" r="12" fill="#F59E0B" />
            <circle cx="12" cy="12" r="5.5" fill="none" stroke="white" strokeWidth="2" />
            <path d="M12 8.5v3.5l2.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    </div>
);

export const LeaveApprovedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`${className} flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
            <circle cx="12" cy="12" r="12" fill="#22C55E" />
            <path fill="white" d="M10.243 16.314L6.43 12.5l1.414-1.414 2.399 2.4 5.6-5.6 1.414 1.414-7 7z" />
        </svg>
    </div>
);

export const LeaveRejectedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`${className} flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
            <circle cx="12" cy="12" r="12" fill="#EF4444" />
            <path stroke="white" strokeWidth="2.5" strokeLinecap="round" d="M8 8l8 8" />
            <path stroke="white" strokeWidth="2.5" strokeLinecap="round" d="M16 8l-8 8" />
        </svg>
    </div>
);

export const NewSubmissionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`${className} flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full drop-shadow-lg">
            <circle cx="12" cy="12" r="12" fill="#3B82F6" />
            <path
                fill="white"
                d="M12 6.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 7.5c-3.314 0-6 1.79-6 4v1h12v-1c0-2.21-2.686-4-6-4Z"
            />
        </svg>
    </div>
);
