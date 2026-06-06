import type { CaseDetail, UpdateCaseInput } from "@/types/cases";
import type { UpdateClientInput } from "@/types/clients";

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

export function mapClientToFormValues(
  client: NonNullable<CaseDetail["client"]>,
): UpdateClientInput {
  return {
    fullName: client.fullName ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    type: client.type ?? undefined,
    address: client.address ?? "",
    companyName: client.companyName ?? "",
    notes: client.notes ?? "",
    preferredLanguage: client.preferredLanguage ?? undefined,
  };
}
