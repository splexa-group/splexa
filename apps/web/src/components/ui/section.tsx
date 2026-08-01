"use client";

import { cn } from "@/utils/tailwind";
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
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-stretch rounded overflow-hidden">
        <div className="flex-1 bg-brand/5 px-4 py-2.5">
          <h3 className="text-sm font-medium text-brand">{title}</h3>
        </div>
        {action && !isEmpty && (
          <div className=" border-brand/15 px-3 flex items-center justify-center shrink-0">
            {action}
          </div>
        )}
      </div>

      {isEmpty ? (
        <EmptyState
          text={emptyLabel ?? `No ${title.toLowerCase()} added.`}
          action={onAdd ? { label: addLabel, onClick: onAdd } : undefined}
          className="py-6"
        />
      ) : (
        <div className={cn("px-1", cols && cn("grid grid-cols-1 gap-4", mdColsClass[cols]))}>
          {children}
        </div>
      )}
    </div>
  );
}
