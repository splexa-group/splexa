import {
  CaseStage,
  CaseStatus,
  CaseType,
  ClientType,
  CourtType,
  Designation,
  HearingPurpose,
  HearingStatus,
  ImportantDateType,
  PartyRole,
  PracticeType,
  Priority,
} from "@splexa-group/shared/enums";

function toOptions<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj).map((value) => ({
    value,
    label: value
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" "),
  }));
}

function toPascalOptions<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj).map((value) => ({
    value,
    label: value
      .replace(/([A-Z])/g, " $1")
      .replace(/^_/, "")
      .trim(),
  }));
}

export const DESIGNATION_OPTIONS = toOptions(Designation);
export const PRACTICE_TYPE_OPTIONS = toOptions(PracticeType);
export const CASE_TYPE_OPTIONS = toPascalOptions(CaseType);
export const CASE_STATUS_OPTIONS = toPascalOptions(CaseStatus);
export const CASE_STAGE_OPTIONS = toPascalOptions(CaseStage);
export const COURT_TYPE_OPTIONS = toPascalOptions(CourtType);
export const PRIORITY_OPTIONS = toPascalOptions(Priority);
export const PARTY_ROLE_OPTIONS = toPascalOptions(PartyRole);
export const CLIENT_TYPE_OPTIONS = toPascalOptions(ClientType);
export const HEARING_PURPOSE_OPTIONS = toPascalOptions(HearingPurpose);
export const HEARING_STATUS_OPTIONS = toPascalOptions(HearingStatus);
export const IMPORTANT_DATE_TYPE_OPTIONS = toPascalOptions(ImportantDateType);
