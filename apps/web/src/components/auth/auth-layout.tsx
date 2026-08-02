import { type ReactNode } from "react";

interface AuthLayoutProps {
  leftPanel: ReactNode;
  children: ReactNode;
  leftWidthClass?: string;
  formMaxWidth?: number;
}

export function AuthLayout({
  leftPanel,
  children,
  leftWidthClass = "md:w-[50%]",
  formMaxWidth = 380,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div
        className={`hidden md:flex ${leftWidthClass} flex-col bg-linear-[160deg] from-surface-dark to-brand-dark`}
      >
        {leftPanel}
      </div>

      <div className="flex-1 bg-card flex flex-col">
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full" style={{ maxWidth: formMaxWidth }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
