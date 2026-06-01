"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { ReactNode } from "react";

type GridCols = 1 | 2 | 3 | 4;

const mdColsClass: Record<GridCols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

interface Props {
  title: string;
  cols?: GridCols;
  action?: ReactNode;
  isEmpty?: boolean;
  emptyLabel?: string;
  onAdd?: () => void;
  addLabel?: string;
  children?: ReactNode;
  className?: string;
}

export function Section({
  title,
  cols,
  action,
  isEmpty,
  emptyLabel,
  onAdd,
  addLabel = "Add",
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "w-full bg-card border border-line rounded-xl",
        className,
      )}
    >
      <div className="bg-placeholder/15 rounded-t-xl px-4 h-11 shrink-0 border-b border-line flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">
          {title}
        </h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {isEmpty ? (
        <EmptyState
          text={emptyLabel ?? `No ${title.toLowerCase()} added.`}
          action={onAdd ? { label: addLabel, onClick: onAdd } : undefined}
        />
      ) : (
        <div
          className={cn(
            "p-4",
            cols && cn("grid grid-cols-1 gap-4", mdColsClass[cols]),
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
