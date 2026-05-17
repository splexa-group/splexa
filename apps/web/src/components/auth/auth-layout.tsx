import { type ReactNode } from "react";

interface AuthLayoutProps {
  leftPanel: ReactNode;
  children: ReactNode;
  leftWidthClass?: string;
}

export function AuthLayout({
  leftPanel,
  children,
  leftWidthClass = "md:w-[50%]",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div
        className={`hidden md:flex ${leftWidthClass} flex-col`}
        style={{
          background:
            "linear-gradient(160deg, var(--surface-dark) 0%, var(--brand-dark) 100%)",
        }}
      >
        {leftPanel}
      </div>

      <div className="flex-1 bg-card flex flex-col">
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-[360px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
