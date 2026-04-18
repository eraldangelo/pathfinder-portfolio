import React from 'react';
import Image from 'next/image';
import { useTranslation } from '../../../contexts/LanguageContext';
import { MobileSidebarCollapsedActions } from './MobileSidebarCollapsedActions';
import { MobileSidebarExpandedActions } from './MobileSidebarExpandedActions';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './MobileSidebarIcons';
import { MobileSidebarNav } from './MobileSidebarNav';
import type { MobileSidebarProps } from '../types/MobileSidebarTypes';
import { MobileSidebarUserSection } from './MobileSidebarUserSection';
import { getActivityStatusColorClass } from '../../../utils/activityStatus';

const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
    isOpen, 
    onClose, 
    onLogout, 
    navItems, 
    user, 
    timeTrackingStatus,
    onTimeIn,
    onTimeOut,
    onStartLunch,
    onEndLunch,
    notificationCount,
    onClearNotifications,
    hasTimedInToday,
    hasTakenLunchToday,
    timeLog,
    isCollapsed,
    onToggleCollapse,
    logoUrl,
    onOpenProfile,
    onGoToDashboard,
    onGoToLeads,
    onGoToApplications,
    onGoToArchive,
    onGoToEducationProviders,
    onGoToTimesheet,
    onGoToPersonnel,
    onGoToNotifications
}) => {
    const { t } = useTranslation();
    
    // --- State-based button logic ---
    const showTimeOutButton = timeTrackingStatus === 'timed-in' || timeTrackingStatus === 'on-lunch';
    const isTimeOutButtonDisabled = timeTrackingStatus === 'on-lunch';
    const isLunchButtonDisabled = timeTrackingStatus !== 'timed-in' || hasTakenLunchToday;

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full transform transition-all duration-300 ease-in-out z-50 lg:z-20 flex flex-col crystal-glass-multi border-r border-white/40 dark:border-white/15 w-72 p-6 ${isCollapsed ? 'lg:w-24 lg:p-3' : 'lg:w-72'} ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
                role="dialog"
                aria-modal={!isOpen}
                aria-labelledby="sidebar-title"
            >
                <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex absolute top-1/2 -right-3.5 transform -translate-y-1/2 w-7 h-7 rounded-full items-center justify-center shadow-lg transition-colors backdrop-blur-md border border-white/40 dark:border-white/10 bg-white/30 hover:bg-white/50 dark:bg-black/20 dark:hover:bg-black/40 text-[#004097] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
                >
                    {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </button>

                <header className={`relative flex items-start justify-center transition-all duration-300`}>
                     <div className={`relative transition-all duration-300 ease-in-out w-44 aspect-[3/1] ${isCollapsed ? 'lg:w-16 lg:my-2' : ''}`}>
                        <Image
                            src={logoUrl}
                            alt="Pathfinder Logo"
                            fill
                            className="object-contain"
                            sizes="176px"
                            loading="eager"
                        />
                    </div>
                     <button onClick={onClose} className={`absolute top-0 right-0 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-800 dark:text-white lg:hidden`} aria-label={t('closeMenu')}>
                        <XIcon />
                    </button>
                </header>
                
                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto -mx-2 px-2 custom-scrollbar">
                    {user && (
                        <MobileSidebarUserSection
                            user={user}
                            isCollapsed={isCollapsed}
                            statusIndicatorClass={getActivityStatusColorClass(timeTrackingStatus)}
                            onOpenProfile={onOpenProfile}
                        />
                    )}

                    <MobileSidebarNav
                        navItems={navItems}
                        isCollapsed={isCollapsed}
                        notificationCount={notificationCount}
                        onClose={onClose}
                        onGoToDashboard={onGoToDashboard}
                        onGoToLeads={onGoToLeads}
                        onGoToApplications={onGoToApplications}
                        onGoToArchive={onGoToArchive}
                        onGoToEducationProviders={onGoToEducationProviders}
                        onGoToTimesheet={onGoToTimesheet}
                        onGoToPersonnel={onGoToPersonnel}
                        onGoToNotifications={onGoToNotifications}
                    />
                </div>
                
                {/* Expanded Bottom Section */}
                <div className={`${isCollapsed ? 'lg:hidden' : 'block'}`}>
                    <MobileSidebarExpandedActions
                        timeTrackingStatus={timeTrackingStatus}
                        timeLog={timeLog}
                        showTimeOutButton={showTimeOutButton}
                        isTimeOutButtonDisabled={isTimeOutButtonDisabled}
                        isLunchButtonDisabled={isLunchButtonDisabled}
                        hasTimedInToday={hasTimedInToday}
                        onTimeIn={onTimeIn}
                        onTimeOut={onTimeOut}
                        onStartLunch={onStartLunch}
                        onEndLunch={onEndLunch}
                        onLogout={onLogout}
                    />
                </div>
                
                {/* Collapsed Bottom Section */}
                <MobileSidebarCollapsedActions
                    isCollapsed={isCollapsed}
                    timeTrackingStatus={timeTrackingStatus}
                    showTimeOutButton={showTimeOutButton}
                    isTimeOutButtonDisabled={isTimeOutButtonDisabled}
                    isLunchButtonDisabled={isLunchButtonDisabled}
                    hasTimedInToday={hasTimedInToday}
                    onTimeIn={onTimeIn}
                    onTimeOut={onTimeOut}
                    onStartLunch={onStartLunch}
                    onEndLunch={onEndLunch}
                    onLogout={onLogout}
                />
            </aside>
        </>
    );
};

export default MobileSidebar;
