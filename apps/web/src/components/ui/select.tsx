"use client";

import { useId } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Select ──────────────────────────────────────────────────────────────────
// Standalone select with its own border.

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function Select({ options, value, onChange, placeholder = "Select…", disabled, className }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-line bg-card px-3 py-[9px] text-sm text-dark transition-colors [&>span]:line-clamp-1",
          "focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
          "data-[placeholder]:text-placeholder",
          "disabled:bg-subtle disabled:text-disabled disabled:cursor-not-allowed",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="size-4 text-placeholder shrink-0" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectDropdown options={options} />
    </SelectPrimitive.Root>
  );
}

// ─── SelectGroup ─────────────────────────────────────────────────────────────
// One bordered box: dim label on top, bare select trigger below.
// Pass select props directly — no children.

export interface SelectGroupProps {
  label: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

function SelectGroup({
  label, options, value, onChange, placeholder = "Select…",
  disabled, hint, error, required, className,
}: SelectGroupProps) {
  const id = useId();

  return (
    <div
      className={cn(
        "rounded-md border bg-card px-3 pt-2 pb-2.5 transition-colors",
        error
          ? "border-negative focus-within:ring-2 focus-within:ring-negative/20"
          : "border-line focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20",
        className
      )}
    >
      <p id={id} className="text-xs font-medium text-secondary leading-none mb-1">
        {label}
        {required && <span className="text-negative ml-0.5">*</span>}
      </p>
      <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          aria-labelledby={id}
          className="flex w-full items-center justify-between bg-transparent text-sm text-dark [&>span]:line-clamp-1 focus:outline-none data-[placeholder]:text-placeholder disabled:text-disabled disabled:cursor-not-allowed"
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDownIcon className="size-4 text-placeholder shrink-0" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectDropdown options={options} />
      </SelectPrimitive.Root>
      {!error && hint && <p className="mt-1.5 text-xs text-secondary">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-negative">{error}</p>}
    </div>
  );
}

// ─── Shared dropdown ─────────────────────────────────────────────────────────

function SelectDropdown({ options }: { options: SelectOption[] }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        className={cn(
          "relative z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden",
          "rounded-md border border-line bg-card shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1"
        )}
      >
        <SelectPrimitive.Viewport>
          {options.map((opt) => (
            <SelectPrimitive.Item
              key={opt.value}
              value={opt.value}
              className={cn(
                "relative flex w-full cursor-default select-none items-center px-3 py-2.5 text-sm text-dark outline-none",
                "border-b border-line last:border-b-0",
                "data-[highlighted]:bg-subtle",
                "data-[state=checked]:bg-brand-soft data-[state=checked]:text-brand data-[state=checked]:font-medium",
                "data-[disabled]:pointer-events-none data-[disabled]:text-disabled"
              )}
            >
              <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
            </SelectPrimitive.Item>
          ))}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export { Select, SelectGroup };
