import { use } from "react";
import CaseDetails from "./case-details";

export default function Page({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  return <CaseDetails caseId={caseId} />;
}
