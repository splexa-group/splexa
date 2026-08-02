"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { ClientDetails } from "@/components/cases/client/client-details";
import { usePageLoading } from "@/components/layout/loader";
import { PageFooter } from "@/components/layout/page-footer";
import { PageLayout } from "@/components/layout/page-layout";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { CLIENT_TAB_CONFIG, ClientTabs } from "@/constants/client-tabs";
import { useActiveTab } from "@/hooks/use-active-tab";
import { useClient, useDeleteClient, useUpdateClient } from "@/hooks/use-clients";
import { mapClientToFormValues } from "@/mappers/case-form";
import type { UpdateClientInput } from "@/types/clients";

import { ClientDetailTabs } from "./client-detail-tabs";

export function ClientDetailView({ clientId }: { clientId: string }) {
  const activeTab = useActiveTab<ClientTabs>(CLIENT_TAB_CONFIG, ClientTabs.INFO);
  const [showDelete, setShowDelete] = useState(false);

  const { data: client, isLoading } = useClient(clientId);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  usePageTitle({
    title: "Clients",
    resourceTitle: client?.fullName,
  });

  const form = useForm<UpdateClientInput>({
    values: client ? mapClientToFormValues(client) : undefined,
  });

  usePageLoading(isLoading);

  const handleSave = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    await updateClient.mutateAsync({ id: clientId, data: form.getValues() });
  };

  const handleDelete = async () => {
    await deleteClient.mutateAsync(clientId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ClientDetailTabs clientId={clientId} />

      <div className="flex-1 overflow-y-auto bg-page">
        <PageLayout maxWidth="medium" className="space-y-6">
          {activeTab === ClientTabs.INFO && (
            <FormProvider {...form}>
              <ClientDetails />
            </FormProvider>
          )}
          {activeTab === ClientTabs.CASES && null}
        </PageLayout>
      </div>

      <PageFooter
        right={
          <>
            <Button variant="negative" onClick={() => setShowDelete(true)}>
              Delete Client
            </Button>
            {activeTab === ClientTabs.INFO && (
              <Button loading={updateClient.isPending} onClick={handleSave}>
                Save Changes
              </Button>
            )}
          </>
        }
      />

      <ConfirmDeleteModal
        open={showDelete}
        title="client"
        entityName={client?.fullName ?? ""}
        isPending={deleteClient.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
