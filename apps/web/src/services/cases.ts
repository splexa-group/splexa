import { DELETE, GET, PATCH, POST } from "@/api/http";
import type {
  CaseDetail,
  CaseFilters,
  CaseListResponse,
  CreateCaseInput,
  UpdateCaseInput,
} from "@/types/cases";
import { CreateClientInput } from "@/types/clients";

export const casesApi = {
  list: (filters: CaseFilters = {}) =>
    GET<{ cases: CaseListResponse["data"]; total: number; page: number; limit: number }>(
      "/cases",
      { params: filters },
    ).then((r) => ({ data: r.cases, total: r.total, page: r.page, limit: r.limit })),

  getById: (id: string) =>
    GET<{ caseDetails: CaseDetail }>(`/cases/${id}`).then((r) => r.caseDetails),

  create: (data: CreateCaseInput) =>
    POST<{ caseDetails: CaseDetail }>("/cases", data).then((r) => r.caseDetails),

  update: (id: string, data: UpdateCaseInput) =>
    PATCH<{ caseDetails: CaseDetail }>(`/cases/${id}`, data).then((r) => r.caseDetails),

  addClient: (id: string, data: CreateClientInput) =>
    POST<{ caseDetails: CaseDetail }>(`/cases/${id}/client`, data).then(
      (r) => r.caseDetails,
    ),

  delete: (id: string) => DELETE<void>(`/cases/${id}`),
};
