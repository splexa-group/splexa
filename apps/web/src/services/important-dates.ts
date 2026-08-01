import { DELETE, GET, PATCH, POST } from "@/api/http";
import type {
  CreateImportantDateInput,
  ImportantDate,
  UpdateImportantDateInput,
} from "@/types/important-dates";

export const importantDatesApi = {
  listByCaseId: (caseId: string) =>
    GET<{ importantDates: ImportantDate[] }>(`/cases/${caseId}/important-dates`).then(
      (r) => r.importantDates,
    ),

  create: (caseId: string, data: CreateImportantDateInput) =>
    POST<{ importantDate: ImportantDate }>(`/cases/${caseId}/important-dates`, data).then(
      (r) => r.importantDate,
    ),

  update: (caseId: string, dateId: string, data: UpdateImportantDateInput) =>
    PATCH<{ importantDate: ImportantDate }>(
      `/cases/${caseId}/important-dates/${dateId}`,
      data,
    ).then((r) => r.importantDate),

  delete: (caseId: string, dateId: string) =>
    DELETE<void>(`/cases/${caseId}/important-dates/${dateId}`),
};
