"use client";

import { useSearchParams } from "next/navigation";

export type CaseTab =
  | "case"
  | "client"
  | "hearings"
  | "documents"
  | "important-dates";

export function useCaseActiveTab(): CaseTab {
  const searchParams = useSearchParams();
  return (searchParams.get("tab") ?? "case") as CaseTab;
}
