import { DELETE, GET, POST } from "@/api/http";
import type { Document, DocumentListResponse } from "@/types/documents";

export const documentsApi = {
  listByCaseId: (caseId: string) =>
    GET<DocumentListResponse>(`/cases/${caseId}/documents`),

  upload: (caseId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return POST<Document>(`/cases/${caseId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getUrl: (caseId: string, documentId: string) =>
    GET<{ url: string }>(`/cases/${caseId}/documents/${documentId}/url`),

  delete: (caseId: string, documentId: string) =>
    DELETE<void>(`/cases/${caseId}/documents/${documentId}`),
};
