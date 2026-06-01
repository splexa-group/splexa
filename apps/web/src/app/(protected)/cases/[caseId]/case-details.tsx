"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { useCase, useUpdateCase, useDeleteCase } from "@/hooks/use-cases";
import { CaseTabs } from "@/app/(protected)/cases/[caseId]/case-tabs";
import { useCaseActiveTab } from "@/hooks/use-active-tab";
import { CaseDetailsSection } from "@/components/cases/case-tab/case-details-section";
import { CourtDetailsSection } from "@/components/cases/case-tab/court-details-section";
import { JudgeDetailsSection } from "@/components/cases/case-tab/judge-details-section";
import { OppositePartySection } from "@/components/cases/case-tab/opposite-party-section";
import { PageFooter } from "@/components/layout/page-footer";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ui/modals/confirm-delete";
import { ClientTab } from "@/components/cases/client-tab/client-tab";
import { HearingsTab } from "@/components/cases/hearings-tab/hearings-tab";
import { DocumentsTab } from "@/components/cases/documents-tab/documents-tab";
import { ImportantDatesTab } from "@/components/cases/important-dates/important-dates-tab";
import { PageContent } from "@/components/layout/page-content";
import { UpdateCaseInput } from "@/types/cases";
import { mapCaseToFormValues } from "@/mappers/case-form";

const CaseDetails = ({ caseId }: { caseId: string }) => {
  const activeTab = useCaseActiveTab();
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

  console.log({ isLoading, caseDetails });

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
        <CaseTabs caseId={caseId} />

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto bg-page">
          <PageContent className="space-y-4">
            {activeTab === "case" && (
              <>
                <CaseDetailsSection />
                <div className="grid md:grid-cols-2 gap-4">
                  <CourtDetailsSection />
                  <JudgeDetailsSection />
                </div>
                <OppositePartySection />
              </>
            )}
            {activeTab === "client" && <ClientTab caseDetail={caseDetails} />}
            {activeTab === "hearings" && <HearingsTab caseId={caseId} />}
            {activeTab === "documents" && <DocumentsTab caseId={caseId} />}
            {activeTab === "important-dates" && (
              <ImportantDatesTab caseId={caseId} />
            )}
          </PageContent>
        </div>

        {/* Footer */}
        <PageFooter
          right={
            <>
              {activeTab === "case" && (
                <Button
                  variant="negative"
                  onClick={() => setShowDelete(true)}
                >
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

      {/* modals */}
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
