import { useEffect, useState } from 'react';
import type { LeadsDatasetTab } from '../LeadsPageTypes';

const resolveDatasetTab = (requestedTab: LeadsDatasetTab, canViewArchivedLeads: boolean): LeadsDatasetTab => {
  if (requestedTab === 'archived' && canViewArchivedLeads) return 'archived';
  return 'current';
};

export const useLeadsDatasetTab = (
  initialViewTab: LeadsDatasetTab,
  canViewArchivedLeads: boolean,
) => {
  const [activeDatasetTab, setActiveDatasetTab] = useState<LeadsDatasetTab>(() =>
    resolveDatasetTab(initialViewTab, canViewArchivedLeads),
  );

  useEffect(() => {
    setActiveDatasetTab(resolveDatasetTab(initialViewTab, canViewArchivedLeads));
  }, [canViewArchivedLeads, initialViewTab]);

  return {
    activeDatasetTab,
    setActiveDatasetTab,
  };
};
