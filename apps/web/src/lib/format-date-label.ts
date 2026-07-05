import { format, isToday, isTomorrow } from "date-fns";

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d))    return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
}
