import { ALL_LOCATION_KEYS } from '../../constants/constants';

export const buildYieldData = () => {
  const generateData = () => ({
    'Q1 2025': { applications: 0, offers: 0, lodged: 0, grants: 0 },
    'Q2 2025': { applications: 0, offers: 0, lodged: 0, grants: 0 },
    'Q3 2025': { applications: 0, offers: 0, lodged: 0, grants: 0 },
    'Q4 2025': { applications: 0, offers: 0, lodged: 0, grants: 0 },
  });

  const data: { [key: string]: ReturnType<typeof generateData> } = {};
  ALL_LOCATION_KEYS.forEach((key) => {
    data[key] = generateData();
  });
  return data;
};

export const buildPerformanceData = () => {
  const generateQuarters = (): { quarter: string; lodged: number; granted: number; refused: number }[] => [
    { quarter: 'Q1', lodged: 0, granted: 0, refused: 0 },
    { quarter: 'Q2', lodged: 0, granted: 0, refused: 0 },
    { quarter: 'Q3', lodged: 0, granted: 0, refused: 0 },
    { quarter: 'Q4', lodged: 0, granted: 0, refused: 0 },
  ];

  const data: { [key: string]: ReturnType<typeof generateQuarters> } = {};
  ALL_LOCATION_KEYS.forEach((key) => {
    data[key] = generateQuarters();
  });
  return data;
};

export { buildTrendData } from './trendMetrics';
