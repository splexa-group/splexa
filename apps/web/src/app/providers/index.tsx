"use client";

import { QueryProvider } from "./query-provider";
import { ToastProvider } from "./toast-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <ToastProvider />
    </QueryProvider>
  );
}
