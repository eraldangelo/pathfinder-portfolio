import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPublicEnv, waitForPublicEnv } from '@/config/publicClientEnv';
import { clampToSingleWorld, MAX_PH_ZOOM, MIN_PH_ZOOM } from './constants';
import {
  buildGoogleClusterLayer,
  buildGoogleMapOptions,
  disposeGoogleClusterLayer,
  type GoogleClusterLayer,
} from './googleMapsHeatLayer';
import { loadGoogleMaps } from './googleMapsLoader';
import type { LeadsHeatmapMapProps } from './types';

const GOOGLE_MAPS_KEY = 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' as const;
const GOOGLE_MAPS_MAP_ID_KEY = 'NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID' as const;
const GOOGLE_MAPS_MAP_ID_DARK_KEY = 'NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID_DARK' as const;
const GOOGLE_MAPS_MAP_ID_LIGHT_KEY = 'NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID_LIGHT' as const;
const GOOGLE_MAPS_FALLBACK_MAP_ID = 'DEMO_MAP_ID';
const KEY_LOOKUP_TIMEOUT_MS = 3000;
const KEY_LOOKUP_RETRY_DELAY_MS = 500;
const KEY_LOOKUP_MAX_ATTEMPTS = 3;

const resolveMapIdForTheme = (theme: 'light' | 'dark') => {
  const sharedMapId = getPublicEnv(GOOGLE_MAPS_MAP_ID_KEY);
  const darkMapId = getPublicEnv(GOOGLE_MAPS_MAP_ID_DARK_KEY);
  const lightMapId = getPublicEnv(GOOGLE_MAPS_MAP_ID_LIGHT_KEY);
  const themeMapId = theme === 'dark' ? darkMapId : lightMapId;
  return String(themeMapId || sharedMapId || GOOGLE_MAPS_FALLBACK_MAP_ID).trim();
};

