"use client";

import { useSearchParams } from "next/navigation";
import type { TabConfig } from "@/components/layout/tabs-nav";
import { CaseTabs } from "@/enums/case-tabs";
import { CASE_TAB_CONFIG } from "@/config/case-tabs";

export function useActiveTab(tabs: TabConfig[], defaultTab: string): string {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const isValid = tab !== null && tabs.some((t) => t.id === tab);
  return isValid ? tab : defaultTab;
}

export function useActiveSubTab(activeTab: string, tabs: TabConfig[]): string {
  const searchParams = useSearchParams();
  const subTab = searchParams.get("subTab");
  const tabConfig = tabs.find((t) => t.id === activeTab);
  if (!tabConfig?.subTabs?.length) return "";
  const isValid = tabConfig.subTabs.some((s) => s.id === subTab);
  return isValid ? (subTab ?? tabConfig.subTabs[0].id) : tabConfig.subTabs[0].id;
}

// Case wrappers
export function useCaseActiveTab(): CaseTabs {
  return useActiveTab(CASE_TAB_CONFIG, CaseTabs.CASE) as CaseTabs;
}

export function useCaseActiveSubTab(tab: CaseTabs): string {
  return useActiveSubTab(tab, CASE_TAB_CONFIG);
}
