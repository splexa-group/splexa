"use client";

import { PageFooter } from "@/components/layout/page-footer";
import { Button } from "@/components/ui/button";

interface DocumentsTabProps {
  caseId: string;
}

export function DocumentsTab({ caseId: _ }: DocumentsTabProps) {
  return (
    <>
      <div className="text-sm text-secondary text-center py-12">
        Document upload coming soon.
      </div>
      <PageFooter
        right={
          <Button size="sm" disabled>
            Upload Document
          </Button>
        }
      />
    </>
  );
}
