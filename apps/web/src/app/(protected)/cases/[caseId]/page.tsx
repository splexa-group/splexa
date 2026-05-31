"use client";

import { use, Suspense, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { useCase, useUpdateCase, useDeleteCase } from "@/hooks/use-cases";
import { CaseTabs } from "@/components/cases/case-tabs";
import { useCaseActiveTab } from "@/hooks/use-active-tab";
import {
  statusBadgeClass,
  hearingCountdown,
  formatFiledDate,
} from "@/components/cases/case-utils";
import { cn } from "@/lib/utils";
import { CaseDetailsSection } from "@/components/cases/case-tab/case-details-section";
import { CourtDetailsSection } from "@/components/cases/case-tab/court-details-section";
import { JudgeDetailsSection } from "@/components/cases/case-tab/judge-details-section";
import { OppositePartySection } from "@/components/cases/case-tab/opposite-party-section";
import { PageFooter } from "@/components/layout/page-footer";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ui/modals/confirm-delete-modal";
import { ClientTab } from "@/components/cases/client-tab/client-tab";
import { HearingsTab } from "@/components/cases/hearings-tab/hearings-tab";
import { DocumentsTab } from "@/components/cases/documents-tab/documents-tab";
import { ImportantDatesTab } from "@/components/cases/important-dates/important-dates-tab";
import { UpdateCaseInput } from "@/types/cases";
import { mapCaseToFormValues } from "@/mappers/case-form";

export default function CaseEditPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  return (
    <Suspense>
      <CaseEditContent caseId={caseId} />
    </Suspense>
  );
}

function CaseEditContent({ caseId }: { caseId: string }) {
  const activeTab = useCaseActiveTab();
  const [showDelete, setShowDelete] = useState(false);

  const { data: caseDetails, isLoading } = useCase(caseId);
  const updateCase = useUpdateCase(caseId);
  const deleteCase = useDeleteCase();

  usePageTitle({
    title: "Cases",
    resourceTitle: caseDetails?.title ?? "…",
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

  const showSaveFooter = activeTab === "case" || activeTab === "client";

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-4 pb-0 bg-card border-b border-line flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl font-bold text-dark tracking-tight leading-tight">
              {caseDetails.title}
            </h1>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 mt-0.5",
                statusBadgeClass(caseDetails.status),
              )}
            >
              {caseDetails.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-3 text-xs text-secondary">
            {caseDetails.caseNumber && <span>{caseDetails.caseNumber}</span>}
            {caseDetails.caseNumber &&
              (caseDetails.courtName || caseDetails.caseType) && (
                <span className="text-line">·</span>
              )}
            {caseDetails.courtName && <span>{caseDetails.courtName}</span>}
            {caseDetails.courtName && caseDetails.caseType && (
              <span className="text-line">·</span>
            )}
            {caseDetails.caseType && <span>{caseDetails.caseType}</span>}
            {(caseDetails.caseNumber ||
              caseDetails.courtName ||
              caseDetails.caseType) &&
              caseDetails.filingDate && <span className="text-line">·</span>}
            {caseDetails.filingDate && (
              <span>Filed {formatFiledDate(caseDetails.filingDate)}</span>
            )}
            {(() => {
              const h = hearingCountdown(caseDetails.nextHearingDate);
              if (!h) return null;
              return (
                <>
                  <span className="text-line">·</span>
                  <span className={h.color}>{h.text}</span>
                </>
              );
            })()}
          </div>
          <CaseTabs caseId={caseId} />
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto bg-page">
          <div className="p-6 space-y-4 max-w-4xl">
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
            {activeTab === "client" && <ClientTab caseDetails={caseDetails} />}
            {activeTab === "hearings" && <HearingsTab caseId={caseId} />}
            {activeTab === "documents" && <DocumentsTab caseId={caseId} />}
            {activeTab === "important-dates" && (
              <ImportantDatesTab caseId={caseId} />
            )}
          </div>
        </div>

        {/* Footer */}
        {showSaveFooter && (
          <PageFooter
            right={
              <>
                {activeTab === "case" && (
                  <Button
                    variant="negative"
                    size="sm"
                    onClick={() => setShowDelete(true)}
                  >
                    Delete Case
                  </Button>
                )}
                <Button
                  size="sm"
                  loading={updateCase.isPending}
                  onClick={methods.handleSubmit(handleSave)}
                >
                  Save Changes
                </Button>
              </>
            }
          />
        )}
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
}
