"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  (
    { label, hint, error, className, id: explicitId, required, ...props },
    ref,
  ) => {
    const autoId = React.useId();
    const id = explicitId ?? autoId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-md font-medium text-label">
            {label}
            {required && <span className="text-negative ml-0.5">*</span>}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          className={cn(
            "w-full rounded-md border border-line bg-card px-3 py-[9px] text-sm text-dark placeholder:text-placeholder transition-colors",
            "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
            error &&
              "border-negative focus-visible:border-negative focus-visible:ring-negative/20",
            "disabled:bg-subtle disabled:text-disabled disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-secondary">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="text-xs text-negative">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Field.displayName = "Field";

export interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

const InputGroup = React.forwardRef<HTMLInputElement, InputGroupProps>(
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
          className="block text-[13.5px] font-medium text-label/90 leading-none mb-1.5"
        >
          {label}
          {required && <span className="text-negative ml-0.5">*</span>}
        </label>
        <input
          id={id}
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
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

export { Field, InputGroup };
