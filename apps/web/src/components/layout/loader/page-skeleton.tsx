"use client";

import { useContext } from "react";
import { PageLoadingContext } from "./page-loading-context";

export function PageSkeleton() {
  const ctx = useContext(PageLoadingContext);
  if (!ctx?.isLoading) return null;

  return (
    <div className="absolute inset-0 bg-page z-20 flex flex-col gap-4 px-6 py-6 pointer-events-none">
      <div className="h-7 w-48 rounded-lg bg-subtle animate-pulse" />
      <div className="flex flex-col gap-3 mt-2">
        <div className="h-4 w-full rounded bg-subtle animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-subtle animate-pulse" />
        <div className="h-4 w-4/6 rounded bg-subtle animate-pulse" />
      </div>
      <div className="flex flex-col gap-3 mt-4">
        <div className="h-4 w-full rounded bg-subtle animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-subtle animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-subtle animate-pulse" />
      </div>
    </div>
  );
}
