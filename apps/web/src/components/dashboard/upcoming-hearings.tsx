"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { UpcomingHearing } from "@/types/dashboard";

interface Props {
  hearings: UpcomingHearing[];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d))    return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
}

const PURPOSE_LABELS: Record<string, string> = {
  Arguments:       "Arguments",
  Evidence:        "Evidence",
  CrossExamination:"Cross Exam.",
  Order:           "Order",
  Mention:         "Mention",
  Settlement:      "Settlement",
  Miscellaneous:   "Misc.",
};

export function UpcomingHearings({ hearings }: Props) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-line bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-sm font-semibold text-dark">Upcoming Hearings</h3>
        <p className="text-xs text-secondary mt-0.5">Next 14 days</p>
      </div>

      {hearings.length === 0 ? (
        <EmptyState text="No hearings in the next 14 days." className="py-10" />
      ) : (
        <ul>
          {hearings.map((h, i) => (
            <li
              key={h.id}
              onClick={() => router.push(`/cases/${h.caseId}?tab=hearings`)}
              className={cn(
                "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface transition-colors",
                i < hearings.length - 1 && "border-b border-line",
              )}
            >
              <div className="min-w-[76px] shrink-0">
                <span className="text-xs font-semibold text-brand">
                  {formatDateLabel(h.date)}
                </span>
                {h.time && (
                  <p className="text-xs text-secondary mt-0.5">{h.time}</p>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{h.caseTitle}</p>
                {h.courtName && (
                  <p className="text-xs text-secondary mt-0.5 truncate">{h.courtName}</p>
                )}
              </div>

              {h.purpose && (
                <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                  {PURPOSE_LABELS[h.purpose] ?? h.purpose}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
