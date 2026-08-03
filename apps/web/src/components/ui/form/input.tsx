"use client";

import * as React from "react";
import { cn } from "@/utils/tailwind";

export interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

const InputGroup = React.forwardRef<HTMLInputElement, InputGroupProps>(
  ({ label, hint, error, className, id: explicitId, required, ...inputProps }, ref) => {
    const autoId = React.useId();
    const id = explicitId ?? autoId;

    return (
      <div
        className={cn(
          "rounded border px-3.5 pt-4.5 pb-3.5 transition-colors",
          inputProps.disabled || inputProps.readOnly ? "bg-subtle" : "bg-card",
          error
            ? "border-negative focus-within:ring-1 focus-within:ring-negative/30"
            : "border-line focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30",
          className,
        )}
      >
        <label
          htmlFor={id}
          className="block text-[13px] font-medium text-label/70 leading-none mb-1.5"
        >
          {label}
          {required && <span className="text-negative ml-0.5">*</span>}
        </label>
        <input
          id={id}
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="w-full bg-transparent font-medium text-sm text-dark placeholder:text-placeholder focus:outline-none disabled:text-disabled disabled:cursor-not-allowed"
          {...inputProps}
        />
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

InputGroup.displayName = "InputGroup";

export { InputGroup };
