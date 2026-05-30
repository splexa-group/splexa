"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateInputGroupProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
  error?: string;
}

const DateInputGroup = React.forwardRef<HTMLInputElement, DateInputGroupProps>(
  (
    { label, hint, error, className, id: explicitId, required, ...inputProps },
    ref,
  ) => {
    const autoId = React.useId();
    const id = explicitId ?? autoId;

    return (
      <div
        className={cn(
          "rounded-md border bg-card px-3 pt-3 pb-2.5 transition-colors",
          error
            ? "border-negative focus-within:ring-1 focus-within:ring-negative/30"
            : "border-line focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30",
          className,
        )}
      >
        <label
          htmlFor={id}
          className="block text-[13.5px] font-medium text-label leading-none mb-1.5"
        >
          {label}
          {required && <span className="text-negative ml-0.5">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={id}
            ref={ref}
            type="date"
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${id}-error` : hint ? `${id}-hint` : undefined
            }
            className={cn(
              "flex-1 bg-transparent font-medium text-sm text-dark focus:outline-none",
              "disabled:text-disabled disabled:cursor-not-allowed",
              "[color-scheme:light]",
            )}
            {...inputProps}
          />
          <CalendarDays className="size-4 text-placeholder shrink-0 pointer-events-none" />
        </div>
        {!error && hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-secondary">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-xs text-negative">
            {error}
          </p>
        )}
      </div>
    );
  },
);

DateInputGroup.displayName = "DateInputGroup";

export { DateInputGroup };
