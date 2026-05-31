import { cn } from "@/lib/utils";
import type { CaseStatus, Priority } from "@splexa-group/shared/enums";

export function priorityStripeClass(priority: Priority | null | undefined): string {
  if (priority === "High") return "bg-priority-high";
  if (priority === "Medium") return "bg-priority-medium";
  return "bg-transparent";
}

export function priorityBorderClass(priority: Priority | null | undefined): string {
  if (priority === "High") return "border-l-2 border-l-priority-high";
  if (priority === "Medium") return "border-l-2 border-l-priority-medium";
  return "border-l-2 border-l-transparent";
}

export function statusDotClass(status: CaseStatus): string {
  if (status === "Active") return "bg-positive";
  if (status === "Stayed") return "bg-brand-light";
  return "bg-placeholder";
}

export function statusBadgeClass(status: CaseStatus): string {
  if (status === "Active") return "bg-positive-muted text-positive";
  if (status === "Stayed") return "bg-brand-soft text-brand";
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
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d < today) return "Overdue";
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export { cn };
