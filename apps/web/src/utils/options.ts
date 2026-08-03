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
  PreferredLanguage,
  Priority,
  RelationType,
} from "@splexa-group/shared/enums";

export function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function toOptions<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj).map((value) => ({
    value,
    label: formatEnumLabel(value),
  }));
}

export function withNone<T extends { value: string; label: string }>(
  options: T[],
): ({ value: string; label: string } | T)[] {
  return [{ value: "", label: "None" }, ...options];
}

export const DESIGNATION_OPTIONS = toOptions(Designation);
export const PRACTICE_TYPE_OPTIONS = toOptions(PracticeType);
export const CASE_TYPE_OPTIONS = toOptions(CaseType);
export const CASE_STATUS_OPTIONS = toOptions(CaseStatus);
export const CASE_STAGE_OPTIONS = toOptions(CaseStage);
export const COURT_TYPE_OPTIONS = toOptions(CourtType);
export const PRIORITY_OPTIONS = toOptions(Priority);
export const PARTY_ROLE_OPTIONS = toOptions(PartyRole);
export const CLIENT_TYPE_OPTIONS = toOptions(ClientType);
export const HEARING_PURPOSE_OPTIONS = toOptions(HearingPurpose);
export const HEARING_STATUS_OPTIONS = toOptions(HearingStatus);
// HEARING_DATE is a system-only marker the hearings module manages — never manually pickable.
export const IMPORTANT_DATE_TYPE_OPTIONS = toOptions(ImportantDateType).filter(
  (option) => option.value !== ImportantDateType.HEARING_DATE,
);
export const PREFERRED_LANGUAGE_OPTIONS = toOptions(PreferredLanguage);
export const RELATION_TYPE_OPTIONS = toOptions(RelationType);
