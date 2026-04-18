import React, { useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import FlagIcon from '@/components/common/components/FlagIcon';
import { getCountryCode } from '@/data/reference/countries';
import { GlobeIconWidget } from '../components/icons';
import { Widget } from '../components/common';
import { parseOthersBreakdownDetails } from '../hooks/metrics/courseMetrics';
import { parseDestinationOthersBreakdownDetails } from '../hooks/metrics/destinationMetrics';
import { ToggleableRankedMetricList } from './RankedMetricList';

export const TopCountryDestinations: React.FC<{
  title: string;
  destinations: { name: string; code?: string; details?: string; apps: number }[];
}> = ({ title, destinations }) => {
  const { t } = useTranslation();
  const destinationItems = useMemo(
    () => {
      const renderLeading = (name: string, code?: string) => {
        const resolvedCountryCode = String(code ?? '').trim().toLowerCase() || getCountryCode(name);
        if (!resolvedCountryCode) {
          return (
            <div className="w-8 h-8 flex items-center justify-center text-gray-400 flex-shrink-0">
              <GlobeIconWidget className="w-7 h-7" />
            </div>
          );
        }

        return (
          <FlagIcon
            countryCode={resolvedCountryCode}
            label={name}
            className="w-8 h-6 rounded-md shadow-sm flex-shrink-0"
            fallback={
              <div className="w-8 h-8 flex items-center justify-center text-gray-400 flex-shrink-0">
                <GlobeIconWidget className="w-7 h-7" />
              </div>
            }
          />
        );
      };

      const items: Array<{
        id: string;
        value: number;
        leading?: React.ReactNode;
        primary: React.ReactNode;
        hideBar?: boolean;
        hideValue?: boolean;
      }> = [];

      destinations.forEach((dest, index) => {
        if (dest.name === 'Other') {
          const breakdown = parseDestinationOthersBreakdownDetails(dest.details);
          if (breakdown && breakdown.length > 0) {
            items.push({
              id: `destination-other-header-${index}`,
              value: 0,
              primary: <span className="font-semibold text-gray-800 dark:text-gray-200">Other:</span>,
              hideBar: true,
              hideValue: true,
            });

            breakdown.forEach((entry, entryIndex) => {
              items.push({
                id: `destination-other-item-${entry.label}-${entryIndex}`,
                value: entry.apps,
                leading: renderLeading(entry.label, entry.code),
                primary: <span className="font-semibold text-gray-800 dark:text-gray-200 truncate pl-2">{entry.label}</span>,
              });
            });
            return;
          }
        }

        items.push({
          id: dest.name,
          value: dest.apps,
          leading: renderLeading(dest.name, dest.code),
          primary: <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{dest.name}</span>,
        });
      });

      return items;
    },
    [destinations]
  );

  return (
    <Widget title={title}>
      <div className="space-y-3">
        <ToggleableRankedMetricList
          items={destinationItems}
          emptyState={<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">{t('noDataAvailable')}</div>}
          seeAllLabel={t('seeAll')}
          showLessLabel={t('showLess')}
          barClassName="bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
        />
      </div>
    </Widget>
  );
};

export const PreferredCourseOfStudy: React.FC<{
  title: React.ReactNode;
  courses: { name: string; details?: string; apps: number }[];
}> = ({ title, courses }) => {
  const { t } = useTranslation();
  const courseItems = useMemo(
    () => {
      const items: Array<{
        id: string;
        value: number;
        primary: React.ReactNode;
        secondary?: React.ReactNode;
        hideBar?: boolean;
        hideValue?: boolean;
      }> = [];

      courses.forEach((course, index) => {
        if (course.name === 'Others') {
          const breakdown = parseOthersBreakdownDetails(course.details);
          if (breakdown && breakdown.length > 0) {
            items.push({
              id: `others-header-${index}`,
              value: 0,
              primary: <span className="font-semibold text-gray-800 dark:text-gray-200 block">Other:</span>,
              hideBar: true,
              hideValue: true,
            });

            breakdown.forEach((entry, entryIndex) => {
              items.push({
                id: `other-item-${entry.label}-${entryIndex}`,
                value: entry.apps,
                primary: (
                  <span className="font-semibold text-gray-800 dark:text-gray-200 block pl-3">{entry.label}</span>
                ),
              });
            });
            return;
          }
        }

        items.push({
          id: course.name,
          value: course.apps,
          primary: <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block">{course.name}</span>,
          secondary: course.details ? <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{course.details}</p> : undefined,
        });
      });

      return items;
    },
    [courses]
  );

  return (
    <Widget title={title}>
      <div className="space-y-3">
        <ToggleableRankedMetricList
          items={courseItems}
          emptyState={<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">{t('noDataAvailable')}</div>}
          seeAllLabel={t('seeAll')}
          showLessLabel={t('showLess')}
          barClassName="bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
        />
      </div>
    </Widget>
  );
};
