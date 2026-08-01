"use client";

import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { useActiveTab, useActiveSubTab } from "@/hooks/use-active-tab";
import { CASE_TAB_CONFIG, CaseTabs } from "@/constants/case-tabs";

interface Props {
  caseId: string;
}

export function CaseDetailTabs({ caseId }: Props) {
  const router = useRouter();
  const activeTab = useActiveTab(CASE_TAB_CONFIG, CaseTabs.CASE) as CaseTabs;
  const activeSubTab = useActiveSubTab(activeTab, CASE_TAB_CONFIG);

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
