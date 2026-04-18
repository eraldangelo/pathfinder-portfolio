import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../../../contexts/LanguageContext';
import type { TrendData, TrendPoint } from '../../types/types';
import { Widget } from '../../components/common';
import VisaTrendCountryDropdown from './VisaTrendCountryDropdown';
import { type TrendCountry } from './visaApprovalRateTrend.constants';
import { buildTrendChartLayout } from './visaApprovalRateTrend.utils';

interface VisaApprovalRateTrendProps {
    title: string;
    selectedLocation: string;
    trendData: TrendData;
    theme: 'light' | 'dark';
}

type TrendSeriesKey = 'lodged' | 'granted' | 'refused';

const TREND_SERIES: Array<{ key: TrendSeriesKey; color: string; label: string }> = [
    { key: 'lodged', color: '#22c55e', label: 'Visa Lodge' },
    { key: 'granted', color: '#3b82f6', label: 'Visa Grant' },
    { key: 'refused', color: '#ef4444', label: 'Visa Refusal' },
];
const VISIBLE_MONTHS = 6;

const toSafeNumber = (value: unknown, fallback = 0) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const VisaApprovalRateTrend: React.FC<VisaApprovalRateTrendProps> = ({
    title,
    selectedLocation,
    trendData,
    theme,
}) => {
    const { t } = useTranslation();
    const [selectedCountry, setSelectedCountry] = useState<TrendCountry>('All Countries');
    const [isChartVisible, setIsChartVisible] = useState(true);
    const [tooltip, setTooltip] = useState<{
        xPercent: number;
        yPercent: number;
        month: string;
        label: string;
        value: number;
        color: string;
    } | null>(null);
    const [windowStartIndex, setWindowStartIndex] = useState(0);
    const countrySwitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const areaGradientId = useId().replace(/:/g, '');
    const dataKey = `${selectedLocation}::${selectedCountry}`;
    const data = useMemo<TrendPoint[]>(() => {
        const selectedTrendData = trendData[dataKey] || trendData[selectedLocation] || [];
        return selectedTrendData.map((point) => {
            const granted = toSafeNumber(point.granted, toSafeNumber(point.rate, 0));
            const refused = toSafeNumber(point.refused, 0);
            const lodged = toSafeNumber(point.lodged, 0);
            return {
                month: point.month,
                rate: granted,
                granted,
                refused,
                lodged,
            };
        });
    }, [dataKey, selectedLocation, trendData]);
    const maxWindowStartIndex = Math.max(0, data.length - VISIBLE_MONTHS);
    const visibleData = useMemo(
        () => data.slice(windowStartIndex, windowStartIndex + VISIBLE_MONTHS),
        [data, windowStartIndex]
    );
    const chartLayout = useMemo(() => buildTrendChartLayout(visibleData), [visibleData]);
    const visibleRangeLabel = visibleData.length
        ? `${visibleData[0].month} - ${visibleData[visibleData.length - 1].month}`
        : '';

    useEffect(() => {
        return () => {
            if (!countrySwitchTimeoutRef.current) return;
            clearTimeout(countrySwitchTimeoutRef.current);
            countrySwitchTimeoutRef.current = null;
        };
    }, []);
    useEffect(() => {
        setWindowStartIndex((current) => Math.min(current, maxWindowStartIndex));
    }, [maxWindowStartIndex]);

    const handleCountryChange = (country: TrendCountry) => {
        if (country === selectedCountry) return;

        setTooltip(null);
        setIsChartVisible(false);

        if (countrySwitchTimeoutRef.current) {
            clearTimeout(countrySwitchTimeoutRef.current);
            countrySwitchTimeoutRef.current = null;
        }

        countrySwitchTimeoutRef.current = setTimeout(() => {
            setSelectedCountry(country);
            setWindowStartIndex(0);
            requestAnimationFrame(() => setIsChartVisible(true));
            countrySwitchTimeoutRef.current = null;
        }, 130);
    };

    return (
        <Widget
            title={
                <span className="inline-flex flex-wrap items-center gap-2 sm:gap-3">
                    <span>{title}</span>
                    <VisaTrendCountryDropdown
                        selectedCountry={selectedCountry}
                        onCountryChange={handleCountryChange}
                    />
                </span>
            }
        >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {TREND_SERIES.map((series) => (
                        <span key={series.key} className="inline-flex items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: series.color }}
                                aria-hidden="true"
                            />
                            <span>{series.label}</span>
                        </span>
                    ))}
                </div>
                {data.length > VISIBLE_MONTHS && (
                    <div className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <button
                            type="button"
                            onClick={() => {
                                setTooltip(null);
                                setWindowStartIndex((current) => Math.max(0, current - 1));
                            }}
                            disabled={windowStartIndex === 0}
                            className="rounded border border-gray-300/70 px-2 py-1 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20"
                        >
                            {'<'}
                        </button>
                        <span className="min-w-[180px] text-center font-medium">{visibleRangeLabel}</span>
                        <button
                            type="button"
                            onClick={() => {
                                setTooltip(null);
                                setWindowStartIndex((current) => Math.min(maxWindowStartIndex, current + 1));
                            }}
                            disabled={windowStartIndex >= maxWindowStartIndex}
                            className="rounded border border-gray-300/70 px-2 py-1 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20"
                        >
                            {'>'}
                        </button>
                    </div>
                )}
            </div>
            <div className="relative h-80">
                <div
                    className={`h-full transform transition-all duration-300 ease-out ${
                        isChartVisible
                            ? 'pointer-events-auto translate-y-0 opacity-100'
                            : 'pointer-events-none translate-y-1 opacity-0'
                    }`}
                >
                    {visibleData.length > 0 ? (
                        <>
                            <svg
                                viewBox={`0 0 ${chartLayout.svgWidth} ${chartLayout.svgHeight}`}
                                preserveAspectRatio="none"
                                className="h-full w-full"
                            >
                                <defs>
                                    <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={theme === 'dark' ? 0.4 : 0.2} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {chartLayout.yAxisLabels.map((label) => (
                                    <line
                                        key={label}
                                        x1={chartLayout.margin.left}
                                        y1={chartLayout.yScale(label)}
                                        x2={chartLayout.margin.left + chartLayout.width}
                                        y2={chartLayout.yScale(label)}
                                        stroke="currentColor"
                                        strokeOpacity="0.1"
                                    />
                                ))}
                                {chartLayout.yAxisLabels.map((label) => (
                                    <text
                                        key={label}
                                        x={chartLayout.margin.left - 8}
                                        y={chartLayout.yScale(label) + 4}
                                        textAnchor="end"
                                        fontSize="10"
                                        fill="currentColor"
                                        opacity="0.6"
                                    >
                                        {label}
                                    </text>
                                ))}
                                {visibleData.map((point, index) => (
                                    <text
                                        key={`${point.month}-${windowStartIndex + index}`}
                                        x={chartLayout.xScale(index)}
                                        y={chartLayout.margin.top + chartLayout.height + 20}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fill="currentColor"
                                        opacity="0.6"
                                    >
                                        {point.month}
                                    </text>
                                ))}
                                <path d={chartLayout.areaPath} fill={`url(#${areaGradientId})`} />
                                {TREND_SERIES.map((series) => (
                                    <path
                                        key={`line-${series.key}`}
                                        d={chartLayout.linePaths[series.key]}
                                        fill="none"
                                        stroke={series.color}
                                        strokeWidth={series.key === 'granted' ? 2.5 : 2}
                                    />
                                ))}
                                {TREND_SERIES.map((series) =>
                                    visibleData.map((point, index) => {
                                        const value = point[series.key];
                                        return (
                                            <circle
                                                key={`${series.key}-${point.month}-${windowStartIndex + index}`}
                                                cx={chartLayout.xScale(index)}
                                                cy={chartLayout.yScale(value)}
                                                r="3.8"
                                                fill={series.color}
                                                stroke={theme === 'dark' ? '#000' : '#fff'}
                                                strokeWidth="1.6"
                                                className="cursor-pointer"
                                                onMouseOver={() =>
                                                    setTooltip({
                                                        xPercent: (chartLayout.xScale(index) / chartLayout.svgWidth) * 100,
                                                        yPercent:
                                                            (chartLayout.yScale(value) / chartLayout.svgHeight) * 100,
                                                        month: point.month,
                                                        label: series.label,
                                                        value,
                                                        color: series.color,
                                                    })
                                                }
                                                onMouseOut={() => setTooltip(null)}
                                            />
                                        );
                                    })
                                )}
                            </svg>
                            {tooltip && (
                                <div
                                    className="pointer-events-none absolute rounded-md bg-black/70 p-2 text-xs text-white transition-transform duration-100"
                                    style={{
                                        left: `${tooltip.xPercent}%`,
                                        top: `${tooltip.yPercent}%`,
                                        transform: 'translate(-50%, -120%)',
                                    }}
                                >
                                    <span className="font-semibold" style={{ color: tooltip.color }}>
                                        {tooltip.label}
                                    </span>{' '}
                                    {tooltip.month}: {tooltip.value}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                            {t('noTrendDataAvailable')}
                        </div>
                    )}
                </div>
            </div>
        </Widget>
    );
};
