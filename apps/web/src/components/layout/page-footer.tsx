import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageFooterProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function PageFooter({ left, right, className }: PageFooterProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 h-[60px] bg-card border-t border-line",
        "flex items-center justify-between px-6",
        className,
      )}
    >
      <div>{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
