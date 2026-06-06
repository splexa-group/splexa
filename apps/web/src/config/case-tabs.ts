import {
  CaseTabs,
  CaseSubTabs,
  CaseTabLabels,
  CaseSubTabLabels,
} from "@/enums/case-tabs";
import type { TabConfig } from "@/components/layout/tabs-nav";

export const CASE_TAB_CONFIG: TabConfig[] = [
  { id: CaseTabs.CLIENT, label: CaseTabLabels[CaseTabs.CLIENT] },
  {
    id: CaseTabs.CASE,
    label: CaseTabLabels[CaseTabs.CASE],
    subTabs: [
      { id: CaseSubTabs.DETAILS, label: CaseSubTabLabels[CaseSubTabs.DETAILS] },
      {
        id: CaseSubTabs.DESCRIPTION,
        label: CaseSubTabLabels[CaseSubTabs.DESCRIPTION],
      },
      {
        id: CaseSubTabs.OPPOSITE_PARTIES,
        label: CaseSubTabLabels[CaseSubTabs.OPPOSITE_PARTIES],
      },
    ],
  },
  { id: CaseTabs.HEARINGS, label: CaseTabLabels[CaseTabs.HEARINGS] },
  {
    id: CaseTabs.IMPORTANT_DATES,
    label: CaseTabLabels[CaseTabs.IMPORTANT_DATES],
  },
  { id: CaseTabs.DOCUMENTS, label: CaseTabLabels[CaseTabs.DOCUMENTS] },
];
