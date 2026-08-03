"use client";

import { useCallback, useRef } from "react";

import {
  DocumentFileList,
  type DocumentFileListHandle,
} from "@/components/documents/document-file-list";
import { FolderGrid } from "@/components/documents/folder-grid";
import { PageLayout } from "@/components/layout/page-layout";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { useFolders } from "@/hooks/use-documents";

interface Props {
  caseId: string | undefined;
}

export function DocumentsView({ caseId }: Props) {
  const { data: folders = [] } = useFolders();
  const activeFolder = caseId ? folders.find((f) => f.caseId === caseId) : undefined;
  const uploadRef = useRef<DocumentFileListHandle>(null);
  const handleUploadClick = useCallback(() => {
    uploadRef.current?.triggerUpload();
  }, []);

  usePageTitle({
    title: "Documents",
    resourceTitle: caseId ? (activeFolder?.title ?? "") : undefined,
    action: caseId ? { label: "Upload", onClick: handleUploadClick } : undefined,
  });

  return (
    <PageLayout maxWidth="large" padded={false} className="h-full overflow-y-auto">
      {caseId ? <DocumentFileList ref={uploadRef} caseId={caseId} /> : <FolderGrid />}
    </PageLayout>
  );
}
