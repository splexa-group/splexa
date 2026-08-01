"use client";

import { useId } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { cn } from "@/utils/tailwind";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function Select({
  options,
  value,
  onChange,
  onClear,
  placeholder = "Select...",
  disabled,
  className,
}: SelectProps) {
  const showClear = !!(value && onClear);

  return (
    <div className="relative">
      <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          className={cn(
            "flex w-full items-center justify-between rounded border border-line bg-card px-3.5 py-[9px] text-sm text-dark transition-colors [&>span]:line-clamp-1",
            "focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
            "data-[placeholder]:text-placeholder",
            "disabled:bg-subtle disabled:text-disabled disabled:cursor-not-allowed",
            showClear && "pr-9",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          {!showClear && (
            <SelectPrimitive.Icon asChild>
              <ChevronDownIcon className="size-4 text-placeholder shrink-0" />
            </SelectPrimitive.Icon>
          )}
        </SelectPrimitive.Trigger>
        <SelectDropdown options={options} />
      </SelectPrimitive.Root>
      {showClear && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-placeholder hover:text-secondary transition-colors"
          aria-label="Clear"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

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
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled,
  hint,
  error,
  required,
  className,
}: SelectGroupProps) {
  const id = useId();

  return (
    <div
      className={cn(
        "rounded border bg-card px-3.5 pt-4.5 pb-3.5 transition-colors",
        error
          ? "border-negative focus-within:ring-1 focus-within:ring-negative/30"
          : "border-line focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30",
        className,
      )}
    >
      <p id={id} className="text-[13px] font-medium text-label/70 leading-none mb-1.5">
        {label}
        {required && <span className="text-negative ml-0.5">*</span>}
      </p>
      <SelectPrimitive.Root
        value={!value ? "__none__" : value}
        onValueChange={(v) => onChange?.(v === "__none__" ? "" : v)}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          aria-labelledby={id}
          className="flex w-full items-center justify-between bg-transparent font-medium text-sm focus:outline-none disabled:text-disabled disabled:cursor-not-allowed"
        >
          <span
            className={cn("flex-1 text-left truncate", value ? "text-dark" : "text-placeholder")}
          >
            {value ? (options.find((o) => o.value === value)?.label ?? placeholder) : placeholder}
          </span>
          <ChevronDownIcon className="size-4 text-placeholder shrink-0" />
        </SelectPrimitive.Trigger>
        <SelectDropdown options={options} showNone />
      </SelectPrimitive.Root>
      {!error && hint && <p className="mt-1.5 text-xs text-secondary">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-negative">{error}</p>}
    </div>
  );
}

function SelectDropdown({ options, showNone }: { options: SelectOption[]; showNone?: boolean }) {
  const itemClass = cn(
    "relative flex w-full cursor-default select-none items-center px-3 py-2.5 text-sm text-dark outline-none",
    "data-[highlighted]:bg-subtle",
    "data-[state=checked]:bg-brand-soft data-[state=checked]:text-brand",
    "data-[disabled]:pointer-events-none data-[disabled]:text-disabled",
  );

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={15}
        alignOffset={-14}
        className={cn(
          "relative z-50 max-h-72 w-[calc(var(--radix-select-trigger-width)+1.75rem)] overflow-hidden",
          "rounded border border-line bg-card shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        )}
      >
        <SelectPrimitive.Viewport>
          {showNone && (
            <SelectPrimitive.Item value="__none__" className={itemClass}>
              <SelectPrimitive.ItemText>None</SelectPrimitive.ItemText>
            </SelectPrimitive.Item>
          )}
          {options.map((opt) => (
            <SelectPrimitive.Item key={opt.value} value={opt.value} className={itemClass}>
              <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
            </SelectPrimitive.Item>
          ))}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export { Select, SelectGroup };
