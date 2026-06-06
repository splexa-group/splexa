import { CaseTabs, CaseSubTabs, CaseTabLabel, CaseSubTabLabel } from "@/enums/case-tabs";
import type { TabConfig } from "@/components/layout/tabs-nav";

export const CASE_TAB_CONFIG: TabConfig[] = [
  { id: CaseTabs.CLIENT, label: CaseTabLabel.CLIENT },
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
  { id: CaseTabs.IMPORTANT_DATES, label: CaseTabLabel.IMPORTANT_DATES },
  { id: CaseTabs.DOCUMENTS, label: CaseTabLabel.DOCUMENTS },
];
