import { CaseTabs, CaseSubTabs } from "@/enums/case-tabs";

export interface SubTabConfig {
  id: string;
  label: string;
}

export interface CaseTabConfig {
  id: CaseTabs;
  label: string;
  subTabs?: SubTabConfig[];
}

// Add a new tab here — it will appear in the UI automatically.
// If the tab has sub-tabs, add them in the subTabs array.
// Then add a matching case in TabContent inside case-details.tsx.
export const CASE_TAB_CONFIG: CaseTabConfig[] = [
  { id: CaseTabs.CLIENT, label: "Client" },
  {
    id: CaseTabs.CASE,
    label: "Case",
    subTabs: [
      { id: CaseSubTabs.DETAILS, label: "Case Details" },
      { id: CaseSubTabs.DESCRIPTION, label: "Case Description" },
    ],
  },
  { id: CaseTabs.OPPOSITE_PARTIES, label: "Opposite Parties" },
  { id: CaseTabs.HEARINGS, label: "Hearings" },
  { id: CaseTabs.IMPORTANT_DATES, label: "Important Dates" },
];
