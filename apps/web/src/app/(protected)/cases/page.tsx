'use client';

import { usePageTitle } from '@/components/layout/top-bar-context';

export default function CasesPage() {
  usePageTitle({ title: 'Cases', action: { label: 'Add New Case', href: '/cases/new' } });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-secondary text-sm">Cases — coming soon.</p>
    </div>
  );
}
