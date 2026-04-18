'use client';

import React from 'react';
import type { LeadsHeatmapMapProps } from './leads-heatmap-map/types';
import { useLeadsHeatmapMap } from './leads-heatmap-map/useLeadsHeatmapMap';

const LeadsHeatmapMap: React.FC<LeadsHeatmapMapProps> = (props) => {
  const { containerRef, zoomIn, zoomOut, mapError } = useLeadsHeatmapMap(props);
  const { theme } = props;

  return (
    <div className={`relative h-full w-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-200'}`}>
      <div ref={containerRef} className="h-full w-full" />
      {mapError ? (
        <div
          className={`pointer-events-none absolute inset-x-4 bottom-4 rounded-lg px-4 py-2 text-xs ${
            theme === 'dark' ? 'bg-black/70 text-white' : 'bg-white/90 text-slate-800'
          }`}
        >
          {mapError}
        </div>
      ) : null}

      <div
        className={`absolute left-3 top-3 flex flex-col overflow-hidden rounded-md border shadow ${
          theme === 'dark'
            ? 'border-slate-700 bg-slate-900/90 text-slate-100'
            : 'border-slate-300 bg-white text-slate-800'
        }`}
      >
        <button
          type="button"
          onClick={zoomIn}
          className={`h-8 w-8 text-xl leading-none ${
            theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className={`h-8 w-8 border-t text-xl leading-none ${
            theme === 'dark'
              ? 'border-slate-700 hover:bg-slate-800'
              : 'border-slate-300 hover:bg-slate-100'
          }`}
          aria-label="Zoom out"
        >
          -
        </button>
      </div>

      <div
        className={`pointer-events-none absolute right-3 top-3 rounded-md px-2 py-1 text-[11px] ${
          theme === 'dark' ? 'bg-black/55 text-white' : 'bg-white/90 text-slate-800'
        }`}
      >
        <div>Marker Clusters</div>
        <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}>Higher leads = larger bubble</div>
      </div>
    </div>
  );
};

export default LeadsHeatmapMap;
