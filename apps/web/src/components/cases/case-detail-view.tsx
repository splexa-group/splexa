"use client";

import { useState } from "react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { CaseDetailsSection } from "@/components/cases/case-details/case-details";
import { CaseDescriptionSection } from "@/components/cases/case-details/case-description";
import { CourtDetailsSection } from "@/components/cases/case-details/court-details";
import { JudgeDetailsSection } from "@/components/cases/case-details/judge-details";
import { OppositePartySection } from "@/components/cases/case-details/opposite-parties";
import { ClientDetails } from "@/components/cases/client/client-details";
import { Documents } from "@/components/cases/documents/documents";
import { HearingsDetails } from "@/components/cases/hearing-details/hearings";
import { ImportantDatesDetails } from "@/components/cases/important-dates/important-dates";
import { usePageLoading } from "@/components/layout/loader";
import { PageFooter } from "@/components/layout/page-footer";
import { PageLayout } from "@/components/layout/page-layout";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { CASE_TAB_CONFIG, CaseSubTabs, CaseTabs } from "@/constants/case-tabs";
import { useActiveSubTab, useActiveTab } from "@/hooks/use-active-tab";
import { useCase, useDeleteCase, useUpdateCase } from "@/hooks/use-cases";
import { useAddClientToCase, useUpdateClient } from "@/hooks/use-clients";
import { mapCaseToFormValues, mapClientToFormValues } from "@/mappers/case-form";
import type { UpdateCaseInput } from "@/types/cases";
import type { CreateClientInput, UpdateClientInput } from "@/types/clients";

import { CaseDetailTabs } from "./case-detail-tabs";

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

function TabContent({ tab, subTab, caseId, caseForm, clientForm }: TabContentProps) {
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
      return <HearingsDetails caseId={caseId} />;

    case CaseTabs.IMPORTANT_DATES:
      return <ImportantDatesDetails caseId={caseId} />;

    case CaseTabs.DOCUMENTS:
      return <Documents caseId={caseId} />;

    default:
      return null;
  }
}

export function CaseDetailView({ caseId }: { caseId: string }) {
  const activeTab = useActiveTab<CaseTabs>(CASE_TAB_CONFIG, CaseTabs.CASE);
  const activeSubTab = useActiveSubTab(activeTab, CASE_TAB_CONFIG);
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
    values: caseDetails?.client ? mapClientToFormValues(caseDetails.client) : undefined,
  });

  usePageLoading(isLoading);

  const isEditableTab = activeTab === CaseTabs.CASE || activeTab === CaseTabs.CLIENT;
  const isSaving =
    activeTab === CaseTabs.CLIENT
      ? updateClient.isPending || addClientToCase.isPending
      : updateCase.isPending;

  const handleSave = async () => {
    if (activeTab === CaseTabs.CLIENT) {
      const valid = await clientForm.trigger();
      if (!valid) return;

      const data = clientForm.getValues();

      if (!caseDetails?.clientId) {
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
          relationType: data.relationType,
          relationName: data.relationName,
          dateOfBirth: data.dateOfBirth,
          occupation: data.occupation,
        };
        await addClientToCase.mutateAsync(clientInput);
      } else {
        await updateClient.mutateAsync({
          id: caseDetails?.clientId ?? "",
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
      <CaseDetailTabs caseId={caseId} />

      <div className="flex-1 overflow-y-auto bg-page">
        <PageLayout maxWidth="medium" className="space-y-6">
          <TabContent
            tab={activeTab}
            subTab={activeSubTab}
            caseId={caseId}
            caseForm={caseForm}
            clientForm={clientForm}
          />
        </PageLayout>
      </div>

      <PageFooter
        right={
          <>
            <Button variant="negative" onClick={() => setShowDelete(true)}>
              Delete Case
            </Button>
            {isEditableTab && (
              <Button loading={isSaving} onClick={handleSave}>
                Save Changes
              </Button>
            )}
          </>
        }
      />

      <ConfirmDeleteModal
        open={showDelete}
        title="case"
        entityName={caseDetails?.title ?? ""}
        isPending={deleteCase.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
