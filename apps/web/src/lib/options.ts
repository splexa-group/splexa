import { Designation, PracticeType } from "@splexa-group/shared/enums";

function toOptions<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj).map((value) => ({
    value,
    label: value
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" "),
  }));
}

export const DESIGNATION_OPTIONS = toOptions(Designation);
export const PRACTICE_TYPE_OPTIONS = toOptions(PracticeType);
