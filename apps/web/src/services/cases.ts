import { DELETE, GET, PATCH, POST } from "@/api/http";
import type {
  CaseDetail,
  CaseFilters,
  CaseListResponse,
  CreateCaseInput,
  UpdateCaseInput,
} from "@/types/cases";

export const casesApi = {
  list: (filters: CaseFilters = {}) =>
    GET<CaseListResponse>("/cases", { params: filters }),

  getById: (id: string) => GET<CaseDetail>(`/cases/${id}`),

  create: (data: CreateCaseInput) => POST<CaseDetail>("/cases", data),

  update: (id: string, data: UpdateCaseInput) =>
    PATCH<CaseDetail>(`/cases/${id}`, data),

  delete: (id: string) => DELETE<void>(`/cases/${id}`),
};
