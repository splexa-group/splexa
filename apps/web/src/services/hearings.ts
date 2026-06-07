import { DELETE, GET, PATCH, POST } from "@/api/http";
import type {
  CreateHearingInput,
  Hearing,
  UpdateHearingInput,
} from "@/types/hearings";

export const hearingsApi = {
  listByCaseId: (caseId: string) =>
    GET<Hearing[]>(`/cases/${caseId}/hearings`),

  create: (caseId: string, data: CreateHearingInput) =>
    POST<Hearing>(`/cases/${caseId}/hearings`, data),

  update: (id: string, data: UpdateHearingInput) =>
    PATCH<Hearing>(`/hearings/${id}`, data),

  delete: (id: string) => DELETE<void>(`/hearings/${id}`),
};
