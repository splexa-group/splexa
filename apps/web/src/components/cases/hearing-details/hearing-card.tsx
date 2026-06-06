"use client";

import { useRef, useState, useEffect } from "react";
import {
  Hammer,
  Clock,
  Check,
  CornerDownRight,
  X,
  Landmark,
  User,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Hearing } from "@/types/hearings";
import { HearingStatus } from "@splexa-group/shared/enums";

const STATUS_PILL: Record<HearingStatus, { pill: string; dot: string }> = {
  [HearingStatus.Scheduled]: { pill: "bg-amber-muted text-amber-dark", dot: "bg-amber" },
  [HearingStatus.Completed]: { pill: "bg-positive-muted text-positive", dot: "bg-positive" },
  [HearingStatus.Adjourned]: { pill: "bg-brand-soft text-brand", dot: "bg-brand" },
  [HearingStatus.Cancelled]: { pill: "bg-negative-muted text-negative", dot: "bg-negative" },
};

// ─── Compact card used in the timeline ───────────────────────────────────────

interface HearingCardProps {
  hearing: Hearing;
  courtName?: string | null;
  benchNumber?: string | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function HearingCard({
  hearing,
  courtName,
  benchNumber,
  onEdit,
  onDelete,
}: HearingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const style = STATUS_PILL[hearing.status];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const purposeLabel = hearing.purpose
    ? hearing.purpose.replace(/([A-Z])/g, " $1").trim()
    : "Hearing";

  const formattedDate = new Date(hearing.date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const courtParts = [courtName, benchNumber ? `Hall ${benchNumber}` : null].filter(Boolean);

  return (
    <div className="bg-card border border-line rounded-lg">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-dark">{purposeLabel}</p>

          <div className="flex items-center gap-1.5">
            <Clock className="size-3 text-placeholder shrink-0" />
            <span className="text-xs text-secondary">{formattedDate}</span>
          </div>

          {(courtParts.length > 0 || hearing.judgePresent) && (
            <div className="flex items-center gap-3 flex-wrap">
              {courtParts.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Landmark className="size-3 text-placeholder shrink-0" />
                  <span className="text-xs text-secondary">{courtParts.join(" · ")}</span>
                </div>
              )}
              {hearing.judgePresent && (
                <div className="flex items-center gap-1.5">
                  <User className="size-3 text-placeholder shrink-0" />
                  <span className="text-xs text-secondary">{hearing.judgePresent}</span>
                </div>
              )}
            </div>
          )}

          {hearing.notes && (
            <p className="text-xs text-placeholder pl-2.5 border-l-2 border-line italic">
              {hearing.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
              style.pill,
            )}
          >
            <span className={cn("size-1.5 rounded-full", style.dot)} />
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
                  <Pencil className="size-3.5" /> Edit
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
    </div>
  );
}

// ─── Featured "Up Next" card shown above the list ────────────────────────────

interface UpNextCardProps {
  hearing: Hearing;
  courtName?: string | null;
  benchNumber?: string | null;
  onEdit: () => void;
  onMarkHeard: () => void;
  onMarkMissed: () => void;
  onAdjourn: () => void;
}

export function UpNextCard({
  hearing,
  courtName,
  benchNumber,
  onEdit,
  onMarkHeard,
  onMarkMissed,
  onAdjourn,
}: UpNextCardProps) {
  const date = new Date(hearing.date);
  const day = date.toLocaleDateString("en-IN", { day: "2-digit" });
  const month = date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  const year = date.getFullYear();

  const purposeLabel = hearing.purpose
    ? hearing.purpose.replace(/([A-Z])/g, " $1").trim()
    : "Hearing";

  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const courtParts = [courtName, benchNumber ? `Hall ${benchNumber}` : null].filter(Boolean);

  return (
    <div className="bg-amber-muted border border-amber rounded-lg overflow-hidden">
      {/* Up next label */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 text-[10px] font-bold text-amber-dark uppercase tracking-widest">
        <Hammer className="size-3" /> Up next
      </div>

      <div className="flex gap-4 px-4 pb-3">
        {/* Date block */}
        <div className="flex flex-col items-center rounded-lg overflow-hidden border border-amber/40 shrink-0 w-16 text-center">
          <div className="w-full bg-brand px-2 py-1">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{month}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center bg-card px-2 py-2">
            <span className="text-2xl font-bold text-dark leading-none">{day}</span>
            <span className="text-[10px] text-placeholder mt-0.5">{year}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1 py-1">
          <p className="text-base font-bold text-dark">{purposeLabel}</p>

          <div className="flex items-center gap-1.5">
            <Clock className="size-3 text-placeholder shrink-0" />
            <span className="text-xs text-secondary">{formattedDate}</span>
          </div>

          {(courtParts.length > 0 || hearing.judgePresent) && (
            <div className="flex items-center gap-3 flex-wrap">
              {courtParts.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Landmark className="size-3 text-placeholder shrink-0" />
                  <span className="text-xs text-secondary">{courtParts.join(" · ")}</span>
                </div>
              )}
              {hearing.judgePresent && (
                <div className="flex items-center gap-1.5">
                  <User className="size-3 text-placeholder shrink-0" />
                  <span className="text-xs text-secondary">{hearing.judgePresent}</span>
                </div>
              )}
            </div>
          )}

          {hearing.notes && (
            <p className="text-xs text-placeholder pl-2.5 border-l-2 border-amber italic">
              {hearing.notes}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-amber/30">
        <Button size="sm" onClick={onMarkHeard}>
          <Check className="size-3.5" /> Mark heard
        </Button>
        <Button size="sm" variant="secondary" onClick={onAdjourn}>
          <CornerDownRight className="size-3.5" /> Adjourn
        </Button>
        <Button size="sm" variant="secondary" onClick={onMarkMissed}>
          <X className="size-3.5" /> Mark missed
        </Button>
        <Button size="sm" variant="secondary" onClick={onEdit}>
          <Pencil className="size-3.5" /> Edit
        </Button>
      </div>
    </div>
  );
}
