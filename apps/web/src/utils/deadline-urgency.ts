import { differenceInCalendarDays } from "date-fns";

import type { DeadlineUrgency } from "@/types/misc";

export function getDeadlineUrgency(isoDate: string): { diff: number; urgency: DeadlineUrgency } {
  const diff = differenceInCalendarDays(new Date(isoDate), new Date());
  const urgency: DeadlineUrgency = diff < 0 ? "overdue" : diff <= 7 ? "soon" : null;
  return { diff, urgency };
}

export function deadlineUrgencyPillClass(urgency: DeadlineUrgency): string {
  if (urgency === "overdue") return "bg-negative-muted text-negative";
  if (urgency === "soon") return "bg-amber-muted text-amber-dark";
  return "bg-subtle text-secondary";
}

export function deadlineUrgencyTextClass(urgency: DeadlineUrgency): string {
  if (urgency === "overdue") return "text-negative";
  if (urgency === "soon") return "text-amber-dark";
  return "text-secondary";
}
