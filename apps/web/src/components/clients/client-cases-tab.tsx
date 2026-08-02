"use client";

import { useRouter } from "next/navigation";
import { statusBadgeClass } from "@/components/cases/case-styles";
import { EmptyState } from "@/components/ui/empty-state";
import { useCases } from "@/hooks/use-cases";
import { deadlineUrgencyPillClass, getDeadlineUrgency } from "@/utils/deadline-urgency";
import { formatHearingDate } from "@/utils/format-hearing-date";
import { formatEnumLabel } from "@/utils/options";
import { cn } from "@/utils/tailwind";

export function ClientCasesTab({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { data, isLoading } = useCases({ clientId });
  const cases = data?.data ?? [];

  if (!isLoading && cases.length === 0) {
    return <EmptyState text="No cases for this client yet." />;
  }

  return (
    <div className="bg-card border border-line rounded-lg overflow-hidden divide-y divide-line">
      {cases.map((c) => (
        <div
          key={c.id}
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/cases/${c.id}`)}
          onKeyDown={(e) => e.key === "Enter" && router.push(`/cases/${c.id}`)}
          className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="min-w-0">
            <p className="text-sm text-body truncate">{c.title}</p>
            <p className="text-xs text-secondary truncate">{c.courtName ?? "No court"}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                statusBadgeClass(c.status),
              )}
            >
              {formatEnumLabel(c.status)}
            </span>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-body">{formatHearingDate(c.nextHearingDate)}</span>
              {c.nextHearingDate && getDeadlineUrgency(c.nextHearingDate).urgency === "overdue" && (
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    deadlineUrgencyPillClass("overdue"),
                  )}
                >
                  Overdue
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
