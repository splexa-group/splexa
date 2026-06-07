"use client";

import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { useCaseActiveTab, useCaseActiveSubTab } from "@/hooks/use-active-tab";
import { CASE_TAB_CONFIG } from "@/config/case-tabs";

interface Props {
  caseId: string;
}

export function CaseTabs({ caseId }: Props) {
  const router = useRouter();
  const activeTab = useCaseActiveTab();
  const activeSubTab = useCaseActiveSubTab(activeTab);

  function navigateTo(tabId: string, subTabId?: string) {
    const params = new URLSearchParams({ tab: tabId });
    if (subTabId) params.set("subTab", subTabId);
    router.push(`/cases/${caseId}?${params.toString()}`);
  }

  return (
    <TabsNav
      tabs={CASE_TAB_CONFIG}
      activeTab={activeTab}
      activeSubTab={activeSubTab}
      onNavigate={navigateTo}
    />
  );
}
