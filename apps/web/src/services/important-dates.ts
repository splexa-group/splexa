import { DELETE, GET, PATCH, POST } from "@/api/http";
import type {
  CreateImportantDateInput,
  ImportantDate,
  UpdateImportantDateInput,
} from "@/types/important-dates";

export const importantDatesApi = {
  listByCaseId: (caseId: string) =>
    GET<ImportantDate[]>(`/cases/${caseId}/important-dates`),

  create: (caseId: string, data: CreateImportantDateInput) =>
    POST<ImportantDate>(`/cases/${caseId}/important-dates`, data),

  update: (caseId: string, dateId: string, data: UpdateImportantDateInput) =>
    PATCH<ImportantDate>(`/cases/${caseId}/important-dates/${dateId}`, data),

  delete: (caseId: string, dateId: string) =>
    DELETE<void>(`/cases/${caseId}/important-dates/${dateId}`),
};
