"use client";

import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { useActiveTab, useActiveSubTab } from "@/hooks/use-active-tab";
import { CLIENT_TAB_CONFIG, ClientTabs } from "@/constants/client-tabs";

interface Props {
  clientId: string;
}

export function ClientDetailTabs({ clientId }: Props) {
  const router = useRouter();
  const activeTab = useActiveTab<ClientTabs>(CLIENT_TAB_CONFIG, ClientTabs.INFO);
  const activeSubTab = useActiveSubTab(activeTab, CLIENT_TAB_CONFIG);

  function navigateTo(tabId: string) {
    router.push(`/clients/${clientId}?tab=${tabId}`);
  }

  return (
    <TabsNav
      tabs={CLIENT_TAB_CONFIG}
      activeTab={activeTab}
      activeSubTab={activeSubTab}
      onNavigate={navigateTo}
    />
  );
}
