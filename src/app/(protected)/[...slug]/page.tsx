import { Suspense } from 'react';
import ClientOnly from '@/app/client-only';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ClientOnly />
    </Suspense>
  );
}
