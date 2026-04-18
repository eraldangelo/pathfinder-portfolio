import React from 'react';
import type { LeadsDatasetTab } from '../LeadsPageTypes';
import { DownloadIcon } from '../../components/icons';

interface LeadsDatasetToolbarProps {
  t: (key: string, defaultValue?: string) => string;
  canViewArchivedLeads: boolean;
  canDownloadXls: boolean;
  activeDatasetTab: LeadsDatasetTab;
  onDatasetTabChange: (tab: LeadsDatasetTab) => void;
  onDownloadXls: () => void;
  isDownloadDisabled: boolean;
}

const getTabButtonClass = (activeDatasetTab: LeadsDatasetTab, tab: LeadsDatasetTab) =>
  `glass-btn whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 ${
    activeDatasetTab === tab
      ? 'pathfinder-blue text-white dark:text-blue-50 border-blue-300/45 dark:border-blue-300/35 scale-[1.01]'
      : 'gray text-slate-700 dark:text-slate-200 border-white/45 dark:border-white/15 hover:scale-[1.01]'
  }`;

export const LeadsDatasetToolbar: React.FC<LeadsDatasetToolbarProps> = ({
  t,
  canViewArchivedLeads,
  canDownloadXls,
  activeDatasetTab,
  onDatasetTabChange,
  onDownloadXls,
  isDownloadDisabled,
}) => {
  if (!canViewArchivedLeads && !canDownloadXls) return null;

  return (
    <div className="mb-1 flex items-center justify-between gap-4">
      {canViewArchivedLeads ? (
        <div className="crystal-glass-multi relative flex w-fit items-center gap-2 rounded-2xl border border-white/35 dark:border-white/15 p-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.16)] dark:shadow-[0_20px_50px_rgba(2,6,23,0.55)]">
          <span
            className="pointer-events-none absolute inset-x-3 top-1 h-5 rounded-full bg-white/35 dark:bg-white/10 blur-sm"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => onDatasetTabChange('current')}
            className={`relative z-10 ${getTabButtonClass(activeDatasetTab, 'current')}`}
          >
            {t('currentLeads', 'Current Leads')}
          </button>
          <button
            type="button"
            onClick={() => onDatasetTabChange('archived')}
            className={`relative z-10 ${getTabButtonClass(activeDatasetTab, 'archived')}`}
          >
            {t('archivedLeads', 'Archived Leads')}
          </button>
        </div>
      ) : (
        <div />
      )}

      {canDownloadXls ? (
        <button
          type="button"
          onClick={onDownloadXls}
          disabled={isDownloadDisabled}
          className="glass-btn pathfinder-green h-11 w-11 rounded-full p-0 text-emerald-800 dark:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center"
          title={t('downloadXls', 'Download XLS')}
          aria-label={t('downloadXls', 'Download XLS')}
        >
          <DownloadIcon className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
};
