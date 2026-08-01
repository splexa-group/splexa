import { formatIndianDate, getRelativeDateLabel } from "@splexa-group/shared/utils";

export function formatDateLabel(dateStr: string): string {
  const relative = getRelativeDateLabel(dateStr);
  if (relative === "Today" || relative === "Tomorrow") return relative;
  return formatIndianDate(dateStr, { includeWeekday: true });
}
