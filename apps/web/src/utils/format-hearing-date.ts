import { formatIndianDate, getRelativeDateLabel } from "@splexa-group/shared/utils";

export function formatHearingDate(date: string | null): string {
  if (!date) return "—";
  const relative = getRelativeDateLabel(date);
  if (relative) return relative;
  return formatIndianDate(date);
}
