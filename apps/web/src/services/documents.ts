import { DELETE, GET, PATCH, POST } from "@/api/http";
import type { Document, DocumentFolder, DocumentListResponse } from "@/types/documents";

export const documentsApi = {
  listByCaseId: (caseId: string) =>
    GET<DocumentListResponse>(`/cases/${caseId}/documents`),

  listFolders: () =>
    GET<DocumentFolder[]>("/documents/folders"),

  upload: (caseId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return POST<Document>(`/cases/${caseId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getUrl: (caseId: string, documentId: string) =>
    GET<{ url: string }>(`/cases/${caseId}/documents/${documentId}/url`),

  rename: (caseId: string, documentId: string, name: string) =>
    PATCH<Document>(`/cases/${caseId}/documents/${documentId}`, { name }),

  delete: (caseId: string, documentId: string) =>
    DELETE<void>(`/cases/${caseId}/documents/${documentId}`),
};
