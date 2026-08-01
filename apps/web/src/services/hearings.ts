import { DELETE, GET, PATCH, POST } from "@/api/http";
import type {
  CreateHearingInput,
  Hearing,
  UpdateHearingInput,
} from "@/types/hearings";

export const hearingsApi = {
  listByCaseId: (caseId: string) =>
    GET<{ hearings: Hearing[] }>(`/cases/${caseId}/hearings`).then((r) => r.hearings),

  create: (caseId: string, data: CreateHearingInput) =>
    POST<{ hearing: Hearing }>(`/cases/${caseId}/hearings`, data).then((r) => r.hearing),

  update: (id: string, data: UpdateHearingInput) =>
    PATCH<{ hearing: Hearing }>(`/hearings/${id}`, data).then((r) => r.hearing),

  delete: (id: string) => DELETE<void>(`/hearings/${id}`),
};