export const useLeadsHeatmapMap = ({ center, zoom, mapConfig, points, theme }: LeadsHeatmapMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapsRef = useRef<any>(null);
  const clusterLayerRef = useRef<GoogleClusterLayer | null>(null);
  const centerListenerRef = useRef<{ remove: () => void } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const targetCenter = useMemo(
    () => clampToSingleWorld(mapConfig ? mapConfig.center : center),
    [center, mapConfig]
  );
  const targetZoom = useMemo(
    () => Math.min(MAX_PH_ZOOM, Math.max(MIN_PH_ZOOM, mapConfig?.zoom ?? zoom)),
    [mapConfig, zoom]
  );

  const initialCenterRef = useRef(targetCenter);
  const initialZoomRef = useRef(targetZoom);
  const initialThemeRef = useRef(theme);
  const currentPointsRef = useRef(points);
  const currentThemeRef = useRef(theme);

  useEffect(() => {
    currentPointsRef.current = points;
  }, [points]);

  const attachCenterConstraint = useCallback((map: any) => {
    centerListenerRef.current?.remove();
    centerListenerRef.current = map.addListener('center_changed', () => {
      const currentCenter = map.getCenter();
      if (!currentCenter) return;

      const [nextLat, nextLng] = clampToSingleWorld([currentCenter.lat(), currentCenter.lng()]);
      const latDelta = Math.abs(nextLat - currentCenter.lat());
      const lngDelta = Math.abs(nextLng - currentCenter.lng());
      if (latDelta < 1e-7 && lngDelta < 1e-7) return;

      map.setCenter({ lat: nextLat, lng: nextLng });
    });
  }, []);

  const rebuildMapInstance = useCallback(
    (maps: any, nextTheme: 'light' | 'dark', nextMapId: string) => {
      const container = containerRef.current;
      if (!container) return null;

      const previousMap = mapRef.current;
      let nextCenter = initialCenterRef.current;
      let nextZoom = initialZoomRef.current;

      if (previousMap) {
        const previousCenter = previousMap.getCenter();
        if (previousCenter) {
          nextCenter = clampToSingleWorld([previousCenter.lat(), previousCenter.lng()]);
        }
        const previousZoom = Number(previousMap.getZoom());
        if (Number.isFinite(previousZoom)) {
          nextZoom = Math.min(MAX_PH_ZOOM, Math.max(MIN_PH_ZOOM, previousZoom));
        }
        maps.event.clearInstanceListeners(previousMap);
      }

      const map = new maps.Map(
        container,
        buildGoogleMapOptions(maps, nextCenter, nextZoom, nextTheme, nextMapId)
      );

      mapRef.current = map;
      currentThemeRef.current = nextTheme;
      attachCenterConstraint(map);

      disposeGoogleClusterLayer(clusterLayerRef.current);
      clusterLayerRef.current = buildGoogleClusterLayer(
        maps,
        map,
        currentPointsRef.current,
        nextTheme
      );

      return map;
    },
    [attachCenterConstraint]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let disposed = false;
    let handleResize: (() => void) | null = null;

    const initialize = async () => {
      try {
        let apiKey = '';
        for (let attempt = 1; attempt <= KEY_LOOKUP_MAX_ATTEMPTS && !disposed; attempt += 1) {
          apiKey = getPublicEnv(GOOGLE_MAPS_KEY);
          if (!apiKey) {
            apiKey = await waitForPublicEnv(GOOGLE_MAPS_KEY, {
              timeoutMs: KEY_LOOKUP_TIMEOUT_MS,
              pollIntervalMs: 50,
            });
          }
          if (apiKey) break;

          if (attempt < KEY_LOOKUP_MAX_ATTEMPTS) {
            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, KEY_LOOKUP_RETRY_DELAY_MS);
            });
          }
        }
        if (!apiKey) {
          if (!disposed) {
            setMapError('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Google Maps.');
          }
          return;
        }

        const maps = await loadGoogleMaps(apiKey);
        if (disposed || !containerRef.current) return;
        const mapId = resolveMapIdForTheme(initialThemeRef.current);

        mapsRef.current = maps;
        rebuildMapInstance(maps, initialThemeRef.current, mapId);
        setMapError(null);

        handleResize = () => {
          const currentMap = mapRef.current;
          if (!currentMap) return;
          maps.event.trigger(currentMap, 'resize');
        };
        window.addEventListener('resize', handleResize);
        window.visualViewport?.addEventListener('resize', handleResize);
      } catch (error) {
        if (!disposed) {
          setMapError((error as Error).message || 'Failed to initialize Google Maps map overlay.');
        }
      }
    };

    initialize();

    return () => {
      disposed = true;
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('resize', handleResize);
      }
      centerListenerRef.current?.remove();
      centerListenerRef.current = null;
      disposeGoogleClusterLayer(clusterLayerRef.current);
      clusterLayerRef.current = null;
      mapRef.current = null;
      mapsRef.current = null;
    };
  }, [rebuildMapInstance]);

  useEffect(() => {
    const maps = mapsRef.current;
    if (!maps) return;
    rebuildMapInstance(maps, theme, resolveMapIdForTheme(theme));
  }, [rebuildMapInstance, theme]);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;
    currentPointsRef.current = points;
    disposeGoogleClusterLayer(clusterLayerRef.current);
    clusterLayerRef.current = buildGoogleClusterLayer(
      maps,
      map,
      points,
      currentThemeRef.current
    );
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const [lat, lng] = clampToSingleWorld(targetCenter);
    map.panTo({ lat, lng });
    map.setZoom(targetZoom);
  }, [targetCenter, targetZoom]);

  const zoomIn = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const nextZoom = Math.min(MAX_PH_ZOOM, (map.getZoom() ?? MIN_PH_ZOOM) + 1);
    map.setZoom(nextZoom);
  }, []);

  const zoomOut = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const nextZoom = Math.max(MIN_PH_ZOOM, (map.getZoom() ?? MIN_PH_ZOOM) - 1);
    map.setZoom(nextZoom);
  }, []);

  return { containerRef, zoomIn, zoomOut, mapError };
};
