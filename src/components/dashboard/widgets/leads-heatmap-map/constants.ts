export const MIN_PH_ZOOM = 2;
export const MAX_PH_ZOOM = 10;
export const DEFAULT_PH_ZOOM = 5.85;

// Google Maps can visually repeat the world around ±180.
// Keep longitude slightly inside the dateline so restriction + clamping stay on one world copy.
export const SINGLE_WORLD_MAX_LAT = 85;
export const SINGLE_WORLD_MAX_LNG = 179.999999;

// Single-globe bounds used by Google Maps restriction.
export const SINGLE_WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-SINGLE_WORLD_MAX_LAT, -SINGLE_WORLD_MAX_LNG],
  [SINGLE_WORLD_MAX_LAT, SINGLE_WORLD_MAX_LNG],
];

const normalizeLongitude = (longitude: number) => {
  const normalized = ((longitude + 180) % 360 + 360) % 360 - 180;
  // Snap +180 to -180 so clamping always moves toward a single bounded range.
  return normalized === 180 ? -180 : normalized;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clampToSingleWorld = (center: [number, number]): [number, number] => {
  const [rawLat, rawLng] = center;
  const lat = Number.isFinite(rawLat) ? rawLat : 0;
  const lng = Number.isFinite(rawLng) ? rawLng : 0;
  const normalizedLng = normalizeLongitude(lng);

  return [
    clamp(lat, -SINGLE_WORLD_MAX_LAT, SINGLE_WORLD_MAX_LAT),
    clamp(normalizedLng, -SINGLE_WORLD_MAX_LNG, SINGLE_WORLD_MAX_LNG),
  ];
};
