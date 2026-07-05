import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { documentsApi } from "@/services/documents";

export const documentKeys = {
  all: ["documents"] as const,
  folders: () => ["documents", "folders"] as const,
  list: (caseId: string) => ["documents", "list", caseId] as const,
};

export function useFolders() {
  return useQuery({
    queryKey: documentKeys.folders(),
    queryFn: () => documentsApi.listFolders(),
    select: (res) => res.data,
  });
}

export function useDocuments(caseId: string) {
  return useQuery({
    queryKey: documentKeys.list(caseId),
    queryFn: () => documentsApi.listByCaseId(caseId),
    enabled: !!caseId,
    select: (res) => res.data,
  });
}

export function useUploadDocument(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => documentsApi.upload(caseId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.list(caseId) });
      qc.invalidateQueries({ queryKey: documentKeys.folders() });
      toast.success("Document uploaded");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to upload document"),
  });
}

export function useRenameDocument(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, name }: { documentId: string; name: string }) =>
      documentsApi.rename(caseId, documentId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.list(caseId) });
      toast.success("Document renamed");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to rename document"),
  });
}

export function useDeleteDocument(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.delete(caseId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.list(caseId) });
      qc.invalidateQueries({ queryKey: documentKeys.folders() });
      toast.success("Document deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete document"),
  });
}
