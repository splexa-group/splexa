import type { TabConfig } from "@/components/layout/tabs-nav";

export enum CaseTabs {
  CLIENT = "client",
  CASE = "case",
  HEARINGS = "hearings",
  IMPORTANT_DATES = "important-dates",
  DOCUMENTS = "documents",
}

export enum CaseSubTabs {
  DETAILS = "details",
  DESCRIPTION = "description",
  OPPOSITE_PARTIES = "opposite-parties",
}

export enum CaseTabLabel {
  CLIENT = "Client",
  CASE = "Case",
  HEARINGS = "Hearings",
  IMPORTANT_DATES = "Important Dates",
  DOCUMENTS = "Documents",
}

export enum CaseSubTabLabel {
  DETAILS = "Case Details",
  DESCRIPTION = "Case Description",
  OPPOSITE_PARTIES = "Opposite Parties",
}

export const CASE_TAB_CONFIG: TabConfig[] = [
  {
    id: CaseTabs.CASE,
    label: CaseTabLabel.CASE,
    subTabs: [
      { id: CaseSubTabs.DETAILS, label: CaseSubTabLabel.DETAILS },
      { id: CaseSubTabs.DESCRIPTION, label: CaseSubTabLabel.DESCRIPTION },
      { id: CaseSubTabs.OPPOSITE_PARTIES, label: CaseSubTabLabel.OPPOSITE_PARTIES },
    ],
  },
  { id: CaseTabs.HEARINGS, label: CaseTabLabel.HEARINGS },
  { id: CaseTabs.CLIENT, label: CaseTabLabel.CLIENT },
  { id: CaseTabs.IMPORTANT_DATES, label: CaseTabLabel.IMPORTANT_DATES },
  { id: CaseTabs.DOCUMENTS, label: CaseTabLabel.DOCUMENTS },
];
