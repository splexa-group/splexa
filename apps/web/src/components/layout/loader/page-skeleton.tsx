"use client";

import { useContext } from "react";
import { PageLoadingContext } from "./page-loading-context";

export function PageSkeleton() {
  const ctx = useContext(PageLoadingContext);
  if (!ctx?.isLoading) return null;

  return (
    <div className="absolute inset-0 bg-page z-20 flex flex-col items-center justify-center gap-3">
      <div className="h-11 w-11 rounded-full border-4 border-line border-t-brand animate-spin" />
      <p className="text-sm font-medium text-brand tracking-wide">{ctx.message}</p>
    </div>
  );
}
