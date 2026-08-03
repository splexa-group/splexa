import { format, isBefore, isToday, isTomorrow, startOfDay } from "date-fns";

import type { FormatIndianDateOptions, RelativeDateLabel } from "../models/misc";

export function formatIndianDate(date: string | Date, opts: FormatIndianDateOptions = {}): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const weekday = opts.includeWeekday ? "EEE " : "";
  const year = opts.includeYear ? " yyyy" : "";
  return format(d, `${weekday}d MMM${year}`);
}

export function getRelativeDateLabel(date: string | Date): RelativeDateLabel | null {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isBefore(startOfDay(d), startOfDay(new Date()))) return "Overdue";
  return null;
}
