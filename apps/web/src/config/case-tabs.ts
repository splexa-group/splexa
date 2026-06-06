import { CaseTabs, HearingsSubTabs, PartiesSubTabs } from "@/enums/case-tabs";

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
  {
    id: CaseTabs.CASE,
    label: "Case",
  },
  {
    id: CaseTabs.PARTIES,
    label: "Parties",
    subTabs: [
      { id: PartiesSubTabs.CLIENT, label: "Client" },
      { id: PartiesSubTabs.OPPOSITE_PARTIES, label: "Opposite Parties" },
    ],
  },
  {
    id: CaseTabs.HEARINGS,
    label: "Hearings",
    subTabs: [
      { id: HearingsSubTabs.HEARINGS, label: "Hearings" },
      { id: HearingsSubTabs.IMPORTANT_DATES, label: "Important Dates" },
    ],
  },
  {
    id: CaseTabs.DOCUMENTS,
    label: "Documents",
  },
];
