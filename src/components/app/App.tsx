import React from 'react';
import { AppForceResetState, AppLoadingState, AppLoginState } from './AppStates';
import AppShellContainer from './views/AppShellContainer';
import { useAppController } from './hooks/useAppController';

const App: React.FC = () => {
    const { auth, appShell } = useAppController();

    if (auth.isLoading) {
        return <AppLoadingState />;
    }

    if (!auth.user) {
        return (
            <AppLoginState
                showPopup={auth.showPopup}
                setIsLoading={auth.setIsLoading}
                isReady={auth.isReady}
                authError={auth.authError}
                clearAuthError={auth.clearAuthError}
            />
        );
    }

    if (auth.isForceResetRequired) {
        return (
            <AppForceResetState
                isOpen={auth.isForceResetRequired}
                onSave={auth.handleForcePasswordReset}
            />
        );
    }

    return (
        <AppShellContainer
            user={auth.user}
            userRole={appShell.userRole!}
            view={appShell.view}
            theme={appShell.theme}
            toggleTheme={appShell.toggleTheme}
            isReady={appShell.isReady}
            ui={appShell.ui}
            navItems={appShell.navItems}
            confirmModal={appShell.confirmModal}
            notificationsState={appShell.notificationsState}
            data={appShell.data}
            timeTracking={appShell.timeTracking}
            handlers={appShell.handlers}
        />
    );
};

export default App;

