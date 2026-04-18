import React from 'react';
import type { ApplicationInfo, ApplicationStatus } from '../../../data/applications';

const STAGE_DEFINITIONS: { name: string; statuses: ApplicationStatus[] }[] = [
    { name: 'Submitted Application', statuses: ['Submitted', 'Submitted Application'] },
    { name: 'More Information Required', statuses: ['More Information Required'] },
    { name: 'Offer', statuses: ['Conditional Offer', 'Unconditional Offer'] },
    { name: 'Payment Processed', statuses: ['Payment Processed'] },
    { name: 'Received CoE/LoA', statuses: ['CoE/LoA Received'] },
    { name: 'Visa Lodge', statuses: ['Visa Lodged'] },
    { name: 'Visa Result', statuses: ['Visa Granted', 'Visa Refused', 'Visa Withdrawn'] },
    { name: 'End Application', statuses: ['Pre-Departure Orientation', 'Refund Processing', 'Withdrawn', 'Application Ended'] },
];

const STATUS_TO_STAGE_INDEX: { [key: string]: number } = {};
STAGE_DEFINITIONS.forEach((stage, index) => {
    stage.statuses.forEach(status => {
        STATUS_TO_STAGE_INDEX[status] = index;
    });
});

interface CompactApplicationStatusBarProps {
    application: ApplicationInfo;
}

const CompactApplicationStatusBar: React.FC<CompactApplicationStatusBarProps> = ({ application }) => {
    const currentStageIndex = STATUS_TO_STAGE_INDEX[application.status] ?? -1;
    const totalStages = STAGE_DEFINITIONS.length;

    const isTerminalStatus = ['Visa Refused', 'Visa Withdrawn', 'Withdrawn', 'Application Ended', 'Refund Processing'].includes(application.status);
    const isSuccessStatus = ['Visa Granted', 'Pre-Departure Orientation'].includes(application.status);

    // If the application is in a terminal state (like refused or withdrawn), it's conceptually "complete" at 100%.
    const percentage = isTerminalStatus 
        ? 100 
        : (currentStageIndex >= 0 ? ((currentStageIndex + 1) / totalStages) * 100 : 0);
    const isFullyComplete = percentage >= 100;

    const currentStageName = currentStageIndex >= 0 ? STAGE_DEFINITIONS[currentStageIndex].name : 'Unknown Stage';

    let barGradient = 'from-sky-400 to-blue-500';
    if (isTerminalStatus) barGradient = 'from-red-500 to-rose-600';
    else if (isSuccessStatus) barGradient = 'from-teal-400 to-green-500';

    return (
        <div className="w-full" title={`Stage: ${currentStageName} (${application.status}) - ${percentage.toFixed(0)}%`}>
            <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-5 relative overflow-hidden">
                <div 
                    className={`bg-gradient-to-r ${barGradient} h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-center ${isFullyComplete ? '' : 'progress-bar-shine'}`} 
                    style={{ width: `${percentage}%` }}
                >
                   <span className="text-xs font-bold text-white text-floating opacity-0 animate-fade-in" style={{ animationDelay: '500ms', zIndex: 2 }}>
                        {`${percentage.toFixed(0)}%`}
                    </span>
                </div>
            </div>
            {/* Injecting CSS for the fun shine animation and text visibility */}
            <style>
            {`
                .progress-bar-shine {
                    position: relative;
                }
                .progress-bar-shine::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    right: 0;
                    background-image: linear-gradient(
                        -45deg, 
                        rgba(255, 255, 255, .2) 25%, 
                        transparent 25%, 
                        transparent 50%, 
                        rgba(255, 255, 255, .2) 50%, 
                        rgba(255, 255, 255, .2) 75%, 
                        transparent 75%, 
                        transparent
                    );
                    z-index: 1;
                    background-size: 40px 40px;
                    animation: move-shine 2s linear infinite;
                    border-radius: 9999px;
                    overflow: hidden;
                }

                @keyframes move-shine {
                    0% {
                        background-position: 0 0;
                    }
                    100% {
                        background-position: 40px 40px;
                    }
                }

                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
                .text-floating {
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
            `}
            </style>
        </div>
    );
};

export default CompactApplicationStatusBar;
