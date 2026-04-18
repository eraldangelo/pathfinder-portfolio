import { useMemo, useState } from 'react';
import { db, ensureFirebaseReady } from '../../../../services/firebase';
import { getLocalDateKey, mapTimesheetDocToDailyLog, type FirestoreTimesheetDoc } from '../../../../utils/timesheet';
import type { DailyLog } from '../../../../data/timesheet';
import type { User } from '../../../../types';
import { BRANCH_OPTIONS, MONTH_OPTIONS } from './constants';
import type { BranchValue, CutoffValue, StaffReport } from './types';
import { buildStaffSummaryFromLogs, normalize, toBranchDisplay } from './utils';
import { buildTimesheetWorkbookBuffer } from './workbookBuilder';

export const useTimesheetDownload = (user: User) => {
  const now = new Date();
  const [selectedBranch, setSelectedBranch] = useState<BranchValue>('Makati');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedCutoff, setSelectedCutoff] = useState<CutoffValue>('1-15');
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= 2024; year -= 1) years.push(year);
    return years;
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const ready = await ensureFirebaseReady();
      if (!ready || !db) {
        throw new Error('Firebase is not ready. Please refresh and try again.');
      }

      const branchConfig = BRANCH_OPTIONS.find((option) => option.value === selectedBranch)!;
      const branchAliases = new Set(branchConfig.aliases.map((alias) => normalize(alias)));
      const monthMeta = MONTH_OPTIONS.find((month) => month.value === selectedMonth)!;
      const startDay = selectedCutoff === '1-15' ? 1 : 16;
      const endDay = selectedCutoff === '1-15' ? 15 : Math.min(30, new Date(selectedYear, selectedMonth + 1, 0).getDate());
      const periodStart = new Date(selectedYear, selectedMonth, startDay);
      const periodEnd = new Date(selectedYear, selectedMonth, endDay);
      const startKey = getLocalDateKey(periodStart);
      const endKey = getLocalDateKey(periodEnd);

      const personnelSnapshot = await db.collection('personnel').get();
      const staff = personnelSnapshot.docs
        .map((doc: any) => ({ uid: doc.id, ...(doc.data() || {}) }))
        .filter((person: any) => person.uid && branchAliases.has(normalize(person.branch)));

      const staffReports = (
        await Promise.all(
          staff.map(async (person: any): Promise<StaffReport> => {
            const timesheetSnapshot = await db
              .collection('personnel')
              .doc(person.uid)
              .collection('timesheets')
              .where('dateKey', '>=', startKey)
              .where('dateKey', '<=', endKey)
              .get();

            const logs = (timesheetSnapshot.docs || [])
              .map((doc: any) => {
                const data = doc.data() as FirestoreTimesheetDoc;
                return mapTimesheetDocToDailyLog({ ...data, dateKey: data?.dateKey || doc.id });
              })
              .filter((log: DailyLog | null): log is DailyLog => Boolean(log))
              .sort((a, b) => a.date.getTime() - b.date.getTime());

            const summary = buildStaffSummaryFromLogs(logs);
            return {
              uid: String(person.uid),
              name: String(person.name || person.email || 'Unknown'),
              role: String(person.role || ''),
              branch: toBranchDisplay(person.branch) || branchConfig.label,
              logs,
              presentDays: summary.presentDays,
              absentDays: summary.absentDays,
              leaveDays: summary.leaveDays,
              offsetDays: summary.offsetDays,
              pendingDays: summary.pendingDays,
              totalMinutes: summary.totalMinutes,
            };
          })
        )
      ).sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

      const { workbookBinary, fileName } = await buildTimesheetWorkbookBuffer({
        user,
        staffReports,
        branchLabel: branchConfig.label,
        monthLabel: monthMeta.label,
        selectedCutoff,
        selectedYear,
        periodStart,
        periodEnd,
      });

      const blob = new Blob([workbookBinary], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setStatusMessage(`Downloaded workbook with ${staffReports.length} staff tabs for ${branchConfig.label}.`);
    } catch (error: any) {
      console.error('Error downloading timesheet report:', error);
      setErrorMessage(error?.message || 'Failed to download timesheet report.');
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    selectedBranch,
    setSelectedBranch,
    selectedMonth,
    setSelectedMonth,
    selectedCutoff,
    setSelectedCutoff,
    selectedYear,
    setSelectedYear,
    isDownloading,
    statusMessage,
    errorMessage,
    yearOptions,
    handleDownload,
  };
};
