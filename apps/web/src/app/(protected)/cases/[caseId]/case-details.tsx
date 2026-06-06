"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { CaseTabs, CaseSubTabs } from "@/enums/case-tabs";
import { DocumentsTab } from "@/components/cases/documents-tab/documents-tab";
import { CaseTabs as CaseTabsNav } from "@/app/(protected)/cases/[caseId]/case-tabs";
import { useCaseActiveTab, useCaseActiveSubTab } from "@/hooks/use-active-tab";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { useCase, useUpdateCase, useDeleteCase } from "@/hooks/use-cases";
import { useAddClientToCase, useUpdateClient } from "@/hooks/use-clients";
import { CaseDetailsSection } from "@/components/cases/case-details/case-details";
import { CaseDescriptionSection } from "@/components/cases/case-details/case-description";
import { CourtDetailsSection } from "@/components/cases/case-details/court-details";
import { JudgeDetailsSection } from "@/components/cases/case-details/judge-details";
import { OppositePartySection } from "@/components/cases/case-details/opposite-parties";
import { ClientDetails } from "@/components/cases/client/client-details";
import { HearingsTab } from "@/components/cases/hearings-tab/hearings-tab";
import { ImportantDatesTab } from "@/components/cases/important-dates/important-dates-tab";
import { PageFooter } from "@/components/layout/page-footer";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { UpdateCaseInput } from "@/types/cases";
import { CreateClientInput, UpdateClientInput } from "@/types/clients";
import {
  mapCaseToFormValues,
  mapClientToFormValues,
} from "@/mappers/case-form";

interface TabContentProps {
  tab: CaseTabs;
  subTab: string;
  caseId: string;
  caseForm: UseFormReturn<UpdateCaseInput>;
  clientForm: UseFormReturn<UpdateClientInput>;
}

function CaseSubTabContent({ subTab }: { subTab: string }) {
  switch (subTab) {
    case CaseSubTabs.DETAILS:
      return (
        <>
          <CaseDetailsSection />
          <CourtDetailsSection />
          <JudgeDetailsSection />
        </>
      );
    case CaseSubTabs.DESCRIPTION:
      return <CaseDescriptionSection />;
    case CaseSubTabs.OPPOSITE_PARTIES:
      return <OppositePartySection />;
    default:
      return null;
  }
}

function TabContent({
  tab,
  subTab,
  caseId,
  caseForm,
  clientForm,
}: TabContentProps) {
  switch (tab) {
    case CaseTabs.CLIENT:
      return (
        <FormProvider {...clientForm}>
          <ClientDetails />
        </FormProvider>
      );

    case CaseTabs.CASE:
      return (
        <FormProvider {...caseForm}>
          <CaseSubTabContent subTab={subTab} />
        </FormProvider>
      );

    case CaseTabs.HEARINGS:
      return <HearingsTab caseId={caseId} />;

    case CaseTabs.IMPORTANT_DATES:
      return <ImportantDatesTab caseId={caseId} />;

    case CaseTabs.DOCUMENTS:
      return <DocumentsTab caseId={caseId} />;

    default:
      return null;
  }
}

const CaseDetails = ({ caseId }: { caseId: string }) => {
  const activeTab = useCaseActiveTab();
  const activeSubTab = useCaseActiveSubTab(activeTab);
  const [showDelete, setShowDelete] = useState(false);

  const { data: caseDetails, isLoading } = useCase(caseId);
  const updateCase = useUpdateCase(caseId);
  const updateClient = useUpdateClient();
  const addClientToCase = useAddClientToCase(caseId);
  const deleteCase = useDeleteCase();

  usePageTitle({
    title: "Cases",
    resourceTitle: `${caseDetails?.title}${caseDetails?.caseNumber ? ` (${caseDetails.caseNumber})` : ""}`,
  });

  const caseForm = useForm<UpdateCaseInput>({
    values: caseDetails ? mapCaseToFormValues(caseDetails) : undefined,
  });

  const clientForm = useForm<UpdateClientInput>({
    values: caseDetails?.client
      ? mapClientToFormValues(caseDetails.client)
      : undefined,
  });

  if (isLoading || !caseDetails) {
    return <div className="p-6 text-sm text-secondary">Loading…</div>;
  }

  const isSaving =
    activeTab === CaseTabs.CLIENT
      ? updateClient.isPending || addClientToCase.isPending
      : updateCase.isPending;

  const handleSave = async () => {
    if (activeTab === CaseTabs.CLIENT) {
      const valid = await clientForm.trigger();
      if (!valid) return;

      const data = clientForm.getValues();

      if (!caseDetails.clientId) {
        if (!data.type) {
          toast.error("Client type is required");
          return;
        }
        const clientInput: CreateClientInput = {
          fullName: data.fullName ?? "",
          phone: data.phone ?? "",
          type: data.type,
          email: data.email,
          address: data.address,
          companyName: data.companyName,
          notes: data.notes,
        };
        await addClientToCase.mutateAsync(clientInput);
      } else {
        await updateClient.mutateAsync({
          id: caseDetails.clientId,
          caseId,
          data,
        });
      }
    } else {
      const valid = await caseForm.trigger();
      if (!valid) return;

      const data = caseForm.getValues();
      await updateCase.mutateAsync(data);
    }
  };

  const handleDelete = async () => {
    await deleteCase.mutateAsync(caseId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CaseTabsNav caseId={caseId} />

      <div className="flex-1 overflow-y-auto bg-page">
        <PageContent className="space-y-6">
          <TabContent
            tab={activeTab}
            subTab={activeSubTab}
            caseId={caseId}
            caseForm={caseForm}
            clientForm={clientForm}
          />
        </PageContent>
      </div>

      <PageFooter
        right={
          <>
            <Button variant="negative" onClick={() => setShowDelete(true)}>
              Delete Case
            </Button>
            <Button loading={isSaving} onClick={handleSave}>
              Save Changes
            </Button>
          </>
        }
      />

      <ConfirmDeleteModal
        open={showDelete}
        title="case"
        entityName={caseDetails.title}
        isPending={deleteCase.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CaseDetails;
