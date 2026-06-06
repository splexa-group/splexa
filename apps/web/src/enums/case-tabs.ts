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

export const CaseTabLabels: Record<CaseTabs, string> = {
  [CaseTabs.CLIENT]: "Client",
  [CaseTabs.CASE]: "Case",
  [CaseTabs.HEARINGS]: "Hearings",
  [CaseTabs.IMPORTANT_DATES]: "Important Dates",
  [CaseTabs.DOCUMENTS]: "Documents",
};

export const CaseSubTabLabels: Record<CaseSubTabs, string> = {
  [CaseSubTabs.DETAILS]: "Case Details",
  [CaseSubTabs.DESCRIPTION]: "Case Description",
  [CaseSubTabs.OPPOSITE_PARTIES]: "Opposite Parties",
};
