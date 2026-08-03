import { CaseStatus, Priority } from "@splexa-group/shared/enums";

export function priorityBorderClass(priority: Priority | null | undefined): string {
  if (priority === Priority.HIGH) return "border-l-2 border-l-priority-high";
  if (priority === Priority.MEDIUM) return "border-l-2 border-l-priority-medium";
  return "border-l-2 border-l-transparent";
}

export function statusBadgeClass(status: CaseStatus): string {
  if (status === CaseStatus.ACTIVE) return "bg-positive-muted text-positive";
  if (status === CaseStatus.STAYED) return "bg-brand-soft text-brand";
  return "bg-subtle text-secondary";
}
