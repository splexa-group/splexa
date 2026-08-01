import type { TabConfig } from "@/components/layout/tabs-nav";

export enum SettingsTabs {
  PROFILE      = "profile",
  SUBSCRIPTION = "subscription",
}

export const SETTINGS_TAB_CONFIG: TabConfig[] = [
  { id: SettingsTabs.PROFILE,      label: "Profile" },
  { id: SettingsTabs.SUBSCRIPTION, label: "Subscription" },
];
