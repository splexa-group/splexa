"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GridCols = 1 | 2 | 3 | 4;

const mdColsClass: Record<GridCols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

interface SectionProps {
  title: string;
  cols?: GridCols;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({
  title,
  cols,
  action,
  children,
  className,
}: SectionProps) {
  return (
    <div
      className={cn(
        "w-full bg-card border border-line rounded-xl overflow-hidden",
        className,
      )}
    >
      <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-brand">{title}</h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div
        className={cn(
          "p-4",
          cols && cn("grid grid-cols-1 gap-4", mdColsClass[cols]),
        )}
      >
        {children}
      </div>
    </div>
  );
}
