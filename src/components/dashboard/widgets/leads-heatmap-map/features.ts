import type { HeatPoint } from './types';

export type WeightedHeatPoint = [number, number, number];

export const buildHeatLayerPoints = (points: HeatPoint[]): WeightedHeatPoint[] => {
  const maxWeight = points.reduce((max, point) => Math.max(max, point[2]), 1);

  return points.map(([lat, lng, weight]) => {
    const normalized = Math.max(0.08, Math.pow(weight / maxWeight, 0.9));
    return [lat, lng, normalized];
  });
};

export const resolveHeatStyle = (pointCount: number) => {
  const sparse = pointCount <= 20;
  return {
    radius: sparse ? 30 : 24,
    blur: sparse ? 24 : 20,
  };
};
