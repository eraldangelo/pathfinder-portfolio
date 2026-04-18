import {
  clampToSingleWorld,
  MAX_PH_ZOOM,
  MIN_PH_ZOOM,
  SINGLE_WORLD_BOUNDS,
} from './constants';
import {
  GOOGLE_MAPS_DARK_STYLE,
  GOOGLE_MAPS_LIGHT_STYLE,
} from './tileSources';

type MapTheme = 'light' | 'dark';

export { buildClusterMarkerDescriptors, buildGoogleClusterLayer, disposeGoogleClusterLayer, getClusterLeadCount, type GoogleClusterLayer } from './googleMapsClusterMarkers';

export const resolveGoogleMapsStyles = (theme: MapTheme) =>
  theme === 'dark' ? GOOGLE_MAPS_DARK_STYLE : GOOGLE_MAPS_LIGHT_STYLE;

const resolveGoogleMapsColorScheme = (maps: any, theme: MapTheme) => {
  const colorSchemeEnum = maps?.ColorScheme;
  if (!colorSchemeEnum) return undefined;
  return theme === 'dark' ? colorSchemeEnum.DARK : colorSchemeEnum.LIGHT;
};

export const buildGoogleMapThemeOptions = (maps: any, theme: MapTheme, mapId?: string) => {
  const resolvedMapId = String(mapId || '').trim();
  if (!resolvedMapId) {
    return { styles: resolveGoogleMapsStyles(theme) };
  }
  const colorScheme = resolveGoogleMapsColorScheme(maps, theme);
  return {
    mapId: resolvedMapId,
    ...(colorScheme ? { colorScheme } : {}),
  };
};

export const buildGoogleMapOptions = (
  maps: any,
  center: [number, number],
  zoom: number,
  theme: MapTheme,
  mapId?: string
) => {
  const [lat, lng] = clampToSingleWorld(center);

  return {
    center: { lat, lng },
    zoom,
    minZoom: MIN_PH_ZOOM,
    maxZoom: MAX_PH_ZOOM,
    gestureHandling: 'greedy',
    disableDefaultUI: true,
    clickableIcons: false,
    restriction: {
      latLngBounds: {
        north: SINGLE_WORLD_BOUNDS[1][0],
        south: SINGLE_WORLD_BOUNDS[0][0],
        east: SINGLE_WORLD_BOUNDS[1][1],
        west: SINGLE_WORLD_BOUNDS[0][1],
      },
      // Keep this map on a single world copy (prevents infinite horizontal wrap).
      strictBounds: true,
    },
    ...buildGoogleMapThemeOptions(maps, theme, mapId),
  };
};
