"use client";

import { FolderOpen } from "lucide-react";
import { cn } from "@/utils/tailwind";
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
        "hover:bg-surface transition-colors cursor-pointer",
        "flex flex-col gap-2",
      )}
    >
      <FolderOpen className="size-7 text-brand" />
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
