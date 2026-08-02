"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Clock } from "lucide-react";
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

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0–59
const PERIODS: Period[] = ["AM", "PM"];

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

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {/* Trigger */}
      <div
        onClick={() => {
          if (disabled) return;
          if (!open && value) {
            const p = from24Hour(value);
            setHour12(p.hour12);
            setMinute(p.minute);
            setPeriod(p.period);
          }
          if (!open && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const POPUP_HEIGHT = 232;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            setDropUp(spaceBelow < POPUP_HEIGHT && spaceAbove > spaceBelow);
          }
          setOpen((p) => !p);
        }}
        className={cn(
          "rounded border bg-card px-3.5 pt-4.5 pb-3.5 transition-colors",
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

      {/* Picker — absolute, 224px, flips up when space below is insufficient */}
      {open && (
        <div
          className={cn(
            "absolute right-0 w-56 z-20 bg-card border border-line rounded shadow-xl overflow-hidden select-none",
            dropUp ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {/* Header */}
          <div className="bg-brand px-4 py-3 text-center">
            <span className="text-sm font-semibold text-white tracking-wider">
              {String(hour12).padStart(2, "0")}:{String(minute).padStart(2, "0")} {period}
            </span>
          </div>

          <div className="grid grid-cols-3 divide-x divide-line">
            <div className="max-h-44 overflow-y-auto py-1">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => commit(h, minute, period)}
                  className={cn(
                    "w-full py-1.5 text-sm transition-colors",
                    h === hour12
                      ? "bg-brand text-white font-semibold"
                      : "text-label hover:bg-subtle",
                  )}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="max-h-44 overflow-y-auto py-1">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => commit(hour12, m, period)}
                  className={cn(
                    "w-full py-1.5 text-sm transition-colors",
                    m === minute
                      ? "bg-brand text-white font-semibold"
                      : "text-label hover:bg-subtle",
                  )}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="py-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => commit(hour12, minute, p)}
                  className={cn(
                    "w-full py-1.5 text-sm transition-colors",
                    p === period
                      ? "bg-brand text-white font-semibold"
                      : "text-label hover:bg-subtle",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 border-t border-line">
            <Button size="sm" className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
