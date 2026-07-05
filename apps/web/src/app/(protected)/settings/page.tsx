"use client";

import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/layout/tabs-nav";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { SETTINGS_TAB_CONFIG } from "@/config/settings-tabs";
import { SettingsTabs } from "@/enums/settings-tabs";
import { useActiveTab } from "@/hooks/use-active-tab";
import { ProfileTab } from "@/components/settings/profile-tab";

// Placeholder components — replaced in Tasks 4 and 5
function SubscriptionTabPlaceholder() {
  return <div className="p-6 text-sm text-secondary">Subscription tab — coming in next task</div>;
}

export default function SettingsPage() {
  const router = useRouter();
  const activeTab = useActiveTab(SETTINGS_TAB_CONFIG, SettingsTabs.PROFILE);

  usePageTitle({ title: "Settings" });

  function handleNavigate(tabId: string) {
    router.push(`/settings?tab=${tabId}`);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TabsNav
        tabs={SETTINGS_TAB_CONFIG}
        activeTab={activeTab}
        activeSubTab=""
        onNavigate={handleNavigate}
      />
      <div className="flex-1 overflow-y-auto bg-page">
        {activeTab === SettingsTabs.PROFILE      && <ProfileTab />}
        {activeTab === SettingsTabs.SUBSCRIPTION && <SubscriptionTabPlaceholder />}
      </div>
    </div>
  );
}
