import { use } from "react";
import { DocumentsView } from "@/components/documents/documents-view";

interface Props {
  searchParams: Promise<{ caseId?: string }>;
}

export default function Page({ searchParams }: Props) {
  const { caseId } = use(searchParams);
  return <DocumentsView caseId={caseId} />;
}
