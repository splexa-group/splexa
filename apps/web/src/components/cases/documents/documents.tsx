"use client";

import { useRef, useState } from "react";
import { Download, File, FileImage, FileText, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/tailwind";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  useRenameDocument,
} from "@/hooks/use-documents";
import { documentsApi } from "@/services/documents";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types/documents";

interface DocumentsTabProps {
  caseId: string;
}

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return <FileText className="size-5 text-negative shrink-0" />;
  if (mimeType.startsWith("image/")) return <FileImage className="size-5 text-brand shrink-0" />;
  if (mimeType.includes("word") || mimeType.includes("document") || mimeType.includes("text"))
    return <FileText className="size-5 text-positive shrink-0" />;
  return <File className="size-5 text-secondary shrink-0" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Documents({ caseId }: DocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toDelete, setToDelete] = useState<Document | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: documents = [], isLoading } = useDocuments(caseId);
  const upload = useUploadDocument(caseId);
  const deleteDoc = useDeleteDocument(caseId);
  const renameDoc = useRenameDocument(caseId);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await upload.mutateAsync(file);
  }

  async function handleOpen(doc: Document) {
    setOpeningId(doc.id);
    try {
      const { url } = await documentsApi.getUrl(caseId, doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open document");
    } finally {
      setOpeningId(null);
    }
  }

  function startRename(doc: Document) {
    setRenamingId(doc.id);
    setRenameValue(doc.name);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  async function commitRename(doc: Document) {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === doc.name) {
      cancelRename();
      return;
    }
    await renameDoc.mutateAsync({ documentId: doc.id, name: trimmed });
    setRenamingId(null);
    setRenameValue("");
  }

  async function handleDelete() {
    if (!toDelete) return;
    await deleteDoc.mutateAsync(toDelete.id);
    setToDelete(null);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="*/*"
      />

      <Section
        title={isLoading ? "Documents" : `Documents (${documents.length})`}
        action={
          <Button size="sm" onClick={handleUploadClick} disabled={upload.isPending}>
            <Plus className="size-3.5" />
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        }
        isEmpty={!isLoading && documents.length === 0}
        emptyLabel="No documents yet. Upload petitions, orders, affidavits, or any case file."
        onAdd={handleUploadClick}
        addLabel="Upload Document"
      >
        <div className="rounded border border-line bg-card overflow-hidden">
          {documents.map((doc, i) => (
            <div
              key={doc.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                i < documents.length - 1 && "border-b border-line",
              )}
            >
              {fileIcon(doc.mimeType)}

              <div className="flex-1 min-w-0 space-y-0.5">
                {renamingId === doc.id ? (
                  <input
                    autoFocus
                    maxLength={255}
                    className="text-sm font-medium text-dark w-full border border-brand rounded px-2 py-0.5 outline-none"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void commitRename(doc);
                      if (e.key === "Escape") cancelRename();
                    }}
                  />
                ) : (
                  <p className="text-sm font-medium text-dark truncate">{doc.name}</p>
                )}
                <p className="text-xs text-secondary">
                  {formatBytes(doc.size)} ·{" "}
                  {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {renamingId === doc.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void commitRename(doc)}
                      disabled={renameDoc.isPending}
                      className="p-1.5 rounded bg-positive-muted text-positive hover:opacity-80 transition-opacity disabled:opacity-50"
                      aria-label="Save rename"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors"
                      aria-label="Cancel rename"
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startRename(doc)}
                      className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors"
                      aria-label="Rename"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleOpen(doc)}
                      disabled={openingId === doc.id}
                      className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors disabled:opacity-50"
                      aria-label="Download"
                    >
                      <Download className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(doc)}
                      className="p-1.5 rounded bg-negative-muted text-negative hover:opacity-80 transition-opacity"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <ConfirmDeleteModal
        open={!!toDelete}
        title="document"
        entityName={toDelete?.name ?? ""}
        isPending={deleteDoc.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
