"use client";

import { useCallback, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { useDocuments } from "@/hooks/use-documents";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import {
  DocumentFileList,
  type DocumentFileListHandle,
} from "@/components/documents/document-file-list";

interface DocumentsTabProps {
  caseId: string;
}

export function Documents({ caseId }: DocumentsTabProps) {
  const { data: documents = [], isLoading } = useDocuments(caseId);
  const listRef = useRef<DocumentFileListHandle>(null);
  const [isUploading, setIsUploading] = useState(false);
  const handleUploadClick = useCallback(() => listRef.current?.triggerUpload(), []);

  return (
    <Section
      title={isLoading ? "Documents" : `Documents (${documents.length})`}
      action={
        <Button size="sm" onClick={handleUploadClick} disabled={isUploading} loading={isUploading}>
          <Plus className="size-3.5" />
          Upload
        </Button>
      }
      isEmpty={!isLoading && documents.length === 0}
      emptyLabel="No documents yet. Upload petitions, orders, affidavits, or any case file."
      onAdd={handleUploadClick}
      addLabel="Upload Document"
    >
      <DocumentFileList
        ref={listRef}
        caseId={caseId}
        onUploadStateChange={setIsUploading}
        padded={false}
      />
    </Section>
  );
}
