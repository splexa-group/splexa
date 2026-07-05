"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderCard } from "@/components/documents/folder-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Search } from "@/components/ui/form/search";
import { Select } from "@/components/ui/form/select";
import { useFolders } from "@/hooks/use-documents";
import type { DocumentFolder } from "@/types/documents";

const FILTER_OPTIONS = [
  { value: "all", label: "All folders" },
  { value: "with-docs", label: "With documents" },
  { value: "empty", label: "Empty" },
];

export function FolderGrid() {
  const router = useRouter();
  const { data: folders = [], isLoading } = useFolders();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  function handleFolderClick(folder: DocumentFolder) {
    router.push(`/documents?caseId=${folder.caseId}`);
  }

  const visible = folders
    .filter((f) =>
      filter === "with-docs" ? f.documentCount > 0 : filter === "empty" ? f.documentCount === 0 : true,
    )
    .filter((f) => !search || f.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search cases…"
          className="flex-1 max-w-sm"
        />
        <Select
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
          className="w-44"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border border-line bg-card animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          text={search || filter !== "all" ? "No folders match your search." : "No cases yet. Create a case to start uploading documents."}
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((folder) => (
            <FolderCard key={folder.caseId} folder={folder} onClick={handleFolderClick} />
          ))}
        </div>
      )}
    </div>
  );
}
