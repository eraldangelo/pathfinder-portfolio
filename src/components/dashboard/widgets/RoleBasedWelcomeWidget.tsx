import React, { useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { isAdminLikeRole, isOperationsLikeRole } from '../../../utils/roles';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { ApplicationInfo } from '../../../data/applications';
import type { User } from '../../../types';
import { IMAGE_LINKS } from '@/config/imageLinks';

interface RoleBasedWelcomeWidgetProps {
  user: User;
  role: string;
  leads: Lead[];
  applications: ApplicationInfo[];
}

const RoleBasedWelcomeWidget: React.FC<RoleBasedWelcomeWidgetProps> = ({ user, role, leads }) => {
  const { t } = useTranslation();

  const { mainStat, secondaryStat } = useMemo(() => {
    const getConversionRate = (leadList: Lead[]) => {
      const newLeads = leadList.filter(l => l.leadStatus === 'New Lead');
      const consultedLeads = leadList.filter(l => l.leadStatus === 'Consulted');
      const total = newLeads.length + consultedLeads.length;
      return total > 0 ? (consultedLeads.length / total) * 100 : 0;
    };

    const isAdminLike = isAdminLikeRole(role);
    const isOperationsLike = isOperationsLikeRole(role);
    if (isOperationsLike || isAdminLike) {
      const branchLeads = leads.filter(l => l.branch === user.branch);
      const pendingLeads = branchLeads.filter(l => l.leadStatus === 'New Lead').length;
      const conversionRate = getConversionRate(branchLeads);
      return {
        mainStat: {
          label: isOperationsLike ? t('teamsPendingLeads') : t('branchPendingLeads'),
          value: pendingLeads.toString(),
          change: '+0%',
          changeColor: 'text-green-500',
        },
        secondaryStat: {
          label: isOperationsLike ? t('teamConversionRate') : t('branchConversionRate'),
          value: `${conversionRate.toFixed(1)}%`,
          change: '-0%',
          changeColor: 'text-red-500',
        },
      };
    }

    const myLeads = leads.filter(l => l.assignedCounsellor === user.displayName);
    const myConversionRate = getConversionRate(myLeads);

    return {
      mainStat: {
        label: t('todaysLeadEndorsement'),
        value: '0',
        change: '+0%',
        changeColor: 'text-green-500',
      },
      secondaryStat: {
        label: t('myConversionRate'),
        value: `${myConversionRate.toFixed(1)}%`,
        change: '-0%',
        changeColor: 'text-red-500',
      },
    };
  }, [role, user, leads, t]);

  const welcomeName = user.preferredName || user.firstName || user.displayName?.split(' ')[0] || 'User';
  const secondaryStatPercentage = parseFloat(secondaryStat.value) || 0;

  return (
    <div className="relative backdrop-blur-md bg-white/40 dark:bg-black/70 shadow-lg border border-white/20 dark:border-white/10 rounded-2xl p-6 sm:p-8 overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `url('${IMAGE_LINKS.branding.welcomeBg}')`,
        }}
      ></div>
      <div className="absolute inset-0 z-[-1] bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/30 dark:to-purple-900/30"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-start items-center gap-12">
        <div className="flex-1 w-full">
          <h2 className="text-3xl font-bold text-[#004097] dark:text-blue-300">
            {t('welcomeUser', { userFirstName: welcomeName })}
          </h2>
          <div className="flex items-center gap-8 mt-6">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase">{mainStat.label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1 flex items-center gap-2">
                {mainStat.value}
                <span className={`text-sm font-semibold ${mainStat.changeColor} flex items-center`}>
                  {mainStat.change}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </span>
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1.5">
                <div className="bg-green-500 h-1 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase">{secondaryStat.label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1 flex items-center gap-2">
                {secondaryStat.value}
                <span className={`text-sm font-semibold ${secondaryStat.changeColor} flex items-center`}>
                  {secondaryStat.change}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </span>
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1.5">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${secondaryStatPercentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedWelcomeWidget;


