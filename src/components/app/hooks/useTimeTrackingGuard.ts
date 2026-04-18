import { useEffect } from 'react';
import type { TimeTrackingStatus } from '../../../types';

interface UseTimeTrackingGuardParams {
    timeTrackingStatus: TimeTrackingStatus;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

export const useTimeTrackingGuard = ({ timeTrackingStatus, t }: UseTimeTrackingGuardParams) => {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (timeTrackingStatus !== 'timed-out') {
                event.preventDefault();
                event.returnValue = t('beforeUnloadWarning');
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [timeTrackingStatus, t]);
};
