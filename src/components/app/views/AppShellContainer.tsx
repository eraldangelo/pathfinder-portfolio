import React from 'react';
import AppShell from '../AppShell';
import { AppShellProvider } from '../AppShell.context';
import { buildAppShellActions, buildAppShellState } from './AppShellContainer.builders';
import type { AppShellContainerProps } from './AppShellContainer.types';

const AppShellContainer: React.FC<AppShellContainerProps> = (props) => {
    const appShellState = buildAppShellState(props);
    const appShellActions = buildAppShellActions(props);

    return (
        <AppShellProvider state={appShellState} actions={appShellActions}>
            <AppShell />
        </AppShellProvider>
    );
};

export default AppShellContainer;

