import { notFound } from 'next/navigation';
import DashboardDownloadSmokeClient from './DashboardDownloadSmokeClient';

export default function DashboardDownloadSmokePage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <DashboardDownloadSmokeClient />;
}

