import { format, isBefore, isToday, isTomorrow, startOfDay } from "date-fns";

export interface FormatIndianDateOptions {
  includeWeekday?: boolean;
  includeYear?: boolean;
}

export function formatIndianDate(
  date: string | Date,
  opts: FormatIndianDateOptions = {},
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const weekday = opts.includeWeekday ? "EEE " : "";
  const year = opts.includeYear ? " yyyy" : "";
  return format(d, `${weekday}d MMM${year}`);
}

export type RelativeDateLabel = "Overdue" | "Today" | "Tomorrow";

export function getRelativeDateLabel(date: string | Date): RelativeDateLabel | null {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isBefore(startOfDay(d), startOfDay(new Date()))) return "Overdue";
  return null;
}
