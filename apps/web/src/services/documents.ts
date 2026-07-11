import { DELETE, GET, PATCH, POST } from "@/api/http";
import type { Document, DocumentFolder, DocumentListResponse } from "@/types/documents";

export const documentsApi = {
  listByCaseId: (caseId: string): Promise<DocumentListResponse> =>
    GET<{ documents: Document[]; total: number; page: number; limit: number }>(
      `/cases/${caseId}/documents`,
    ).then((r) => ({ data: r.documents, total: r.total, page: r.page, limit: r.limit })),

  listFolders: () =>
    GET<{ folders: DocumentFolder[] }>("/documents/folders").then((r) => r.folders),

  upload: (caseId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return POST<{ document: Document }>(`/cases/${caseId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.document);
  },

  getUrl: (caseId: string, documentId: string) =>
    GET<{ url: string }>(`/cases/${caseId}/documents/${documentId}/url`),

  rename: (caseId: string, documentId: string, name: string) =>
    PATCH<{ document: Document }>(`/cases/${caseId}/documents/${documentId}`, { name }).then(
      (r) => r.document,
    ),

  delete: (caseId: string, documentId: string) =>
    DELETE<void>(`/cases/${caseId}/documents/${documentId}`),
};
