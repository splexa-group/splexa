import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ContentWidth = "sm" | "md" | "lg" | "xl";

const widthClass: Record<ContentWidth, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

interface PageContentProps {
  width?: ContentWidth;
  children: ReactNode;
  className?: string;
}

export function PageContent({
  width = "lg",
  children,
  className,
}: PageContentProps) {
  return (
    <div className={cn("mx-auto w-full py-6", widthClass[width], className)}>
      {children}
    </div>
  );
}
