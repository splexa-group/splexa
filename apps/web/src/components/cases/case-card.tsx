"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CaseSummary } from "@/types/cases";
import {
  formatHearingDate,
  hearingDateColor,
  priorityStripeClass,
  statusDotClass,
} from "./case-utils";

interface CaseCardProps {
  case_: CaseSummary;
  onDelete: (c: CaseSummary) => void;
}

export function CaseCard({ case_, onDelete: _ }: CaseCardProps) {
  const router = useRouter();
  const isUrgent =
    case_.nextHearingDate &&
    (isOverdue(case_.nextHearingDate) || isToday(case_.nextHearingDate));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/cases/${case_.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/cases/${case_.id}`)}
      className={cn(
        "bg-card rounded-xl border flex overflow-hidden cursor-pointer active:scale-[0.99] transition-transform min-h-[44px]",
        isUrgent ? "border-priority-high-muted" : "border-line",
      )}
    >
      {/* Priority stripe */}
      <div className={cn("w-[3px] flex-shrink-0", priorityStripeClass(case_.priority))} />

      <div className="flex-1 p-3 min-w-0">
        {/* Row 1: title + hearing */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-dark leading-snug flex-1 min-w-0">
            {case_.title}
          </p>
          <div className="flex-shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-placeholder mb-0.5">
              Next hearing
            </p>
            <p className={cn("text-xs font-bold", hearingDateColor(case_.nextHearingDate))}>
              {formatHearingDate(case_.nextHearingDate)}
            </p>
          </div>
        </div>

        {/* Case number */}
        {case_.caseNumber && (
          <p className="text-[11px] text-placeholder mb-1">{case_.caseNumber}</p>
        )}

        {/* Client + court */}
        <p className="text-xs text-secondary mb-2 truncate">
          {case_.client.fullName}
          {case_.courtName && ` · ${case_.courtName}`}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusDotClass(case_.status))} />
          <span className="text-[11px] text-secondary">{case_.status}</span>
        </div>
      </div>
    </div>
  );
}

function isOverdue(date: string) {
  return new Date(date) < new Date(new Date().toDateString());
}

function isToday(date: string) {
  return new Date(date).toDateString() === new Date().toDateString();
}
