"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CaseRowMenu } from "./case-row-menu";
import type { CaseSummary } from "@/types/cases";
import { formatHearingDate, hearingDateColor, priorityStripeClass, statusDotClass } from "./case-utils";

interface CaseTableRowProps {
  case_: CaseSummary;
  onDelete: (c: CaseSummary) => void;
}

export function CaseTableRow({ case_, onDelete }: CaseTableRowProps) {
  const router = useRouter();
  const isInactive = case_.status === "Stayed" || case_.status === "Disposed";

  return (
    <div
      role="row"
      onClick={() => router.push(`/cases/${case_.id}`)}
      className={cn(
        "grid items-center gap-0 px-4 min-h-[54px] border-b border-line cursor-pointer transition-colors hover:bg-subtle",
        "grid-cols-[12px_1fr_140px_130px_70px_110px_36px]",
        isInactive && "opacity-40",
      )}
    >
      {/* Priority stripe */}
      <span className={cn("w-[3px] h-7 rounded-full", priorityStripeClass(case_.priority))} />

      {/* Case + number */}
      <div className="pr-4 min-w-0">
        <p className="text-sm font-semibold text-dark truncate">{case_.title}</p>
        {case_.caseNumber && (
          <p className="text-xs text-placeholder">{case_.caseNumber}</p>
        )}
      </div>

      {/* Client */}
      <p className="text-sm text-label pr-4 truncate">{case_.client?.fullName ?? '—'}</p>

      {/* Court */}
      <p className="text-xs text-secondary pr-4 truncate">{case_.courtName ?? "—"}</p>

      {/* Status */}
      <div className="flex items-center gap-1.5 pr-4">
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusDotClass(case_.status))} />
        <span className="text-xs text-secondary">{case_.status}</span>
      </div>

      {/* Next hearing */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-placeholder">
          Next Hearing
        </span>
        <span className={cn("text-xs font-semibold", hearingDateColor(case_.nextHearingDate))}>
          {formatHearingDate(case_.nextHearingDate)}
        </span>
      </div>

      {/* Menu */}
      <div onClick={(e) => e.stopPropagation()}>
        <CaseRowMenu
          onEdit={() => router.push(`/cases/${case_.id}`)}
          onViewClient={() => case_.client && router.push(`/clients/${case_.client.id}`)}
          onDelete={() => onDelete(case_)}
        />
      </div>
    </div>
  );
}
