"use client";

import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentFolder } from "@/types/documents";

interface Props {
  folder: DocumentFolder;
  onClick: (folder: DocumentFolder) => void;
}

export function FolderCard({ folder, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(folder)}
      className={cn(
        "w-full text-left p-4 rounded-lg border border-line bg-card",
        "hover:border-brand/40 hover:bg-brand/5 transition-colors",
        "flex flex-col gap-2",
      )}
    >
      <Folder className="size-8 text-brand/70" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-dark truncate">{folder.title}</p>
        <p className="text-xs text-secondary mt-0.5">
          {folder.documentCount === 0
            ? "No documents"
            : folder.documentCount === 1
              ? "1 document"
              : `${folder.documentCount} documents`}
        </p>
      </div>
    </button>
  );
}
