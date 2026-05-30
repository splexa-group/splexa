"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseRowMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onViewClient: () => void;
}

export function CaseRowMenu({ onEdit, onDelete, onViewClient }: CaseRowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className="p-1.5 rounded-md text-placeholder hover:text-secondary hover:bg-subtle transition-colors"
        aria-label="Case actions"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 bg-card border border-line rounded-lg shadow-md py-1">
          {[
            { icon: Pencil, label: "Edit", action: onEdit },
            { icon: User, label: "View client", action: onViewClient },
            { icon: Trash2, label: "Delete", action: onDelete, danger: true },
          ].map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); action(); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors",
                danger
                  ? "text-negative hover:bg-negative-muted"
                  : "text-label hover:bg-subtle",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
