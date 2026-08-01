"use client";

import { differenceInCalendarDays } from "date-fns";
import { useRouter } from "next/navigation";

import { cn } from "@/utils/tailwind";
import { formatDateLabel } from "@/utils/format-date-label";
import { EmptyState } from "@/components/ui/empty-state";
import { ImportantDateType } from "@splexa-group/shared/enums";
import type { HighPriorityCase, UpcomingDeadline } from "@/types/dashboard";

interface Props {
  deadlines:         UpcomingDeadline[] | undefined;
  highPriorityCases: HighPriorityCase[] | undefined;
}

function isUrgent(dateStr: string): boolean {
  return differenceInCalendarDays(new Date(dateStr), new Date()) <= 7;
}

const DATE_TYPE_LABELS: Partial<Record<ImportantDateType, string>> = {
  [ImportantDateType.LIMITATION]:          "Limitation",
  [ImportantDateType.BAIL_EXPIRY]:         "Bail Expiry",
  [ImportantDateType.STAY_EXPIRY]:         "Stay Expiry",
  [ImportantDateType.APPEAL_DEADLINE]:     "Appeal Deadline",
  [ImportantDateType.INJUNCTION_VALIDITY]: "Injunction",
};

export function AttentionNeeded({ deadlines, highPriorityCases }: Props) {
  const router    = useRouter();
  const isLoading = deadlines === undefined || highPriorityCases === undefined;
  const isEmpty   = deadlines !== undefined && highPriorityCases !== undefined
    && deadlines.length === 0 && highPriorityCases.length === 0;

  return (
    <div className="rounded-lg border border-line bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-sm font-semibold text-dark">Attention Needed</h3>
        <p className="text-xs text-secondary mt-0.5">Deadlines & high-priority cases</p>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded border border-line bg-card animate-pulse" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState text="Nothing needs immediate attention." className="py-10" />
      ) : (
        <div>
          {deadlines.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-secondary uppercase tracking-wide">
                Upcoming Deadlines
              </p>
              <ul>
                {deadlines.map((d, i) => {
                  const urgent = isUrgent(d.date);
                  return (
                    <li
                      key={d.id}
                      onClick={() => router.push(`/cases/${d.caseId}`)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface transition-colors",
                        i < deadlines.length - 1 && "border-b border-line",
                      )}
                    >
                      <div className="min-w-[76px] shrink-0">
                        <span className={cn(
                          "text-xs font-semibold",
                          urgent ? "text-negative" : "text-secondary",
                        )}>
                          {formatDateLabel(d.date)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{d.caseTitle}</p>
                        {d.description && (
                          <p className="text-xs text-secondary mt-0.5 truncate">{d.description}</p>
                        )}
                      </div>

                      <span className={cn(
                        "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
                        urgent
                          ? "bg-negative-muted text-negative"
                          : "bg-subtle text-secondary",
                      )}>
                        {DATE_TYPE_LABELS[d.dateType] ?? d.dateType}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {highPriorityCases.length > 0 && (
            <div className={cn(deadlines.length > 0 && "border-t border-line")}>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-secondary uppercase tracking-wide">
                High Priority Cases
              </p>
              <ul>
                {highPriorityCases.map((c, i) => (
                  <li
                    key={c.id}
                    onClick={() => router.push(`/cases/${c.id}`)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface transition-colors",
                      i < highPriorityCases.length - 1 && "border-b border-line",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{c.title}</p>
                      <p className="text-xs text-secondary mt-0.5 truncate">
                        {c.nextHearingDate
                          ? `Next hearing: ${formatDateLabel(c.nextHearingDate)}`
                          : "No hearing scheduled"}
                        {c.courtName ? ` · ${c.courtName}` : ""}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-negative-muted text-negative">
                      High Priority
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
