import type { TrendPoint } from '../../types/types';

type Margin = { top: number; right: number; bottom: number; left: number };
type TrendSeriesKey = 'granted' | 'refused' | 'lodged';

export interface TrendChartLayout {
    svgWidth: number;
    svgHeight: number;
    margin: Margin;
    width: number;
    height: number;
    axisMax: number;
    yAxisLabels: number[];
    xScale: (index: number) => number;
    yScale: (value: number) => number;
    linePaths: Record<TrendSeriesKey, string>;
    areaPath: string;
}

const DEFAULT_LAYOUT = {
    svgHeight: 320,
    margin: { top: 20, right: 20, bottom: 34, left: 40 },
} as const;
const MIN_SVG_WIDTH = 1000;
const POINT_SPACING_PX = 150;

export const buildTrendChartLayout = (data: TrendPoint[]): TrendChartLayout => {
    const { svgHeight, margin } = DEFAULT_LAYOUT;
    const svgWidth = Math.max(
        MIN_SVG_WIDTH,
        margin.left + margin.right + Math.max(1, data.length - 1) * POINT_SPACING_PX
    );
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;
    const maxValue = data.length
        ? Math.max(...data.map((point) => Math.max(point.granted, point.refused, point.lodged)), 0)
        : 0;
    const axisMax = maxValue <= 5 ? Math.max(1, Math.ceil(maxValue)) : Math.ceil(maxValue / 5) * 5;
    const yAxisLabels =
        maxValue <= 5
            ? Array.from({ length: axisMax + 1 }, (_, index) => index)
            : Array.from({ length: 6 }, (_, index) => (axisMax / 5) * index);

    const xScale = (index: number) => {
        if (data.length < 2) return margin.left + width / 2;
        return margin.left + (index / (data.length - 1)) * width;
    };

    const yScale = (value: number) => {
        const safeValue = Math.max(0, Math.min(axisMax, value));
        return margin.top + height - (safeValue / axisMax) * height;
    };

    const buildSeriesPath = (seriesKey: TrendSeriesKey) =>
        data.length > 0
            ? data.map((point, index) => `${index === 0 ? 'M' : 'L'}${xScale(index)} ${yScale(point[seriesKey])}`).join(' ')
            : '';
    const linePaths = {
        granted: buildSeriesPath('granted'),
        refused: buildSeriesPath('refused'),
        lodged: buildSeriesPath('lodged'),
    };
    const areaPath =
        data.length > 1
            ? `${linePaths.granted} L ${xScale(data.length - 1)} ${margin.top + height} L ${xScale(0)} ${margin.top + height} Z`
            : '';

    return {
        svgWidth,
        svgHeight,
        margin,
        width,
        height,
        axisMax,
        yAxisLabels,
        xScale,
        yScale,
        linePaths,
        areaPath,
    };
};
