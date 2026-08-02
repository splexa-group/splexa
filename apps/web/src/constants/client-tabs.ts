import type { TabConfig } from "@/components/layout/tabs-nav";

export enum ClientTabs {
  INFO = "info",
  CASES = "cases",
}

export const CLIENT_TAB_CONFIG: TabConfig[] = [
  { id: ClientTabs.INFO, label: "Info" },
  { id: ClientTabs.CASES, label: "Cases" },
];
