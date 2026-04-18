import { useCallback, useEffect, useState } from 'react';
import { TABS_ORDER } from '../utils/StudentInfoModalConstants';
import type { Tab } from '../utils/StudentInfoModalTypes';

interface UseStudentInfoModalTabsParams {
    initialTab?: Tab;
    defaultTab?: Tab;
    tabsOrder?: Tab[];
}

export const useStudentInfoModalTabs = ({
    initialTab,
    defaultTab = 'studentInfo',
    tabsOrder = TABS_ORDER,
}: UseStudentInfoModalTabsParams) => {
    const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
    const [animationClass, setAnimationClass] = useState('animate-fade-in-fast');

    const handleTabClick = useCallback((newTab: Tab) => {
        const oldIndex = tabsOrder.indexOf(activeTab);
        const newIndex = tabsOrder.indexOf(newTab);

        if (oldIndex === newIndex) return;

        if (newIndex > oldIndex) {
            setAnimationClass('animate-slide-in-right');
        } else {
            setAnimationClass('animate-slide-in-left');
        }

        setActiveTab(newTab);
    }, [activeTab, tabsOrder]);

    useEffect(() => {
        if (!initialTab) return;
        setActiveTab((prevTab) => {
            const oldIndex = tabsOrder.indexOf(prevTab);
            const newIndex = tabsOrder.indexOf(initialTab);
            if (newIndex === oldIndex) return prevTab;
            setAnimationClass(newIndex > oldIndex ? 'animate-slide-in-right' : 'animate-slide-in-left');
            return initialTab;
        });
    }, [initialTab, tabsOrder]);

    return {
        activeTab,
        setActiveTab,
        animationClass,
        handleTabClick,
    };
};
