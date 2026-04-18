'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { ApplicationInfo } from '../../../data/applications';
import type { AssessmentSubmission } from '../../../types';
import { auth, ensureFirebaseReady } from '../../../services/firebase';
import { Widget } from '../components/common';
import { inputField } from '../../common/styles/ui';
import {
  buildApplicationCountedLocations,
  buildCountedLocations,
  chunkLocations,
  CountedLocation,
  GEO_BATCH_SIZE,
  GEO_BATCH_TIMEOUT_MS,
  GeocodeResponse,
  GeocodedLocation,
  HeatmapOriginFilter,
  readGeoCache,
  writeGeoCache,
} from './LeadsHeatmap.utils';
import { DEFAULT_PH_ZOOM } from './leads-heatmap-map/constants';

const LeadsHeatmapMap = dynamic(() => import('./LeadsHeatmapMap'), { ssr: false });

const HEATMAP_ORIGIN_OPTIONS: Array<{ value: HeatmapOriginFilter; labelKey: string; fallbackLabel: string }> = [
  { value: 'leads', labelKey: 'leadsOrigin', fallbackLabel: 'Leads Origin' },
  { value: 'applications', labelKey: 'applicationOrigin', fallbackLabel: 'Application Origin' },
];

const LeadsHeatmap: React.FC<{
  assessmentSubmissions: AssessmentSubmission[];
  applications: ApplicationInfo[];
  mapConfig?: { center: [number, number]; zoom: number };
  countryFilter?: string;
  theme: 'light' | 'dark';
}> = ({ assessmentSubmissions, applications, mapConfig, countryFilter, theme }) => {
  const { t } = useTranslation();
  const [geoMap, setGeoMap] = useState<Record<string, GeocodedLocation>>({});
  const [isResolving, setIsResolving] = useState(false);
  const [originFilter, setOriginFilter] = useState<HeatmapOriginFilter>('leads');

  const countedLocations = useMemo<CountedLocation[]>(() => {
    if (originFilter === 'applications') {
      return buildApplicationCountedLocations(applications, assessmentSubmissions);
    }
    return buildCountedLocations(assessmentSubmissions);
  }, [applications, assessmentSubmissions, originFilter]);

  const geocodableLocations = useMemo(
    () => countedLocations,
    [countedLocations]
  );

  const geocodableRenderLocations = useMemo(() => geocodableLocations, [geocodableLocations]);

  useEffect(() => {
    if (geocodableRenderLocations.length === 0) {
      setGeoMap({});
      return;
    }

    const cached = readGeoCache();
    const unresolved = geocodableRenderLocations.filter((entry) => !cached[entry.key]);
    if (unresolved.length === 0) {
      setGeoMap(cached);
      return;
    }

    let cancelled = false;
    setIsResolving(true);

    const resolve = async () => {
      try {
        const merged = { ...cached };
        const locationBatches = chunkLocations(unresolved, GEO_BATCH_SIZE);
        const firebaseReady = await ensureFirebaseReady();
        const currentUser = firebaseReady ? auth?.currentUser : null;
        if (!currentUser) {
          if (!cancelled) setGeoMap(cached);
          return;
        }
        const token = await currentUser.getIdToken();

        for (const batch of locationBatches) {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), GEO_BATCH_TIMEOUT_MS);
          let response: Response;
          try {
            response = await fetch('/api/geocode/locations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                locations: batch.map((entry) => ({ key: entry.key, query: entry.query })),
              }),
              signal: controller.signal,
            });
          } catch {
            window.clearTimeout(timeout);
            continue;
          }
          window.clearTimeout(timeout);
          if (!response.ok) continue;

          const data = (await response.json()) as GeocodeResponse;
          data.results.forEach((item) => {
            merged[item.key] = {
              lat: item.lat,
              lng: item.lng,
              country: item.country,
            };
          });
        }

        if (cancelled) return;
        setGeoMap(merged);
        writeGeoCache(merged);
      } catch {
        if (!cancelled) setGeoMap(cached);
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [geocodableRenderLocations]);

  const points = useMemo(() => {
    return geocodableRenderLocations.flatMap((entry) => {
      const resolved = geoMap[entry.key];
      if (!resolved) return [];
      if (!Number.isFinite(resolved.lat) || !Number.isFinite(resolved.lng)) return [];
      if (resolved.lat < -90 || resolved.lat > 90 || resolved.lng < -180 || resolved.lng > 180) return [];
      if (countryFilter && resolved.country !== countryFilter) return [];
      return [[resolved.lat, resolved.lng, entry.count] as [number, number, number]];
    });
  }, [countryFilter, geoMap, geocodableRenderLocations]);

  const unresolvedCount = useMemo(
    () => geocodableRenderLocations.filter((entry) => !geoMap[entry.key]).length,
    [geoMap, geocodableRenderLocations]
  );

  const center: [number, number] = mapConfig ? mapConfig.center : [12.8797, 121.774];
  const zoom = mapConfig ? mapConfig.zoom : DEFAULT_PH_ZOOM;
  const headerContent = (
    <div className="w-full sm:w-auto">
      <label htmlFor="heatmap-origin-filter" className="sr-only">
        {t('originFilter', 'Origin Filter')}
      </label>
      <select
        id="heatmap-origin-filter"
        value={originFilter}
        onChange={(event) => setOriginFilter(event.target.value as HeatmapOriginFilter)}
        className={`${inputField} min-w-[12rem] py-1.5 text-sm`}
      >
        {HEATMAP_ORIGIN_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey, option.fallbackLabel)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Widget title={t('marketCluster', 'Market Cluster')} headerContent={headerContent}>
      <div className="relative h-[40rem] w-full overflow-hidden rounded-lg">
        <LeadsHeatmapMap center={center} zoom={zoom} mapConfig={mapConfig} points={points} theme={theme} />
        {points.length === 0 ? (
          <div
            className={`absolute inset-x-4 bottom-4 rounded-lg px-4 py-2 text-xs ${
              theme === 'dark' ? 'bg-black/65 text-white' : 'bg-white/90 text-slate-800'
            }`}
          >
            {isResolving ? 'Resolving locations for heatmap...' : 'No locations available to render yet.'}
          </div>
        ) : null}

        {unresolvedCount > 0 && !isResolving ? (
          <div
            className={`absolute left-4 top-4 rounded-lg px-3 py-1 text-xs ${
              theme === 'dark' ? 'bg-black/55 text-white' : 'bg-white/90 text-slate-800'
            }`}
          >
            {`${unresolvedCount} location value(s) unresolved`}
          </div>
        ) : null}
      </div>
    </Widget>
  );
};

export default LeadsHeatmap;
