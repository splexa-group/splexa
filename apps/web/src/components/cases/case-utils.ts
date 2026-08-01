import { cn } from "@/lib/utils";
import { CaseStatus, Priority } from "@splexa-group/shared/enums";
import { formatIndianDate, getRelativeDateLabel } from "@splexa-group/shared/utils";

export function priorityStripeClass(priority: Priority | null | undefined): string {
  if (priority === Priority.HIGH) return "bg-priority-high";
  if (priority === Priority.MEDIUM) return "bg-priority-medium";
  return "bg-transparent";
}

export function priorityBorderClass(priority: Priority | null | undefined): string {
  if (priority === Priority.HIGH) return "border-l-2 border-l-priority-high";
  if (priority === Priority.MEDIUM) return "border-l-2 border-l-priority-medium";
  return "border-l-1 border-l-transparent";
}

export function statusDotClass(status: CaseStatus): string {
  if (status === CaseStatus.ACTIVE) return "bg-positive";
  if (status === CaseStatus.STAYED) return "bg-brand-light";
  return "bg-placeholder";
}

export function statusBadgeClass(status: CaseStatus): string {
  if (status === CaseStatus.ACTIVE) return "bg-positive-muted text-positive";
  if (status === CaseStatus.STAYED) return "bg-brand-soft text-brand";
  return "bg-subtle text-secondary";
}

export function hearingDateColor(date: string | null): string {
  if (!date) return "text-placeholder";
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d < today) return "text-negative";
  if (d.toDateString() === today.toDateString()) return "text-amber";
  if (d.toDateString() === tomorrow.toDateString()) return "text-brand";
  return "text-label";
}

export function formatHearingDate(date: string | null): string {
  if (!date) return "—";
  const relative = getRelativeDateLabel(date);
  if (relative) return relative;
  return formatIndianDate(date);
}

export { cn };
