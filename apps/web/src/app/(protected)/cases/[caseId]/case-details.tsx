"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { CaseTabs, CaseSubTabs } from "@/enums/case-tabs";
import { DocumentsTab } from "@/components/cases/documents-tab/documents-tab";
import { CaseTabs as CaseTabsNav } from "@/app/(protected)/cases/[caseId]/case-tabs";
import { useCaseActiveTab, useCaseActiveSubTab } from "@/hooks/use-active-tab";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { useCase, useUpdateCase, useDeleteCase } from "@/hooks/use-cases";
import { CaseDetailsSection } from "@/components/cases/case-details/case-details";
import { CaseDescriptionSection } from "@/components/cases/case-details/case-description";
import { CourtDetailsSection } from "@/components/cases/case-details/court-details";
import { JudgeDetailsSection } from "@/components/cases/case-details/judge-details";
import { OppositePartySection } from "@/components/cases/case-details/opposite-parties";
import { ClientTab } from "@/components/cases/client/client-details";
import { HearingsTab } from "@/components/cases/hearings-tab/hearings-tab";
import { ImportantDatesTab } from "@/components/cases/important-dates/important-dates-tab";
import { PageFooter } from "@/components/layout/page-footer";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import type { UpdateCaseInput, CaseDetail } from "@/types/cases";
import { mapCaseToFormValues } from "@/mappers/case-form";

// ---------------------------------------------------------------------------
// Tab content — add a new case here when adding a new tab to CASE_TAB_CONFIG
// ---------------------------------------------------------------------------

interface TabContentProps {
  tab: CaseTabs;
  subTab: string;
  caseId: string;
  caseDetails: CaseDetail;
}

function TabContent({ tab, subTab, caseId, caseDetails }: TabContentProps) {
  switch (tab) {
    case CaseTabs.CLIENT:
      return <ClientTab caseDetail={caseDetails} />;

    case CaseTabs.CASE:
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

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const CaseDetails = ({ caseId }: { caseId: string }) => {
  const activeTab = useCaseActiveTab();
  const activeSubTab = useCaseActiveSubTab(activeTab);
  const [showDelete, setShowDelete] = useState(false);

  const { data: caseDetails, isLoading } = useCase(caseId);
  const updateCase = useUpdateCase(caseId);
  const deleteCase = useDeleteCase();

  usePageTitle({
    title: "Cases",
    resourceTitle: `${caseDetails?.title}${caseDetails?.caseNumber ? ` (${caseDetails.caseNumber})` : ""}`,
  });

  const methods = useForm<UpdateCaseInput>({
    values: caseDetails ? mapCaseToFormValues(caseDetails) : undefined,
  });

  if (isLoading || !caseDetails) {
    return <div className="p-6 text-sm text-secondary">Loading…</div>;
  }

  const handleSave = async (data: UpdateCaseInput) => {
    await updateCase.mutateAsync(data);
  };

  const handleDelete = async () => {
    await deleteCase.mutateAsync(caseId);
  };

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-full overflow-hidden">
        <CaseTabsNav caseId={caseId} />

        <div className="flex-1 overflow-y-auto bg-page">
          <PageContent className="space-y-6">
            <TabContent
              tab={activeTab}
              subTab={activeSubTab}
              caseId={caseId}
              caseDetails={caseDetails}
            />
          </PageContent>
        </div>

        <PageFooter
          right={
            <>
              {activeTab === CaseTabs.CASE && (
                <Button variant="negative" onClick={() => setShowDelete(true)}>
                  Delete Case
                </Button>
              )}
              <Button
                loading={updateCase.isPending}
                onClick={methods.handleSubmit(handleSave)}
              >
                Save Changes
              </Button>
            </>
          }
        />
      </div>

      <ConfirmDeleteModal
        open={showDelete}
        title="case"
        entityName={caseDetails.title}
        isPending={deleteCase.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </FormProvider>
  );
};

export default CaseDetails;
