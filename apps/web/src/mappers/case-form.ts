import type { CaseDetail, UpdateCaseInput } from "@/types/cases";

export function mapCaseToFormValues(caseDetail: CaseDetail): UpdateCaseInput {
  return {
    title: caseDetail.title,
    clientRole: caseDetail.clientRole ?? undefined,
    caseNumber: caseDetail.caseNumber ?? "",
    caseType: caseDetail.caseType ?? undefined,
    filingDate: caseDetail.filingDate?.substring(0, 10) ?? "",
    courtName: caseDetail.courtName ?? "",
    courtType: caseDetail.courtType ?? undefined,
    courtState: caseDetail.courtState ?? "",
    courtCity: caseDetail.courtCity ?? "",
    benchNumber: caseDetail.benchNumber ?? "",
    judgeName: caseDetail.judgeName ?? "",
    judgeDesignation: caseDetail.judgeDesignation ?? "",
    status: caseDetail.status,
    stage: caseDetail.stage ?? undefined,
    priority: caseDetail.priority ?? undefined,
    description: caseDetail.description ?? "",
    oppositeParties: caseDetail.oppositeParties ?? [],
  };
}
