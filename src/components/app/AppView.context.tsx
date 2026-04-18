import React, { createContext, useContext } from 'react';
import type { AppViewProps } from './AppView.types';

const AppViewContext = createContext<AppViewProps | null>(null);

interface AppViewProviderProps {
  value: AppViewProps;
  children: React.ReactNode;
}

export const AppViewProvider: React.FC<AppViewProviderProps> = ({ value, children }) => (
  <AppViewContext.Provider value={value}>{children}</AppViewContext.Provider>
);

export const useAppViewContext = () => {
  const value = useContext(AppViewContext);
  if (!value) {
    throw new Error('AppViewContext is unavailable outside AppViewProvider.');
  }
  return value;
};

