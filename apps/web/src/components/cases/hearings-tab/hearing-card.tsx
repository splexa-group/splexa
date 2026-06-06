"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Hearing } from "@/types/hearings";
import { HearingStatus } from "@splexa-group/shared/enums";

const STATUS_STYLES: Record<HearingStatus, { dot: string; text: string; badge: string }> = {
  [HearingStatus.Scheduled]: {
    dot: "bg-amber",
    text: "text-amber-dark",
    badge: "bg-amber-muted",
  },
  [HearingStatus.Completed]: {
    dot: "bg-secondary",
    text: "text-secondary",
    badge: "bg-subtle",
  },
  [HearingStatus.Adjourned]: {
    dot: "bg-brand",
    text: "text-brand",
    badge: "bg-brand-soft",
  },
  [HearingStatus.Cancelled]: {
    dot: "bg-negative",
    text: "text-negative",
    badge: "bg-negative-muted",
  },
};

interface HearingCardProps {
  hearing: Hearing;
  courtName?: string | null;
  benchNumber?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  faded?: boolean;
}

export function HearingCard({
  hearing,
  courtName,
  benchNumber,
  onEdit,
  onDelete,
  faded,
}: HearingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const styles = STATUS_STYLES[hearing.status];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const date = new Date(hearing.date);
  const day = date.toLocaleDateString("en-IN", { day: "2-digit" });
  const month = date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  const year = date.getFullYear();

  const purposeLabel = hearing.purpose
    ? hearing.purpose.replace(/([A-Z])/g, " $1").trim()
    : "Hearing";

  const courtInfo = [courtName, benchNumber ? `Court No. ${benchNumber}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "flex items-stretch bg-card border border-line rounded overflow-hidden",
        faded && "opacity-40",
      )}
    >
      {/* Date block */}
      <div className="flex flex-col items-center justify-center px-4 py-3 min-w-[68px] border-r border-line bg-subtle/40">
        <span className="text-2xl font-bold text-brand leading-none">{day}</span>
        <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mt-1">
          {month}
        </span>
        <span className="text-[10px] text-placeholder">{year}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-between gap-3 px-4 py-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dark truncate">{purposeLabel}</p>
          {courtInfo && (
            <p className="text-xs text-secondary mt-0.5 truncate">{courtInfo}</p>
          )}
          {hearing.notes && (
            <p className="text-xs text-placeholder mt-1 truncate">{hearing.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
              styles.badge,
              styles.text,
            )}
          >
            <span className={cn("size-1.5 rounded-full", styles.dot)} />
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
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-label hover:bg-subtle"
                >
                  <Pencil className="size-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
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
