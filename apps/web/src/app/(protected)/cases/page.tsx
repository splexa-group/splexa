'use client';

import { useEffect } from 'react';
import { useTopBar } from '@/components/layout/top-bar-context';

export default function CasesPage() {
  const { setTopBar } = useTopBar();

  useEffect(() => {
    setTopBar({ variant: 'default', title: 'Cases' });
  }, [setTopBar]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-secondary text-sm">Cases — coming soon.</p>
    </div>
  );
}
