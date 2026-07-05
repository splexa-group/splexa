"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderCard } from "@/components/documents/folder-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FiltersBar } from "@/components/ui/filters-bar";
import { Search } from "@/components/ui/form/search";
import { useFolders } from "@/hooks/use-documents";
import type { DocumentFolder } from "@/types/documents";

export function FolderGrid() {
  const router = useRouter();
  const { data: folders = [], isLoading } = useFolders();
  const [search, setSearch] = useState("");

  function handleFolderClick(folder: DocumentFolder) {
    router.push(`/documents?caseId=${folder.caseId}`);
  }

  const visible = folders.filter(
    (f) => !search || f.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <FiltersBar columns="1fr">
        <Search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search cases..."
        />
      </FiltersBar>

      <div className="px-4 md:px-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-lg border border-line bg-card animate-pulse"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            text={
              search
                ? "No folders match your search."
                : "No cases yet. Create a case to start uploading documents."
            }
            className="py-16"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visible.map((folder) => (
              <FolderCard
                key={folder.caseId}
                folder={folder}
                onClick={handleFolderClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
