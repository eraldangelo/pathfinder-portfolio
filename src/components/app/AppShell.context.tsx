import React, { createContext, useContext } from 'react';
import type { AppShellActions, AppShellState } from './AppShell.types';

const AppShellStateContext = createContext<AppShellState | null>(null);
const AppShellActionsContext = createContext<AppShellActions | null>(null);

interface AppShellProviderProps {
  state: AppShellState;
  actions: AppShellActions;
  children: React.ReactNode;
}

export const AppShellProvider: React.FC<AppShellProviderProps> = ({
  state,
  actions,
  children,
}) => (
  <AppShellStateContext.Provider value={state}>
    <AppShellActionsContext.Provider value={actions}>{children}</AppShellActionsContext.Provider>
  </AppShellStateContext.Provider>
);

const assertContext = <T,>(value: T | null, label: string): T => {
  if (!value) {
    throw new Error(`${label} is unavailable outside AppShellProvider.`);
  }
  return value;
};

export const useAppShellState = () =>
  assertContext(useContext(AppShellStateContext), 'AppShellStateContext');

export const useAppShellActions = () =>
  assertContext(useContext(AppShellActionsContext), 'AppShellActionsContext');
