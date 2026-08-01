"use client";

import * as React from "react";
import { cn } from "@/utils/tailwind";

export interface ToggleProps {
  label: string;
  hint?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

function Toggle({ label, hint, checked = false, onChange, disabled, className }: ToggleProps) {
  const id = React.useId();

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium text-label cursor-pointer",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {label}
        </label>
        {hint && <p className="text-xs text-secondary">{hint}</p>}
      </div>

      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20",
          checked ? "bg-brand" : "bg-line",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

export { Toggle };
