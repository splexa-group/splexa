'use client';

import { useEffect } from 'react';
import { useTopBar } from '@/components/layout/top-bar-context';

export default function DashboardPage() {
  const { setTopBar } = useTopBar();

  useEffect(() => {
    setTopBar({ variant: 'default', title: 'Dashboard' });
  }, [setTopBar]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-secondary text-sm">Dashboard — coming soon.</p>
    </div>
  );
}
