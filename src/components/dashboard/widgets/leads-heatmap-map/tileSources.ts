export const GOOGLE_MAPS_LIGHT_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
] as const;

export const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#374151' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
] as const;

export const HEAT_GRADIENT_DARK = [
  'rgba(16,185,129,0)',
  'rgba(16,185,129,0.42)',
  '#34d399',
  '#a3e635',
  '#f59e0b',
  'rgba(239,68,68,0.82)',
] as const;

export const HEAT_GRADIENT_LIGHT = [
  'rgba(2,132,199,0)',
  'rgba(2,132,199,0.4)',
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  'rgba(220,38,38,0.82)',
] as const;
