import React, { useMemo } from 'react';
import { useTranslation } from '../../../../contexts/LanguageContext';
import { Widget } from '../../components/common';
import type { ApplicationInfo } from '../../../../data/applications';
import { buildTargetVsActualRows } from '../../utils/targetVsActualMetrics';
import { ALL_QUARTERS_VALUE } from '../../utils/funnelFilters';

interface PathfinderTargetVsActualDataProps {
    title: string;
    applications: ApplicationInfo[];
    selectedLocation: string;
    selectedMonth: string;
    selectedYear: string;
    selectedQuarter?: string;
}

const PathfinderTargetVsActualData: React.FC<PathfinderTargetVsActualDataProps> = ({
    title,
    applications,
    selectedLocation,
    selectedMonth,
    selectedYear,
    selectedQuarter = ALL_QUARTERS_VALUE,
}) => {
    const { t } = useTranslation();
    const { rows, overallAchievement } = useMemo(
        () => buildTargetVsActualRows(applications, selectedLocation, selectedMonth, selectedYear, selectedQuarter),
        [applications, selectedLocation, selectedMonth, selectedQuarter, selectedYear]
    );

    return (
        <Widget title={title}>
            <div className="space-y-4">
                {rows.map((row) => (
                    <div key={row.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{row.label}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                                {row.actual.toLocaleString()} / {row.target.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                                style={{ width: `${row.clampedAchievement}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{t('actual', 'Actual')}: {row.actual.toLocaleString()}</span>
                            <span>
                                {t('target', 'Target')}: {row.target.toLocaleString()} ({row.achievement.toFixed(1)}%)
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10 text-right">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">{overallAchievement.toFixed(1)}%</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('overallAchievement', 'Overall Achievement')}</p>
            </div>
        </Widget>
    );
};

export default PathfinderTargetVsActualData;
