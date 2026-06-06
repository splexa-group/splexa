"use client";

import { useSearchParams } from "next/navigation";
import { CaseTabs } from "@/enums/case-tabs";
import { CASE_TAB_CONFIG } from "@/config/case-tabs";

export function useCaseActiveTab(): CaseTabs {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") as CaseTabs | null;
  const isValid = CASE_TAB_CONFIG.some((t) => t.id === tab);
  return isValid ? tab! : CaseTabs.CLIENT;
}

export function useCaseActiveSubTab(tab: CaseTabs): string {
  const searchParams = useSearchParams();
  const subTab = searchParams.get("subTab");
  const tabConfig = CASE_TAB_CONFIG.find((t) => t.id === tab);
  if (!tabConfig?.subTabs?.length) return "";
  const isValid = tabConfig.subTabs.some((s) => s.id === subTab);
  return isValid ? subTab! : tabConfig.subTabs[0].id;
}
