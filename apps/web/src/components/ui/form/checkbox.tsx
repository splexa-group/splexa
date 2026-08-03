"use client";

import * as React from "react";
import { cn } from "@/utils/tailwind";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  label: string;
  hint?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, checked, onChange, disabled, className, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className={cn(
            "mt-0.5 size-4 shrink-0 rounded border border-line bg-card accent-brand cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
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
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
