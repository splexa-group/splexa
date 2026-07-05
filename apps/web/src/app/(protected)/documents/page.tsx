"use client";

import { use } from "react";
import { FolderGrid } from "@/components/documents/folder-grid";
import { DocumentFileList } from "@/components/documents/document-file-list";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { useFolders } from "@/hooks/use-documents";

interface Props {
  searchParams: Promise<{ caseId?: string }>;
}

function DocumentsPageInner({ caseId }: { caseId: string | undefined }) {
  const { data: folders = [] } = useFolders();
  const activeFolder = caseId ? folders.find((f) => f.caseId === caseId) : undefined;

  usePageTitle({
    title: activeFolder ? activeFolder.title : "Documents",
  });

  return (
    <div className="h-full overflow-y-auto px-4 md:px-6 py-6">
      {caseId ? (
        <DocumentFileList caseId={caseId} caseTitle={activeFolder?.title ?? "Documents"} />
      ) : (
        <FolderGrid />
      )}
    </div>
  );
}

export default function Page({ searchParams }: Props) {
  const { caseId } = use(searchParams);
  return <DocumentsPageInner caseId={caseId} />;
}
