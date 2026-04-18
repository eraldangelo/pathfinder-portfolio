import { DEFAULT_FUNNEL_LOCATION, Pathfinder_OVERALL } from '../utils/funnelFilters';
import type { TrendData } from '../types/types';

export type DashboardFunnelData = {
  totalLeads: string;
  genuineStudents: string;
  applications: string;
  offers: string;
  coe: string;
  lodged: string;
  granted: string;
  refused: string;
};

const emptyFunnelData: DashboardFunnelData = {
  totalLeads: '0',
  genuineStudents: '0',
  applications: '0',
  offers: '0',
  coe: '0',
  lodged: '0',
  granted: '0',
  refused: '0',
};

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

const isPhilippinesOverall = (location: string) => {
  const locationKey = normalize(location);
  return (
    locationKey === normalize(DEFAULT_FUNNEL_LOCATION)
    || locationKey === 'philippine overall'
    || locationKey === 'philippines overall'
  );
};

export const resolveFunnelDataForLocation = (
  selectedLocation: string,
  funnelByLocation: Record<string, DashboardFunnelData>,
) => {
  if (funnelByLocation[selectedLocation]) return funnelByLocation[selectedLocation];

  const matchedKey = Object.keys(funnelByLocation).find(
    (key) => normalize(key) === normalize(selectedLocation),
  );
  if (matchedKey) return funnelByLocation[matchedKey];

  if (isPhilippinesOverall(selectedLocation)) {
    return (
      funnelByLocation[DEFAULT_FUNNEL_LOCATION]
      ?? funnelByLocation['Philippines Overall']
      ?? funnelByLocation[Pathfinder_OVERALL]
      ?? emptyFunnelData
    );
  }

  return emptyFunnelData;
};

export const resolveTrendLocationForReport = (
  selectedFunnelLocation: string,
  selectedLocation: string,
  trendData: TrendData,
) => {
  const candidates = [
    selectedFunnelLocation,
    selectedLocation,
    DEFAULT_FUNNEL_LOCATION,
    Pathfinder_OVERALL,
  ]
    .map((candidate) => String(candidate || '').trim())
    .filter(Boolean);

  return candidates.find((candidate) => Array.isArray(trendData[candidate])) ?? selectedFunnelLocation;
};

