import React, { useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { ApplicationInfo } from '../../../data/applications';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { AssessmentSubmission, User } from '../../../types';
import { Widget } from '../components/common';
import { mapAssessmentSubmissionToLeadRow } from '../../leads/leads-page/assessmentSubmissionUtils';
import { hasStatusInCurrentOrHistory } from '../utils/applicationStatusMatcher';
import { isMilestoneInWindow } from '../hooks/metrics/funnelMilestoneWindow';
import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE } from '../utils/funnelFilters';
const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();
const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  return null;
};
const isInCurrentMonth = (value: unknown, currentDate: Date) => {
  const parsed = toDate(value);
  if (!parsed) return false;
  return parsed.getFullYear() === currentDate.getFullYear() && parsed.getMonth() === currentDate.getMonth();
};
const isLeadAssignedToUser = (lead: Lead, user: User) => {
  const currentUid = normalize(user.uid);
  const assignedUid = normalize(lead.assignedCounsellorUid);
  if (currentUid && assignedUid) {
    return currentUid === assignedUid;
  }

  const currentName = normalize(user.displayName);
  const assignedName = normalize(lead.assignedCounsellor);
  return currentName !== '' && currentName === assignedName;
};
const isApplicationAssignedToUser = (
  application: ApplicationInfo,
  leadById: Map<string, Lead>,
  user: User
) => {
  const currentUid = normalize(user.uid);
  const currentName = normalize(user.displayName);
  const appAssignedUid = normalize(
    (application as unknown as { assignedCounsellorUid?: string | null }).assignedCounsellorUid
  );
  const appAssignedName = normalize(
    (application as unknown as { assignedCounsellor?: string | null }).assignedCounsellor
  );

  if (currentUid && appAssignedUid && currentUid === appAssignedUid) {
    return true;
  }
  if (currentName && appAssignedName && currentName === appAssignedName) {
    return true;
  }

  const linkedLead = leadById.get(application.studentId);
  return linkedLead ? isLeadAssignedToUser(linkedLead, user) : false;
};
export const MyActiveLeadsWidget: React.FC<{
  leads: Lead[];
  assessmentSubmissions: AssessmentSubmission[];
  allPersonnel: PersonnelWithDetails[];
  user: User;
}> = ({ leads, assessmentSubmissions, allPersonnel, user }) => {
  const { t } = useTranslation();
  const myLeadsCount = useMemo(() => {
    const currentDate = new Date();
    const assignedLeadIds = new Set<string>();
    leads.forEach((lead) => {
      if (isLeadAssignedToUser(lead, user) && isInCurrentMonth(lead.submittedAt, currentDate)) {
        assignedLeadIds.add(lead.id);
      }
    });
    assessmentSubmissions.forEach((submission) => {
      const submissionLead = mapAssessmentSubmissionToLeadRow(submission, allPersonnel);
      if (
        isLeadAssignedToUser(submissionLead, user)
        && isInCurrentMonth(submission.createdAt ?? submissionLead.submittedAt, currentDate)
      ) {
        assignedLeadIds.add(submissionLead.id);
      }
    });
    return assignedLeadIds.size;
  }, [allPersonnel, assessmentSubmissions, leads, user]);
  return (
    <Widget title={t('myLeads', 'My Leads')}>
      <div className="text-center py-4">
        <p className="text-5xl font-bold text-[#004097] dark:text-blue-300">{myLeadsCount}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('leadsAssignedToYouThisMonth', 'Leads Assigned To You This Month')}
        </p>
      </div>
    </Widget>
  );
};
export const VisaStatusBreakdownWidget: React.FC<{
  applications: ApplicationInfo[];
  leads: Lead[];
  user: User;
  selectedMonth?: string;
  selectedYear?: string;
  selectedQuarter?: string;
}> = ({
  applications,
  leads,
  user,
  selectedMonth = ALL_MONTHS_VALUE,
  selectedYear = String(new Date().getFullYear()),
  selectedQuarter = ALL_QUARTERS_VALUE,
}) => {
  const { t } = useTranslation();
  const myAssignedApplications = useMemo(() => {
    const leadById = new Map(leads.map((lead) => [lead.id, lead]));
    return applications.filter((application) => isApplicationAssignedToUser(application, leadById, user));
  }, [applications, leads, user]);
  const myVisaStats = useMemo(() => {
    return {
      lodged: myAssignedApplications.filter((application) =>
        isMilestoneInWindow(application, 'lodge', selectedMonth, selectedYear, selectedQuarter)
      ).length,
      granted: myAssignedApplications.filter((application) =>
        isMilestoneInWindow(application, 'grant', selectedMonth, selectedYear, selectedQuarter)
      ).length,
      refused: myAssignedApplications.filter((application) =>
        isMilestoneInWindow(application, 'refuse', selectedMonth, selectedYear, selectedQuarter)
      ).length,
    };
  }, [myAssignedApplications, selectedMonth, selectedQuarter, selectedYear]);
  const overallVisaStats = useMemo(() => {
    return {
      lodged: myAssignedApplications.filter((application) =>
        hasStatusInCurrentOrHistory(application, 'visa lodged')
      ).length,
      granted: myAssignedApplications.filter((application) =>
        hasStatusInCurrentOrHistory(application, 'visa granted')
      ).length,
      refused: myAssignedApplications.filter((application) =>
        hasStatusInCurrentOrHistory(application, 'visa refused')
      ).length,
    };
  }, [myAssignedApplications]);
  const overallVisaDecisions = useMemo(
    () => overallVisaStats.granted + overallVisaStats.refused,
    [overallVisaStats.granted, overallVisaStats.refused]
  );
  const visaGrantRate = useMemo(() => {
    if (overallVisaDecisions > 0) {
      return (overallVisaStats.granted / overallVisaDecisions) * 100;
    }
    if (overallVisaStats.lodged > 0) {
      return (overallVisaStats.granted / overallVisaStats.lodged) * 100;
    }
    return 0;
  }, [overallVisaDecisions, overallVisaStats.granted, overallVisaStats.lodged]);
  const pipelineRows = useMemo(
    () => {
      const barScaleMax = Math.max(1, myVisaStats.lodged, myVisaStats.granted, myVisaStats.refused);
      const rows = [
        {
          key: 'lodged',
          label: t('visaLodged'),
          actual: myVisaStats.lodged,
          colorClass: 'bg-blue-500',
        },
        {
          key: 'granted',
          label: t('visaGranted'),
          actual: myVisaStats.granted,
          colorClass: 'bg-green-500',
        },
        {
          key: 'refused',
          label: t('visaRefused'),
          actual: myVisaStats.refused,
          colorClass: 'bg-red-500',
        },
      ];
      return rows.map((row) => ({
        ...row,
        clampedAchievement: Math.min(100, barScaleMax > 0 ? (row.actual / barScaleMax) * 100 : 0),
      }));
    },
    [
      myVisaStats.granted,
      myVisaStats.lodged,
      myVisaStats.refused,
      t,
    ],
  );
  return (
    <Widget title={t('myVisaPipeline')}>
      <div className="space-y-4">
        {pipelineRows.map((row) => (
          <div key={row.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">{row.label}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                {row.actual.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className={`${row.colorClass} h-3 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${row.clampedAchievement}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t('actual', 'Actual')}: {row.actual.toLocaleString()}</span>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-200/70 dark:border-gray-700/70">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('visaGrantRate', 'Visa Grant Rate')}
            </span>
            <span className="text-lg font-bold text-[#004097] dark:text-blue-300">
              {visaGrantRate.toFixed(1)}%
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {overallVisaDecisions > 0
              ? `${overallVisaStats.granted} / ${overallVisaDecisions} ${t('visaGranted', 'Visa Granted')} vs ${t('visaDecisions', 'Visa Decisions')}`
              : `${overallVisaStats.granted} / ${overallVisaStats.lodged} ${t('visaGranted', 'Visa Granted')} vs ${t('visaLodged', 'Visa Lodged')}`}
          </p>
        </div>
      </div>
    </Widget>
  );
};

