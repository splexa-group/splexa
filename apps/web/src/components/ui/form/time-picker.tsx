"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { cn } from "@/utils/tailwind";
import { Button } from "@/components/ui/button";

export interface TimePickerProps {
  label: string;
  value?: string; // HH:mm, 24-hour
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

type Period = "AM" | "PM";

function to24Hour(hour12: number, minute: number, period: Period): string {
  const h = period === "PM" ? (hour12 % 12) + 12 : hour12 % 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function from24Hour(value: string): { hour12: number; minute: number; period: Period } {
  const [h, m] = value.split(":").map(Number);
  const period: Period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: m, period };
}

export function formatTime12Hour(value: string): string {
  const { hour12, minute, period } = from24Hour(value);
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

export function TimePicker({
  label,
  value,
  onChange,
  placeholder = "Select time...",
  required,
  error,
  hint,
  disabled,
  id: explicitId,
  className,
}: TimePickerProps) {
  const autoId = useId();
  const id = explicitId ?? autoId;
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);

  const parsed = value ? from24Hour(value) : null;
  const [hour12, setHour12] = useState(parsed?.hour12 ?? 12);
  const [minute, setMinute] = useState(parsed?.minute ?? 0);
  const [period, setPeriod] = useState<Period>(parsed?.period ?? "AM");

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function commit(nextHour: number, nextMinute: number, nextPeriod: Period) {
    setHour12(nextHour);
    setMinute(nextMinute);
    setPeriod(nextPeriod);
    onChange?.(to24Hour(nextHour, nextMinute, nextPeriod));
  }

  function toggleOpen() {
    if (disabled) return;
    if (!open && value) {
      const p = from24Hour(value);
      setHour12(p.hour12);
      setMinute(p.minute);
      setPeriod(p.period);
    }
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const POPUP_HEIGHT = 160;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropUp(spaceBelow < POPUP_HEIGHT && spaceAbove > spaceBelow);
    }
    setOpen((p) => !p);
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          }
        }}
        className={cn(
          "rounded border bg-card px-3.5 pt-4.5 pb-3.5 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          error
            ? "border-negative focus-within:ring-1 focus-within:ring-negative/30"
            : open
              ? "border-brand ring-1 ring-brand/30"
              : "border-line hover:border-brand/40",
          disabled ? "bg-subtle opacity-60 cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <label
          htmlFor={id}
          className="block text-[13px] font-medium text-label/70 leading-none mb-1.5 cursor-pointer"
        >
          {label}
          {required && <span className="text-negative ml-0.5">*</span>}
        </label>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm font-normal flex-1",
              value ? "text-dark font-medium" : "text-placeholder",
            )}
          >
            {value ? formatTime12Hour(value) : placeholder}
          </span>
          <Clock className="size-4 text-label shrink-0" />
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-negative">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-secondary">{hint}</p>}

      {/* Picker — absolute, compact stepper, flips up when space below is insufficient */}
      {open && (
        <div
          className={cn(
            "absolute right-0 w-52 z-20 bg-card border border-line rounded shadow-xl select-none p-4",
            dropUp ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <TimeStepper
              value={hour12}
              min={1}
              max={12}
              onChange={(v) => commit(v, minute, period)}
              onIncrement={() => commit(hour12 === 12 ? 1 : hour12 + 1, minute, period)}
              onDecrement={() => commit(hour12 === 1 ? 12 : hour12 - 1, minute, period)}
            />
            <span className="text-xl font-bold text-dark pb-3">:</span>
            <TimeStepper
              value={minute}
              min={0}
              max={59}
              onChange={(v) => commit(hour12, v, period)}
              onIncrement={() => commit(hour12, minute === 59 ? 0 : minute + 1, period)}
              onDecrement={() => commit(hour12, minute === 0 ? 59 : minute - 1, period)}
            />

            <div className="flex flex-col gap-1 pb-3">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => commit(hour12, minute, p)}
                  className={cn(
                    "px-2 py-1 rounded text-[11px] font-semibold transition-colors",
                    p === period ? "bg-brand text-white" : "bg-subtle text-label hover:bg-line",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <Button size="sm" className="w-full mt-3" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

interface TimeStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

// Typing the number directly is the primary path — clicking +1/-1 sixty
// times to reach a target minute is not a real interaction. The chevrons
// stay only for quick nudges once close to the target.
function TimeStepper({ value, min, max, onChange, onIncrement, onDecrement }: TimeStepperProps) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Increase"
        className="p-1 text-label hover:text-brand transition-colors"
      >
        <ChevronUp className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={String(value).padStart(2, "0")}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          if (e.target.value === "") return;
          const v = Number(e.target.value);
          if (Number.isNaN(v)) return;
          onChange(Math.min(max, Math.max(min, v)));
        }}
        className="text-xl font-bold text-dark tabular-nums w-11 text-center py-0.5 bg-transparent outline-none [appearance:textfield]"
      />
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Decrease"
        className="p-1 text-label hover:text-brand transition-colors"
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}
