"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, className, id: explicitId, required, ...props }, ref) => {
    const autoId = React.useId();
    const id = explicitId ?? autoId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-label/90">
            {label}
            {required && <span className="text-negative ml-0.5">*</span>}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            "w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm text-dark placeholder:text-placeholder placeholder:text-[13.5px] placeholder:font-medium transition-colors resize-none",
            "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
            error && "border-negative focus-visible:border-negative focus-visible:ring-negative/20",
            "disabled:bg-subtle disabled:text-disabled disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-secondary">{hint}</p>
        )}
        {error && (
          <p id={`${id}-error`} className="text-xs text-negative">{error}</p>
        )}
      </div>
    );
  },
);

TextareaField.displayName = "TextareaField";
export { TextareaField };
