"use client";

import { useState, useCallback } from "react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { PageLayout } from "@/components/layout/page-layout";
import { CasesTable } from "@/components/cases/cases-table";
import { CreateCaseModal } from "@/components/modals/create-case";

export function CasesView() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  usePageTitle({
    title: "Cases",
    action: { label: "Add Case", onClick: openModal },
  });

  return (
    <PageLayout maxWidth="large" padded={false} className="h-full">
      <CasesTable onAdd={openModal} />
      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </PageLayout>
  );
}
