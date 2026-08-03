import { use } from "react";
import { CaseDetailView } from "@/components/cases/case-detail-view";

export default function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  return <CaseDetailView caseId={caseId} />;
}
