"use client";

import { useSearchParams } from "next/navigation";
import type { TabConfig } from "@/components/layout/tabs-nav";

export function useActiveTab<T extends string>(tabs: TabConfig[], defaultTab: T): T {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const isValid = tab !== null && tabs.some((t) => t.id === tab);
  return (isValid ? tab : defaultTab) as T;
}

export function useActiveSubTab(activeTab: string, tabs: TabConfig[]): string {
  const searchParams = useSearchParams();
  const subTab = searchParams.get("subTab");
  const tabConfig = tabs.find((t) => t.id === activeTab);
  if (!tabConfig?.subTabs?.length) return "";
  const isValid = tabConfig.subTabs.some((s) => s.id === subTab);
  return isValid ? (subTab ?? tabConfig.subTabs[0].id) : tabConfig.subTabs[0].id;
}
