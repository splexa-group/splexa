'use client';

import { usePageTitle } from '@/components/layout/top-bar-context';
import { CaseList } from '@/components/cases/case-list';

export default function CasesPage() {
  usePageTitle({
    title: 'Cases',
    action: { label: 'Add Case', href: '/cases/new' },
  });

  return <CaseList />;
}
