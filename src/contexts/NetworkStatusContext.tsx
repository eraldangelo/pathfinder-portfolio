import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { onConnectivityChanged } from '../services/firebase';

interface NetworkStatusContextType {
  isOnline: boolean;
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({ isOnline: true });

export const NetworkStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(() => (typeof window !== 'undefined' ? window.navigator.onLine : true));

  useEffect(() => {
    // Firestore's built-in method to listen to connection state
    const unsubscribe = onConnectivityChanged(setIsOnline);
    return () => unsubscribe();
  }, []);

  return (
    <NetworkStatusContext.Provider value={{ isOnline }}>
      {children}
    </NetworkStatusContext.Provider>
  );
};
