import * as MarkerClustererModule from '@googlemaps/markerclusterer';
import { buildHeatLayerPoints } from './features';
import { createAdvancedMarker } from './googleMapsAdvancedMarkers';
import type { HeatPoint } from './types';

type MapTheme = 'light' | 'dark';

type ClusterMarkerDescriptor = {
  lat: number;
  lng: number;
  weight: number;
  intensity: number;
};

export type GoogleClusterLayer = {
  clusterer: any;
  markers: any[];
};

const MARKER_COLORS_DARK = ['#10b981', '#34d399', '#a3e635', '#f59e0b', '#ef4444'] as const;
const MARKER_COLORS_LIGHT = ['#0284c7', '#0ea5e9', '#22c55e', '#f59e0b', '#dc2626'] as const;
const CLUSTER_STYLE_DARK = {
  fill: '#1e3a8a',
  fillOpacity: 0.58,
  stroke: '#93c5fd',
  strokeWeight: 1.6,
  label: '#e2e8f0',
} as const;
const CLUSTER_STYLE_LIGHT = {
  fill: '#2563eb',
  fillOpacity: 0.72,
  stroke: '#ffffff',
  strokeWeight: 1.8,
  label: '#ffffff',
} as const;
const MARKER_WEIGHT_PROP = '__pathfinderLeadWeight';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getIntensity = (value: number) => {
  if (!Number.isFinite(value)) return 0.08;
  return clamp(value, 0.08, 1);
};

const resolveMarkerColor = (theme: MapTheme, intensity: number) => {
  const palette = theme === 'dark' ? MARKER_COLORS_DARK : MARKER_COLORS_LIGHT;
  const index = Math.min(palette.length - 1, Math.floor(intensity * palette.length));
  return palette[index];
};

const resolveMarkerScale = (weight: number) => clamp(5 + Math.sqrt(Math.max(1, weight)) * 1.6, 6, 14);

const resolveClusterScale = (count: number) =>
  clamp(20 + Math.log2(Math.max(2, count)) * 4.5, 20, 44);

const setMarkerMap = (marker: any, map: any) => {
  if (!marker) return;
  if (typeof marker.setMap === 'function') {
    marker.setMap(map);
    return;
  }
  marker.map = map;
};

const readMarkerLeadWeight = (marker: any) => {
  const weighted = Number(marker?.[MARKER_WEIGHT_PROP]);
  if (Number.isFinite(weighted) && weighted > 0) return weighted;
  return 1;
};

export const getClusterLeadCount = (markers: any[] | undefined, fallbackCount: number) => {
  if (!Array.isArray(markers) || markers.length === 0) return Math.max(1, fallbackCount);
  const weighted = markers.reduce((sum, marker) => sum + readMarkerLeadWeight(marker), 0);
  if (Number.isFinite(weighted) && weighted > 0) return Math.round(weighted);
  return Math.max(1, fallbackCount);
};

export const buildClusterMarkerDescriptors = (points: HeatPoint[]): ClusterMarkerDescriptor[] => {
  const normalizedPoints = buildHeatLayerPoints(points);
  return normalizedPoints.flatMap(([lat, lng, normalizedWeight], index) => {
    const point = points[index];
    if (!point) return [];
    const rawWeight = Number(point[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return [];
    return [
      {
        lat,
        lng,
        weight: Number.isFinite(rawWeight) ? Math.max(1, rawWeight) : 1,
        intensity: getIntensity(normalizedWeight),
      },
    ];
  });
};

const buildClusterRenderer = (maps: any, theme: MapTheme) => ({
  render: ({ count, position, markers }: { count: number; position: any; markers?: any[] }) => {
    const leadCount = getClusterLeadCount(markers, count);
    const style = theme === 'dark' ? CLUSTER_STYLE_DARK : CLUSTER_STYLE_LIGHT;
    const labelText = String(leadCount);
    const diameter = Math.round(resolveClusterScale(leadCount) * 2);
    return createAdvancedMarker({
      maps,
      position,
      diameter,
      fillColor: style.fill,
      fillOpacity: style.fillOpacity,
      strokeColor: style.stroke,
      strokeWeight: style.strokeWeight,
      labelText,
      labelColor: style.label,
      fontSize: 12,
      fontWeight: 700,
      zIndex: 1100 + leadCount,
    });
  },
});

const buildMarkers = (maps: any, descriptors: ClusterMarkerDescriptor[], theme: MapTheme) =>
  descriptors.map((descriptor) => {
    const labelText = descriptor.weight >= 10 ? String(descriptor.weight) : '';
    const position = { lat: descriptor.lat, lng: descriptor.lng };
    const markerColor = resolveMarkerColor(theme, descriptor.intensity);
    const marker = createAdvancedMarker({
      maps,
      position,
      diameter: Math.round(resolveMarkerScale(descriptor.weight) * 2),
      fillColor: markerColor,
      fillOpacity: 0.84,
      strokeColor: '#ffffff',
      strokeWeight: 1.2,
      labelText,
      labelColor: '#ffffff',
      fontSize: 10,
      fontWeight: 600,
      zIndex: 100 + Math.round(descriptor.intensity * 100),
      title: `Leads: ${descriptor.weight}`,
    });
    (marker as any)[MARKER_WEIGHT_PROP] = descriptor.weight;
    return marker;
  });

export const buildGoogleClusterLayer = (
  maps: any,
  map: any,
  points: HeatPoint[],
  theme: MapTheme
): GoogleClusterLayer => {
  const MarkerClustererCtor =
    (MarkerClustererModule as any).MarkerClusterer ??
    (MarkerClustererModule as any).default?.MarkerClusterer ??
    (MarkerClustererModule as any).default;
  if (typeof MarkerClustererCtor !== 'function') {
    throw new Error('MarkerClusterer constructor is unavailable.');
  }
  const markers = buildMarkers(maps, buildClusterMarkerDescriptors(points), theme);
  const clusterer = new MarkerClustererCtor({ map, markers, renderer: buildClusterRenderer(maps, theme) });
  return { clusterer, markers };
};

export const disposeGoogleClusterLayer = (layer: GoogleClusterLayer | null | undefined) => {
  if (!layer) return;
  layer.clusterer.clearMarkers();
  (layer.clusterer as any).setMap?.(null);
  layer.markers.forEach((marker) => setMarkerMap(marker, null));
};
