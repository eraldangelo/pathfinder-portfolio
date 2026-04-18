import React, { useState, useEffect, useRef, useCallback } from 'react';
import ThemeToggle from './ThemeToggle';
import NotificationDropdown from './NotificationDropdown';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { TimeTrackingStatus, User, Theme } from '../../../types';
import type { PersistentNotificationItem } from '../../app/hooks/useNotifications';
import { BellIcon, MenuIcon } from './HeaderIcons';
import HeaderStatusIndicator from './HeaderStatusIndicator';

interface HeaderProps {
    user: User;
    userRole: string;
    theme: Theme;
    toggleTheme: () => void;
    timeTrackingStatus: TimeTrackingStatus;
    isReady: boolean;
    onMenuClick: () => void;
    notificationCount: number;
    onClearNotifications: () => void;
    isSidebarCollapsed: boolean;
    isNotificationDropdownOpen: boolean;
    setNotificationDropdownOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
    persistentNotifications: PersistentNotificationItem[];
    onOpenNotifications: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    user,
    userRole,
    theme, 
    toggleTheme, 
    timeTrackingStatus,
    isReady, 
    onMenuClick, 
    notificationCount, 
    onClearNotifications, 
    isSidebarCollapsed,
    isNotificationDropdownOpen,
    setNotificationDropdownOpen,
    persistentNotifications,
    onOpenNotifications,
}) => {
    const { t, locale } = useTranslation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isScrolled, setIsScrolled] = useState(false);
    const headerRef = useRef<HTMLElement>(null);
    const notificationAreaRef = useRef<HTMLDivElement>(null);

    const updateHeaderOffset = useCallback(() => {
        if (typeof document === 'undefined') return;
        if (headerRef.current) {
            document.documentElement.style.setProperty('--app-header-offset', `${headerRef.current.offsetHeight}px`);
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Effect to handle scroll for shrinking header, only on desktop
    useEffect(() => {
        const handleScroll = () => {
            // The lg breakpoint in Tailwind is typically 1024px.
            // We only apply the scroll effect on larger screens.
            if (window.innerWidth >= 1024) {
                setIsScrolled(window.scrollY > 20);
            } else {
                // On mobile views, the header should not shrink.
                setIsScrolled(false);
            }
        };

        // Run on mount, scroll, and resize
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    useEffect(() => {
        updateHeaderOffset();
    }, [isScrolled, updateHeaderOffset]);

    useEffect(() => {
        const handleResize = () => updateHeaderOffset();
        window.addEventListener('resize', handleResize, { passive: true });
        return () => window.removeEventListener('resize', handleResize);
    }, [updateHeaderOffset]);

    // Effect to handle clicks outside the notification dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationAreaRef.current && !notificationAreaRef.current.contains(event.target as Node)) {
                setNotificationDropdownOpen(false);
            }
        };

        if (isNotificationDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationDropdownOpen, setNotificationDropdownOpen]);
    
    const formattedTime = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(currentTime);
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat(locale, dateOptions).format(currentTime);


    const getGreetingKey = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "greetingMorning";
        if (hour < 18) return "greetingAfternoon";
        return "greetingEvening";
    };

    const getGreetingName = (): string => {
        return user.preferredName || user.firstName || user.displayName?.split(' ')[0] || user.email?.split('@')[0] || t('user');
    };

    const animationClasses = `transition-all duration-700 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`;
    const greeting = `${t(getGreetingKey())}, ${getGreetingName()}!`;

    return (
        <header ref={headerRef} className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${isSidebarCollapsed ? 'lg:left-24' : 'lg:left-72'} ${animationClasses}`}>
            <div className="crystal-glass-multi border-b border-white/40 dark:border-white/15">
                <div className={`flex items-center justify-between max-w-[1920px] mx-auto px-4 md:px-8 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
                    {/* Left Side: Contains menu button on mobile and greeting */}
                    <div className="flex items-center gap-2">
                         {/* Mobile Menu Button (Visible on mobile only) */}
                        <button onClick={onMenuClick} className="relative lg:hidden p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label={t('openMenu')}>
                            <MenuIcon />
                            {notificationCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                    {notificationCount}
                                </span>
                            )}
                        </button>
                        
                        {/* Greeting Text */}
                        <div>
                            <div className="flex items-baseline">
                                <p className={`font-bold text-[#004097] dark:text-blue-300 transition-all duration-300 ${isScrolled ? 'text-base' : 'text-base sm:text-lg'}`}>
                                    {greeting}
                                </p>
                                {/* This is the inline version, shown on scroll */}
                                <div aria-hidden={!isScrolled} className={`ml-2 flex items-center gap-2 text-gray-600 dark:text-white/80 whitespace-nowrap transition-all duration-300 ${isScrolled ? 'opacity-100 max-w-[500px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
                                    <span>|</span>
                                    <HeaderStatusIndicator status={timeTrackingStatus} />
                                    <span>|</span>
                                    <span className="text-sm">{`${formattedDate} | ${formattedTime}`}</span>
                                </div>
                            </div>
                            {/* This is the stacked version, hidden on scroll */}
                             <div aria-hidden={isScrolled} className={`flex items-center gap-2 text-gray-600 dark:text-white/80 whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-5 opacity-100'}`}>
                                <HeaderStatusIndicator status={timeTrackingStatus} />
                                <span>|</span>
                                <span className="text-sm">{`${formattedDate} | ${formattedTime}`}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Icons and Menu */}
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Theme Toggle (Visible on all screen sizes) */}
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

                        {/* Desktop-only controls */}
                        <div className="hidden lg:flex items-center gap-2">
                            <div ref={notificationAreaRef} className="relative">
                                <button 
                                    onClick={() => setNotificationDropdownOpen(prev => !prev)} 
                                    className="relative p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" 
                                    aria-label={t('notifications')}
                                >
                                    <BellIcon />
                                    {notificationCount > 0 && (
                                        <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                            {notificationCount}
                                        </span>
                                    )}
                                </button>
                                <NotificationDropdown 
                                    isOpen={isNotificationDropdownOpen}
                                    notifications={persistentNotifications}
                                    user={user}
                                    userRole={userRole}
                                    onMarkAllRead={() => {
                                        onClearNotifications();
                                        setNotificationDropdownOpen(false);
                                    }}
                                    onViewAll={() => {
                                        setNotificationDropdownOpen(false);
                                        onOpenNotifications();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

