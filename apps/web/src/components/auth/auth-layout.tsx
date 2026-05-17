import { type ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

interface AuthLayoutProps {
  leftPanel: ReactNode;
  children: ReactNode;
  leftWidthClass?: string;
}

export function AuthLayout({ leftPanel, children, leftWidthClass = "md:w-[65%]" }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div
        className={`hidden md:flex ${leftWidthClass} flex-col`}
        style={{ background: "linear-gradient(160deg, var(--surface-dark) 0%, var(--brand-dark) 100%)" }}
      >
        {leftPanel}
      </div>

      {/* Right form panel — full width on mobile, remaining width on md+ */}
      <div className="flex-1 bg-card flex flex-col">
        {/* Mobile compact header */}
        <div
          className="md:hidden flex items-center px-5 h-12 shrink-0"
          style={{ background: "linear-gradient(160deg, var(--surface-dark) 0%, var(--brand-dark) 100%)" }}
        >
          <Logo size="sm" variant="white" />
        </div>

        {/* Centered form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-[360px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
