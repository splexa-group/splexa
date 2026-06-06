"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Hearing } from "@/types/hearings";
import { HearingStatus } from "@splexa-group/shared/enums";

const STATUS_STYLES: Record<HearingStatus, { dot: string; badge: string }> = {
  [HearingStatus.Scheduled]: { dot: "bg-brand-soft border-brand", badge: "bg-brand-soft text-brand" },
  [HearingStatus.Completed]: { dot: "bg-positive-muted border-positive", badge: "bg-positive-muted text-positive" },
  [HearingStatus.Adjourned]: { dot: "bg-amber-muted border-amber", badge: "bg-amber-muted text-amber-dark" },
  [HearingStatus.Cancelled]: { dot: "bg-negative-muted border-negative", badge: "bg-negative-muted text-negative" },
};

interface HearingCardProps {
  hearing: Hearing;
  onEdit: () => void;
  onDelete: () => void;
  faded?: boolean;
}

export function HearingCard({ hearing, onEdit, onDelete, faded }: HearingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const styles = STATUS_STYLES[hearing.status];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const dateStr = new Date(hearing.date).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  const purposeLabel = hearing.purpose
    ? hearing.purpose.replace(/([A-Z])/g, " $1").trim()
    : "—";

  return (
    <div className={cn("relative pl-6", faded && "opacity-50")}>
      {/* Timeline dot */}
      <span
        className={cn(
          "absolute left-0 top-3 w-3.5 h-3.5 rounded-full border-2 border-card ring-1 z-10",
          styles.dot,
        )}
      />

      <div className="bg-card border border-line rounded overflow-hidden">
        <div className="px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-dark mb-0.5">{dateStr}</p>
            <p className="text-xs text-secondary">
              {purposeLabel}
              {hearing.judgePresent && ` · ${hearing.judgePresent}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", styles.badge)}>
              {hearing.status}
            </span>
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((p) => !p)}
                className="p-1 rounded text-placeholder hover:text-secondary hover:bg-subtle transition-colors"
              >
                <MoreVertical className="size-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-30 w-36 bg-card border border-line rounded shadow-md py-1">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-label hover:bg-subtle"
                  >
                    <Pencil className="size-3.5" /> Edit hearing
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-negative hover:bg-negative-muted"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {hearing.notes && (
          <div className="px-4 pb-3 border-t border-line pt-2">
            <p className="text-xs text-secondary leading-relaxed">{hearing.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
