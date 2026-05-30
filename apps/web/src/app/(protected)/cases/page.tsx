'use client';

import { useState } from 'react';
import { usePageTitle } from '@/components/layout/top-bar-context';
import { CaseList } from '@/components/cases/case-list';
import { CreateCaseModal } from '@/components/cases/create-case-modal';

export default function CasesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  usePageTitle({
    title: 'Cases',
    action: { label: 'Add Case', onClick: () => setModalOpen(true) },
  });

  return (
    <>
      <CaseList />
      <CreateCaseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
