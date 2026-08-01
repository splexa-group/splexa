"use client";

import { CasesTable } from "@/components/cases/cases-table";
import { PageLayout } from "@/components/layout/page-layout";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { CreateCaseModal } from "@/components/modals/create-case";
import { useModalState } from "@/hooks/use-modal-state";

export function CasesView() {
  const modal = useModalState();

  usePageTitle({
    title: "Cases",
    action: { label: "Add Case", onClick: modal.open },
  });

  return (
    <PageLayout maxWidth="large" padded={false} className="h-full">
      <CasesTable onAdd={modal.open} />
      <CreateCaseModal open={modal.isOpen} onClose={modal.close} />
    </PageLayout>
  );
}
