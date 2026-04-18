import { Suspense } from 'react';
import AuthGuard from '@/components/auth/components/AuthGuard';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
