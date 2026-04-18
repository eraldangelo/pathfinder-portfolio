import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    BackToWorkIcon,
    LunchStartIcon,
    TimeInIcon,
    TimeOutIcon,
    LeaveApprovedIcon,
    LeaveRejectedIcon,
    LeaveSubmittedIcon,
    NewSubmissionIcon,
} from '@/components/notifications/components/NotificationIcons';
import { renderHighlightedMessage } from '@/components/notifications/utils/notificationItemUtils';

interface PopupNotificationProps {
    id: number;
    message: string;
    eventKey?: string | null;
    onClose: (id: number) => void;
}

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


const PopupNotification: React.FC<PopupNotificationProps> = ({ id, message, eventKey, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // This function will handle closing, whether it's manual or automatic
    const handleClose = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setIsVisible(false);
        // Wait for animation to finish before unmounting
        setTimeout(() => onClose(id), 500);
    }, [id, onClose]);

    useEffect(() => {
        setIsVisible(true);
        // Set up the auto-close timer
        timerRef.current = setTimeout(handleClose, 7000);

        // Clean up the timer when the component unmounts or id changes
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [handleClose]); // This effect re-runs for new notifications

    const normalize = (value: string) => value.trim().toLowerCase();
    const normalizedMessage = normalize(message);
    const derivedStatus = normalizedMessage.includes('failed')
        ? 'failed'
        : normalizedMessage.includes('approved')
        ? 'approved'
        : normalizedMessage.includes('rejected')
        ? 'rejected'
        : null;
    const detectedEventKey = (() => {
        if (eventKey) return eventKey;
        if (normalizedMessage.includes('assessment submission')) return 'newSubmission';
        if (normalizedMessage.includes('endorsed')) return 'leadEndorsed';
        if (normalizedMessage.includes('timed in') || normalizedMessage.includes('time in')) return 'timeIn';
        if ((normalizedMessage.includes('lunch') && normalizedMessage.includes('started')) || normalizedMessage.includes('lunch start')) return 'lunchStart';
        if (normalizedMessage.includes('back to work') || normalizedMessage.includes('welcome back')) return 'lunchEnd';
        if (normalizedMessage.includes('timed out') || normalizedMessage.includes('time out')) return 'timeOut';
        if (normalizedMessage.includes('leave request')) {
            if (normalizedMessage.includes('approved') || normalizedMessage.includes('rejected')) return 'leaveDecision';
            if (normalizedMessage.includes('submitted') || normalizedMessage.includes('pending')) return 'leaveRequest';
        }
        if (normalizedMessage.includes('offset request')) {
            if (normalizedMessage.includes('approved') || normalizedMessage.includes('rejected')) return 'offsetDecision';
            if (normalizedMessage.includes('submitted') || normalizedMessage.includes('pending')) return 'offsetRequest';
        }
        return null;
    })();

    const getIcon = () => {
        const props = { className: 'w-9 h-9' };
        if (derivedStatus === 'failed') {
            return <LeaveRejectedIcon {...props} />;
        }
        if (detectedEventKey === 'newSubmission' || detectedEventKey === 'leadEndorsed') {
            return <NewSubmissionIcon {...props} />;
        }
        if (detectedEventKey === 'leaveRequest' || detectedEventKey === 'offsetRequest') {
            if (derivedStatus === 'approved') return <LeaveApprovedIcon {...props} />;
            if (derivedStatus === 'rejected') return <LeaveRejectedIcon {...props} />;
            return <LeaveSubmittedIcon {...props} />;
        }
        if (detectedEventKey === 'leaveDecision' || detectedEventKey === 'offsetDecision') {
            if (derivedStatus === 'approved') return <LeaveApprovedIcon {...props} />;
            if (derivedStatus === 'rejected') return <LeaveRejectedIcon {...props} />;
            return <LeaveSubmittedIcon {...props} />;
        }
        if (detectedEventKey === 'lunchStart') {
            return <LunchStartIcon {...props} />;
        }
        if (detectedEventKey === 'lunchEnd') {
            return <BackToWorkIcon {...props} />;
        }
        if (detectedEventKey === 'timeOut') {
            return <TimeOutIcon {...props} />;
        }
        return <TimeInIcon {...props} />;
    };

    return (
        <div 
            className={`transition-all duration-500 ease-out transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}
            role="alert"
            aria-live="assertive"
        >
            <div className="relative flex items-start gap-4 p-4 rounded-2xl shadow-2xl bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 w-auto max-w-sm">
                <div className="flex-shrink-0 pt-1">
                    {getIcon()}
                </div>
                <div className="flex-1 pr-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-floating">Pathfinder</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-200 text-floating">
                        {renderHighlightedMessage(message)}
                    </p>
                </div>
                <button
                    onClick={() => handleClose()}
                    className="absolute top-2 right-2 p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    aria-label="Close notification"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default PopupNotification;
