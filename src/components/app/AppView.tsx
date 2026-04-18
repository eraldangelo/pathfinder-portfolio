import React, { useEffect } from 'react';
import { usePersonnelAdminActions } from './hooks/usePersonnelAdminActions';
import { isSatelliteOfficeRole } from '../../utils/roles';
import { useAppViewContext } from './AppView.context';
import AppViewRouter from './views/AppViewRouter';

export type { AppViewProps } from './AppView.types';

const SATELLITE_RESTRICTED_VIEWS = new Set([
    'applications',
    'application-detail',
    'education-providers',
    'personnel',
]);

const AppView: React.FC = () => {
    const appView = useAppViewContext();
    const { onNavigateToDashboard } = appView;

    const isSatelliteOffice = isSatelliteOfficeRole(appView.userRole);
    const isSatelliteRestrictedView = isSatelliteOffice && SATELLITE_RESTRICTED_VIEWS.has(appView.view);
    const {
        activePersonnel,
        setActivePersonnel,
        isCreatePersonnelOpen,
        setIsCreatePersonnelOpen,
        handleDeletePersonnel,
        handleCreatePersonnel,
    } = usePersonnelAdminActions({
        currentUserUid: appView.user.uid,
        showPopup: appView.showPopup,
        onLoginAgain: appView.onLoginAgain,
    });

    useEffect(() => {
        if (isSatelliteRestrictedView) {
            onNavigateToDashboard();
        }
    }, [isSatelliteRestrictedView, onNavigateToDashboard]);

    return (
        <AppViewRouter
            {...appView}
            view={isSatelliteRestrictedView ? 'dashboard' : appView.view}
            activePersonnel={activePersonnel}
            onOpenPersonnelProfile={setActivePersonnel}
            isCreatePersonnelOpen={isCreatePersonnelOpen}
            onOpenCreateModal={() => setIsCreatePersonnelOpen(true)}
            onCloseCreateModal={() => setIsCreatePersonnelOpen(false)}
            onDeletePersonnel={handleDeletePersonnel}
            onSavePersonnel={handleCreatePersonnel}
        />
    );
};

export default AppView;


