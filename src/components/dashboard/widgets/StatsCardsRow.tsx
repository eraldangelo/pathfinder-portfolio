import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { FunnelData } from '../types/types';
import {
  BadgeCheckIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  ExclamationIcon,
  MailIcon,
  TrendingUpIcon,
  UserPlusIcon,
} from '../components/icons';
import { StatCard } from '../components/common';

const StatsCardsRow: React.FC<{ data: FunnelData | undefined }> = ({ data }) => {
  const { t } = useTranslation();
  const safeData: FunnelData = data || {
    totalLeads: '0',
    genuineStudents: '0',
    applications: '0',
    offers: '0',
    coe: '0',
    lodged: '0',
    granted: '0',
    refused: '0',
  };

  const stats = [
    { title: 'totalLeads', value: safeData.totalLeads, icon: <UserPlusIcon />, iconClassName: 'glass-orb orb-sky text-sky-700 dark:text-sky-200' },
    { title: 'genuineStudent', value: safeData.genuineStudents, icon: <CheckCircleIcon />, iconClassName: 'glass-orb orb-emerald text-emerald-700 dark:text-emerald-200' },
    { title: 'schoolApplications', value: safeData.applications, icon: <DocumentTextIcon />, iconClassName: 'glass-orb orb-blue text-blue-700 dark:text-blue-200' },
    { title: 'offersReceived', value: safeData.offers, icon: <MailIcon />, iconClassName: 'glass-orb orb-indigo text-indigo-700 dark:text-indigo-200' },
    { title: 'coeLoa', value: safeData.coe, icon: <DocumentCheckIcon />, iconClassName: 'glass-orb orb-purple text-purple-700 dark:text-purple-200' },
    { title: 'visaLodged', value: safeData.lodged, icon: <TrendingUpIcon />, iconClassName: 'glass-orb orb-teal text-teal-700 dark:text-teal-200' },
    { title: 'visaGranted', value: safeData.granted, icon: <BadgeCheckIcon />, iconClassName: 'glass-orb orb-green text-green-700 dark:text-green-200' },
    { title: 'visaRefused', value: safeData.refused, icon: <ExclamationIcon />, iconClassName: 'glass-orb orb-red text-red-700 dark:text-red-200' },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {stats.map(stat => (
        <div key={stat.title} className="min-w-0 flex-[1_1_220px]">
          <StatCard
            title={t(stat.title)}
            value={stat.value}
            icon={stat.icon}
            color=""
            iconClassName={stat.iconClassName}
            className="h-full w-full liquid-glass"
          />
        </div>
      ))}
    </div>
  );
};

export default StatsCardsRow;
