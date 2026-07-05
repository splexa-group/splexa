import type { TabConfig } from "@/components/layout/tabs-nav";
import { SettingsTabs } from "@/enums/settings-tabs";

export const SETTINGS_TAB_CONFIG: TabConfig[] = [
  { id: SettingsTabs.PROFILE,      label: "Profile" },
  { id: SettingsTabs.SUBSCRIPTION, label: "Subscription" },
];
