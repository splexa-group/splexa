import { type ReactNode } from "react";

interface AuthLayoutProps {
  leftPanel: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ leftPanel, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — 40%, hidden below md */}
      <div
        className="hidden md:flex md:w-2/5 flex-col"
        style={{
          background: "linear-gradient(160deg, #0c1445 0%, #1e3a8a 100%)",
        }}
      >
        {leftPanel}
      </div>

      {/* Right form panel — full width on mobile, 60% on md+ */}
      <div className="flex-1 md:w-3/5 bg-white flex flex-col">
        {/* Mobile compact header */}
        <div
          className="md:hidden flex items-center px-5 h-12 shrink-0"
          style={{
            background: "linear-gradient(160deg, #0c1445 0%, #1e3a8a 100%)",
          }}
        >
          <span className="text-white font-bold text-base">⚖ Splexa</span>
        </div>

        {/* Centered form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
