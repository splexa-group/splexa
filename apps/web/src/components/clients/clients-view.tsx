"use client";

import { ClientsTable } from "@/components/clients/clients-table";
import { PageLayout } from "@/components/layout/page-layout";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { CreateClientModal } from "@/components/modals/create-client";
import { useModalState } from "@/hooks/use-modal-state";

export function ClientsView() {
  const modal = useModalState();

  usePageTitle({
    title: "Clients",
    action: { label: "Add Client", onClick: modal.open },
  });

  return (
    <PageLayout maxWidth="large" padded={false} className="h-full">
      <ClientsTable onAdd={modal.open} />
      <CreateClientModal open={modal.isOpen} onClose={modal.close} />
    </PageLayout>
  );
}
