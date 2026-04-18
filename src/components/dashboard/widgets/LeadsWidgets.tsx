import React, { useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Widget } from '../components/common';
import { RankedMetricList, ToggleableRankedMetricList } from './RankedMetricList';
import { parseLeadSourceOthersBreakdownDetails } from '../hooks/metrics/leadMetrics';

export const LeadsByBranch: React.FC<{ leadsByBranchData: { branch: string; leads: number }[] }> = ({ leadsByBranchData }) => {
  const { t } = useTranslation();
  const branchItems = useMemo(
    () =>
      leadsByBranchData.map((item) => ({
        id: item.branch,
        value: item.leads,
        primary: <span className="font-medium text-gray-800 dark:text-gray-200">{item.branch}</span>,
      })),
    [leadsByBranchData]
  );

  return (
    <Widget title={t('leadsByBranch')}>
      <div className="space-y-3">
        <RankedMetricList
          items={branchItems}
          emptyState={<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">{t('noDataAvailable')}</div>}
          barClassName="bg-indigo-500 transition-all duration-500 ease-out"
        />
      </div>
    </Widget>
  );
};

export const LeadsByCounsellorWidget: React.FC<{ data: { counsellor: string; leads: number }[]; title: string }> = ({ data, title }) => {
  const { t } = useTranslation();
  const counsellorItems = useMemo(
    () =>
      data.map((item) => ({
        id: item.counsellor,
        value: item.leads,
        primary: <span className="font-medium text-gray-800 dark:text-gray-200">{item.counsellor}</span>,
      })),
    [data]
  );

  return (
    <Widget title={title}>
      <div className="space-y-3">
        <RankedMetricList
          items={counsellorItems}
          emptyState={<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">{t('noDataAvailable')}</div>}
        />
      </div>
    </Widget>
  );
};

export const TopLeadSource: React.FC<{
  title: React.ReactNode;
  leadSources: { source: string; count: number; details?: string }[];
}> = ({ title, leadSources }) => {
  const { t } = useTranslation();
  const leadSourceItems = useMemo(
    () => {
      const items: Array<{
        id: string;
        value: number;
        primary: React.ReactNode;
        hideBar?: boolean;
        hideValue?: boolean;
      }> = [];

      leadSources.forEach((source, index) => {
        if (source.source === 'Others') {
          const breakdown = parseLeadSourceOthersBreakdownDetails(source.details);
          if (breakdown && breakdown.length > 0) {
            items.push({
              id: `lead-others-header-${index}`,
              value: 0,
              primary: <span className="font-medium text-gray-800 dark:text-gray-200">Others</span>,
              hideBar: true,
              hideValue: true,
            });

            breakdown.forEach((entry, entryIndex) => {
              items.push({
                id: `lead-other-item-${entry.label}-${entryIndex}`,
                value: entry.count,
                primary: <span className="font-medium text-gray-800 dark:text-gray-200 block pl-3">{entry.label}</span>,
              });
            });
            return;
          }
        }

        items.push({
          id: source.source,
          value: source.count,
          primary: <span className="font-medium text-gray-800 dark:text-gray-200">{source.source}</span>,
        });
      });

      return items;
    },
    [leadSources]
  );

  return (
    <Widget title={title}>
      <div className="space-y-3">
        <ToggleableRankedMetricList
          items={leadSourceItems}
          emptyState={<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">{t('noDataAvailable')}</div>}
          seeAllLabel={t('seeAll')}
          showLessLabel={t('showLess')}
          barClassName="bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
        />
      </div>
    </Widget>
  );
};
