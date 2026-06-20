"use client";

import { useRouter } from "next/navigation";
import { FolderCard } from "@/components/documents/folder-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useFolders } from "@/hooks/use-documents";
import type { DocumentFolder } from "@/types/documents";

export function FolderGrid() {
  const router = useRouter();
  const { data: folders = [], isLoading } = useFolders();

  function handleFolderClick(folder: DocumentFolder) {
    router.push(`/documents?caseId=${folder.caseId}`);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-line bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <EmptyState
        text="No cases yet. Create a case to start uploading documents."
        className="py-16"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {folders.map((folder) => (
        <FolderCard key={folder.caseId} folder={folder} onClick={handleFolderClick} />
      ))}
    </div>
  );
}
