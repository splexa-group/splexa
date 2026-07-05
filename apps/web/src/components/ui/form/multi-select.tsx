"use client";

import { useState, useId } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDownIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectGroupProps {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export function MultiSelectGroup({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled,
  required,
  error,
  className,
}: MultiSelectGroupProps) {
  const id = useId();
  // Internal key trick: reset Radix Select to placeholder after each pick
  const [selectKey, setSelectKey] = useState(0);

  const remaining = options.filter((o) => !value.includes(o.value));

  function handleAdd(v: string) {
    onChange([...value, v]);
    setSelectKey((k) => k + 1);
  }

  function handleRemove(v: string) {
    onChange(value.filter((x) => x !== v));
  }

  function labelFor(v: string) {
    return options.find((o) => o.value === v)?.label ?? v;
  }

  return (
    <div
      className={cn(
        "rounded border bg-card px-3 pt-3 pb-2.5 transition-colors",
        error
          ? "border-negative focus-within:ring-1 focus-within:ring-negative/30"
          : "border-line focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30",
        className,
      )}
    >
      <p id={id} className="text-sm font-medium text-secondary leading-none mb-2">
        {label}
        {required && <span className="text-negative ml-0.5">*</span>}
      </p>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-soft text-brand border border-brand/20"
            >
              {labelFor(v)}
              <button
                type="button"
                onClick={() => handleRemove(v)}
                disabled={disabled}
                className="ml-0.5 hover:text-brand-dark disabled:cursor-not-allowed"
                aria-label={`Remove ${labelFor(v)}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <SelectPrimitive.Root
        key={selectKey}
        onValueChange={handleAdd}
        disabled={disabled || remaining.length === 0}
      >
        <SelectPrimitive.Trigger
          aria-labelledby={id}
          className="flex w-full items-center justify-between bg-transparent text-sm focus:outline-none data-[placeholder]:text-placeholder disabled:text-disabled disabled:cursor-not-allowed"
        >
          <SelectPrimitive.Value placeholder={remaining.length === 0 ? "All selected" : placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDownIcon className="size-4 text-placeholder shrink-0" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            className={cn(
              "relative z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden",
              "rounded border border-line bg-card shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
            )}
          >
            <SelectPrimitive.Viewport>
              {remaining.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center px-3 py-2.5 text-sm text-dark outline-none",
                    "border-b border-line last:border-b-0",
                    "data-[highlighted]:bg-subtle",
                  )}
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && <p className="mt-1.5 text-xs text-negative">{error}</p>}
    </div>
  );
}
