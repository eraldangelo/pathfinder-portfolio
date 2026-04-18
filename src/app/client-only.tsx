'use client';

import { useEffect, useState } from 'react';
import AppRoot from './app-root';

const ClientOnly = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return <AppRoot />;
};

export default ClientOnly;
