import React from 'react';
import { NotificationTranslationFn } from '../utils/notificationPresentationUtils';

type NotificationRequestActionVariant = 'default' | 'compact';

interface NotificationRequestActionsProps {
    t: NotificationTranslationFn;
    requestStatus: string;
    showRequestActions: boolean;
    onDecision: (decision: 'yes' | 'no') => void;
    variant?: NotificationRequestActionVariant;
}

const variantClasses: Record<
    NotificationRequestActionVariant,
    {
        container: string;
        badge: string;
        button: string;
    }
> = {
    default: {
        container: 'mt-2',
        badge: 'px-2.5 py-1 text-xs',
        button: 'px-3 py-1 text-xs',
    },
    compact: {
        container: 'mt-1',
        badge: 'px-2 py-0.5 text-[10px]',
        button: 'px-2.5 py-0.5 text-[10px]',
    },
};

const NotificationRequestActions: React.FC<NotificationRequestActionsProps> = ({
    t,
    requestStatus,
    showRequestActions,
    onDecision,
    variant = 'default',
}) => {
    const classes = variantClasses[variant];

    return (
        <div className={`${classes.container} flex flex-wrap items-center gap-2`}>
            <span
                className={`inline-flex items-center rounded-full font-semibold ${
                    requestStatus === 'approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                        : requestStatus === 'rejected' || requestStatus === 'failed'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                } ${classes.badge}`}
            >
                {t(requestStatus, requestStatus)}
            </span>
            {showRequestActions && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onDecision('yes')}
                        className={`${classes.button} font-semibold rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors`}
                    >
                        {t('yes', 'Yes')}
                    </button>
                    <button
                        onClick={() => onDecision('no')}
                        className={`${classes.button} font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors`}
                    >
                        {t('no', 'No')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationRequestActions;
