import { type ReactNode } from "react";
import { cn } from "@/utils/tailwind";

type PageMaxWidth = "small" | "medium" | "large" | "full";

const pageMaxWidthClass: Record<PageMaxWidth, string> = {
  small: "max-w-xl",
  medium: "max-w-2xl",
  large: "max-w-6xl",
  full: "",
};

interface PageLayoutProps {
  maxWidth?: PageMaxWidth;
  // false when the content already owns its own gutter (a FiltersBar + DataTable pair) —
  // PageLayout then only contributes the max-width cap
  padded?: boolean;
  children: ReactNode;
  className?: string;
}

export function PageLayout({
  maxWidth = "medium",
  padded = true,
  children,
  className,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        "page-layout",
        pageMaxWidthClass[maxWidth],
        padded && "page-layout--padded",
        className,
      )}
    >
      {children}
    </div>
  );
}
