import React, { useMemo } from 'react';
import Image from 'next/image';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { ApplicationInfo } from '../../../data/applications';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { AssessmentSubmission } from '../../../types';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import { CalendarCheckIcon, ExclamationIcon, UserPlusIcon } from '../components/icons';
import { StatCard, Widget } from '../components/common';
import { RankedMetricList, ToggleableRankedMetricList } from './RankedMetricList';
import {
  buildLeadsEndorsedByCounsellor,
  buildTopVisaGrantCounsellors,
} from '../utils/teamRankingMetrics';
import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE, ALL_YEARS_VALUE } from '../utils/funnelFilters';
import { buildMergedTopReferrers, getPodiumMedalIconUrl, getPodiumMedalTitle } from './teamWidgetsHelpers';

const renderRankBadge = (index: number, includeFallbackRank: boolean) => {
  const medalTitle = getPodiumMedalTitle(index) || `Rank ${index + 1}`;
  const medalIconUrl = getPodiumMedalIconUrl(index);

  if (medalIconUrl) {
    return (
      <Image
        src={medalIconUrl}
        alt={medalTitle}
        width={28}
        height={28}
        title={medalTitle}
        className="h-7 w-7 flex-shrink-0 object-contain"
      />
    );
  }

  if (!includeFallbackRank) return undefined;

  return (
    <span
      title={medalTitle}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2 bg-gray-200 text-gray-700 ring-gray-200"
    >
      {index + 1}
    </span>
  );
};

export const TopCounsellors: React.FC<{
  title: string;
  applications?: ApplicationInfo[];
  leads?: Lead[];
  assessmentSubmissions?: AssessmentSubmission[];
  rankings?: Array<{ name: string; grants: number }>;
  selectedMonth?: string;
  selectedYear?: string;
  selectedQuarter?: string;
  columns?: number;
}> = ({
  title,
  applications,
  leads,
  assessmentSubmissions,
  rankings,
  selectedMonth = ALL_MONTHS_VALUE,
  selectedYear = ALL_YEARS_VALUE,
  selectedQuarter = ALL_QUARTERS_VALUE,
  columns = 1,
}) => {
  const { t } = useTranslation();

  const topCounsellors = useMemo(() => {
    const rankedCounsellors = Array.isArray(rankings) && rankings.length > 0
      ? rankings
      : buildTopVisaGrantCounsellors(
          applications ?? [],
          leads ?? [],
          assessmentSubmissions ?? [],
          selectedMonth,
          selectedYear,
          selectedQuarter,
        );

    return rankedCounsellors.map((item, index) => ({
        id: item.name,
        value: item.grants,
        leading: renderRankBadge(index, true),
        primary: <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>,
      }));
  }, [applications, assessmentSubmissions, leads, rankings, selectedMonth, selectedQuarter, selectedYear]);

  return (
    <Widget title={title}>
      <div className="space-y-4">
        <RankedMetricList
          items={topCounsellors}
          emptyState={<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">{t('noDataAvailable')}</div>}
          barClassName="bg-gradient-to-r from-blue-500 to-cyan-500"
          columns={columns}
        />
      </div>
    </Widget>
  );
};

export const TopStaffReferrers: React.FC<{
  title: string;
  assessmentSubmissions?: AssessmentSubmission[];
  rankings?: Array<{ name: string; referrals: number }>;
  allPersonnel?: PersonnelWithDetails[];
  columns?: number;
}> = ({ title, assessmentSubmissions, rankings, allPersonnel, columns = 1 }) => {
  const { t } = useTranslation();

  const topReferrers = useMemo(() => {
    const mergedReferrers = buildMergedTopReferrers({ assessmentSubmissions, rankings, allPersonnel });

    return mergedReferrers.map((item, index) => ({
        id: item.key,
        value: item.referrals,
        leading: renderRankBadge(index, false),
        primary: <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>,
        hideBar: true,
      }));
  }, [allPersonnel, assessmentSubmissions, rankings]);

  return (
    <Widget title={title}>
      <div className="space-y-3">
        <RankedMetricList
          items={topReferrers}
          emptyState={<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">{t('noDataAvailable')}</div>}
          columns={columns}
        />
      </div>
    </Widget>
  );
};

export const LeadsEndorsedWidget: React.FC<{
  title: string;
  leads: Lead[];
  assessmentSubmissions: AssessmentSubmission[];
  allPersonnel: PersonnelWithDetails[];
  branch: string | null | undefined;
}> = ({ title, leads, assessmentSubmissions, allPersonnel, branch }) => {
  const { t } = useTranslation();

  const endorsedCounsellors = useMemo(
    () =>
      buildLeadsEndorsedByCounsellor({
        leads,
        assessmentSubmissions,
        allPersonnel,
        branch,
      }),
    [allPersonnel, assessmentSubmissions, branch, leads]
  );

  const endorsedItems = useMemo(() => {
    return endorsedCounsellors.map((item) => ({
      id: item.name,
      value: item.leads,
      primary: <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>,
    }));
  }, [endorsedCounsellors]);

  return (
    <Widget title={title}>
      <div className="space-y-3">
        <ToggleableRankedMetricList
          items={endorsedItems}
          defaultVisibleCount={3}
          emptyState={<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">{t('noDataAvailable')}</div>}
          seeAllLabel={t('seeMore', 'See more')}
          showLessLabel={t('seeLess', 'See less')}
          barClassName="bg-gradient-to-r from-indigo-500 to-sky-500"
        />
      </div>
    </Widget>
  );
};

export const AdminDashboard: React.FC<{ leads: Lead[] }> = ({ leads }) => {
  const { t } = useTranslation();
  const kpiData = useMemo(() => {
    const newLeads = leads.filter(l => l.leadStatus === 'New Lead').length;
    const forFollowUp = leads.filter(l => l.leadStatus === 'For Follow Up').length;
    const noShows = leads.filter(l => l.leadStatus === 'No Show').length;
    return { newLeads, forFollowUp, noShows };
  }, [leads]);

  const stats = [
    { title: 'newLeads', value: kpiData.newLeads.toString(), icon: <UserPlusIcon />, color: 'bg-blue-500/80 text-white' },
    { title: 'forFollowUp', value: kpiData.forFollowUp.toString(), icon: <CalendarCheckIcon />, color: 'bg-yellow-500/80 text-white' },
    { title: 'noShowNoConsultation', value: kpiData.noShows.toString(), icon: <ExclamationIcon />, color: 'bg-red-500/80 text-white' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map(stat => (
        <StatCard key={stat.title} title={t(stat.title)} value={stat.value} icon={stat.icon} color={stat.color} />
      ))}
    </div>
  );
};

