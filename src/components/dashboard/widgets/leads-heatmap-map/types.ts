export type HeatPoint = [number, number, number];

export interface LeadsHeatmapMapProps {
  center: [number, number];
  zoom: number;
  mapConfig?: { center: [number, number]; zoom: number };
  points: HeatPoint[];
  theme: 'light' | 'dark';
}

