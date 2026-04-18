import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './icons';
import { glassPanel } from '../../common/styles/ui';

export const Widget: React.FC<{
  children: React.ReactNode;
  className?: string;
  title: React.ReactNode;
  isCollapsible?: boolean;
  initialCollapsed?: boolean;
  headerContent?: React.ReactNode;
}> = ({
  children,
  className = '',
  title,
  isCollapsible = false,
  initialCollapsed = false,
  headerContent,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  return (
    <div className={`${glassPanel} dark:bg-black/60 rounded-2xl ${className}`}>
      <div className="flex flex-col gap-3 p-4 sm:p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-tight text-[#004097] dark:text-blue-300 sm:text-lg">{title}</h2>
        </div>
        {(headerContent || isCollapsible) && (
          <div className="flex items-center gap-2 self-start sm:ml-4">
            {headerContent ? <div className="min-w-0">{headerContent}</div> : null}
            {isCollapsible && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="rounded-full p-1 text-gray-500 hover:bg-black/10 dark:text-gray-400 dark:hover:bg-white/10"
                aria-expanded={!isCollapsed}
                aria-label={isCollapsed ? 'Expand widget' : 'Collapse widget'}
              >
                {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
              </button>
            )}
          </div>
        )}
      </div>
      <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`}>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">{children}</div>
      </div>
    </div>
  );
};

export const StatCard: React.FC<{
  title: React.ReactNode;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  iconClassName?: string;
  className?: string;
}> = ({ title, value, icon, color, iconClassName, className = '' }) => (
  <div className={`${glassPanel} dark:bg-black/60 rounded-xl p-4 flex min-w-0 items-center gap-4 ${className}`}>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconClassName ?? color}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-[#004097] dark:text-blue-300">{value}</p>
      <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  </div>
);
