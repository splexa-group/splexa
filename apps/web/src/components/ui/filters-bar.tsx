"use client";

import * as React from "react";
import { cn } from "@/utils/tailwind";

interface FiltersBarProps {
  columns: string;
  children: React.ReactNode;
  className?: string;
}

export function FiltersBar({ columns, children, className }: FiltersBarProps) {
  return (
    <div
      className={cn("pt-5 pb-6 px-4 md:px-6 grid gap-2 items-center", className)}
      style={{ gridTemplateColumns: columns }}
    >
      {children}
    </div>
  );
}
