import React from 'react';
import type { User } from '../../../types';
import { DownloadIcon } from './TimesheetPageIcons';
import { useTranslation } from '../../../contexts/LanguageContext';
import { BRANCH_OPTIONS, CUTOFF_OPTIONS, MONTH_OPTIONS } from './timesheet-download/constants';
import type { BranchValue, CutoffValue } from './timesheet-download/types';
import { useTimesheetDownload } from './timesheet-download/useTimesheetDownload';

interface TimesheetDownloadTabProps {
  user: User;
}

export const TimesheetDownloadTab: React.FC<TimesheetDownloadTabProps> = ({ user }) => {
  const { t } = useTranslation();
  const download = useTimesheetDownload(user);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/20 bg-white/20 p-5 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/20 sm:p-6">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-[#004097] dark:text-blue-300">{t('timesheetDownloadTitle', 'Timesheet Download')}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('timesheetDownloadSubtext', 'Download branch timesheet reports in Excel by month, cutoff period, and year.')}
            </p>
          </div>

          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('branch', 'Branch')}</span>
              <select
                value={download.selectedBranch}
                onChange={(event) => download.setSelectedBranch(event.target.value as BranchValue)}
                className="w-full rounded-lg border border-gray-400/50 bg-white/60 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-black/40"
              >
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('month', 'Month')}</span>
              <select
                value={download.selectedMonth}
                onChange={(event) => download.setSelectedMonth(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-400/50 bg-white/60 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-black/40"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('period', 'Period')}</span>
              <select
                value={download.selectedCutoff}
                onChange={(event) => download.setSelectedCutoff(event.target.value as CutoffValue)}
                className="w-full rounded-lg border border-gray-400/50 bg-white/60 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-black/40"
              >
                {CUTOFF_OPTIONS.map((cutoff) => (
                  <option key={cutoff.value} value={cutoff.value}>
                    {cutoff.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('year', 'Year')}</span>
              <select
                value={download.selectedYear}
                onChange={(event) => download.setSelectedYear(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-400/50 bg-white/60 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-black/40"
              >
                {download.yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-start sm:justify-end">
              <button
                type="button"
                onClick={download.handleDownload}
                disabled={download.isDownloading}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                title={download.isDownloading ? 'Downloading...' : 'Download Excel'}
                aria-label={download.isDownloading ? 'Downloading report' : 'Download timesheet report'}
              >
                {download.isDownloading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
                ) : (
                  <DownloadIcon />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {download.statusMessage && <p className="text-sm text-green-700 dark:text-green-300">{download.statusMessage}</p>}
      {download.errorMessage && <p className="text-sm text-red-600 dark:text-red-300">{download.errorMessage}</p>}
    </div>
  );
};

export default TimesheetDownloadTab;
