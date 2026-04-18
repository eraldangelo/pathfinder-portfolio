import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { TimeTrackingStatus } from '../../../types';
import { getActivityStatusColorClass, getActivityStatusLabelKey } from '../../../utils/activityStatus';

interface HeaderStatusIndicatorProps {
    status: TimeTrackingStatus;
}

const HeaderStatusIndicator: React.FC<HeaderStatusIndicatorProps> = ({ status }) => {
    const { t } = useTranslation();
    const labelKey = getActivityStatusLabelKey(status);
    const fallbackLabel = labelKey === 'online' ? 'Online' : labelKey === 'onLunch' ? 'On Lunch' : 'Offline';
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full transition-colors ${getActivityStatusColorClass(status)}`}></div>
            <span className="text-xs font-semibold">{t(labelKey, fallbackLabel)}</span>
        </div>
    );
};

export default HeaderStatusIndicator;
