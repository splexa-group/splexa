"use client";

import { type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Logo } from "@/components/ui/logo";

export function AppLoader({ children }: { children: ReactNode }) {
  const isReady = useAuthStore((s) => s.isReady);

  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-page flex items-center justify-center z-50 animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-7">
          <div className="relative flex items-center justify-center size-20">
            <span className="absolute inset-0 rounded-full bg-brand/10 animate-[breathe_2.4s_ease-in-out_infinite]" />
            <Logo variant="brandDark" size="xl" showName={false} />
          </div>
          <div className="w-44 h-1 rounded-full bg-brand/15 overflow-hidden">
            <div className="h-full w-2/5 bg-brand rounded-full animate-[shimmer_1.3s_ease-in-out_infinite]" />
          </div>
          <p className="text-xs text-secondary animate-pulse tracking-wide">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
