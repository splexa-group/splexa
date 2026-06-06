"use client";

import { useState, useRef, useEffect, useId } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface DatePickerProps {
  label: string;
  value?: string; // YYYY-MM-DD
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function formatDisplay(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date...",
  required,
  error,
  hint,
  disabled,
  id: explicitId,
  className,
}: DatePickerProps) {
  const autoId = useId();
  const id = explicitId ?? autoId;
  const wrapperRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [viewYear, setViewYear] = useState(
    value ? parseInt(value.split("-")[0]) : today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    value ? parseInt(value.split("-")[1]) - 1 : today.getMonth(),
  );
  const [prevValue, setPrevValue] = useState(value);

  // Sync view when value changes — synchronous during render, not in useEffect
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      setViewYear(parseInt(value.split("-")[0]));
      setViewMonth(parseInt(value.split("-")[1]) - 1);
    }
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setShowYearPicker(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  // Build calendar grid
  const prevMonthDays = daysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  );
  const currentMonthDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);

  const cells: { day: number; current: boolean }[] = [];
  for (let i = startDay - 1; i >= 0; i--)
    cells.push({ day: prevMonthDays - i, current: false });
  for (let d = 1; d <= currentMonthDays; d++)
    cells.push({ day: d, current: true });
  while (cells.length % 7 !== 0)
    cells.push({
      day: cells.length - currentMonthDays - startDay + 1,
      current: false,
    });

  function selectDay(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange?.(`${viewYear}-${m}-${d}`);
    setOpen(false);
    setShowYearPicker(false);
  }

  function isSelected(day: number) {
    if (!value) return false;
    const [sy, sm, sd] = value.split("-");
    return (
      parseInt(sy) === viewYear &&
      parseInt(sm) - 1 === viewMonth &&
      parseInt(sd) === day
    );
  }

  function isToday(day: number) {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  }

  const years = Array.from({ length: 30 }, (_, i) => viewYear - 10 + i);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {/* Trigger */}
      <div
        onClick={() => {
          if (disabled) return;
          if (!open && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const POPUP_HEIGHT = 360;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            setDropUp(spaceBelow < POPUP_HEIGHT && spaceAbove > spaceBelow);
          }
          setOpen((p) => !p);
        }}
        className={cn(
          "rounded-sm border bg-card px-3.5 pt-4.5 pb-3.5 transition-colors",
          error
            ? "border-negative focus-within:ring-1 focus-within:ring-negative/30"
            : open
              ? "border-brand ring-1 ring-brand/30"
              : "border-line hover:border-brand/40",
          disabled
            ? "bg-subtle opacity-60 cursor-not-allowed"
            : "cursor-pointer",
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
            {value ? formatDisplay(value) : placeholder}
          </span>
          <CalendarDays className="size-4 text-label shrink-0" />
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-negative">{error}</p>}
      {!error && hint && (
        <p className="mt-1.5 text-xs text-secondary">{hint}</p>
      )}

      {/* Calendar — absolute, 288px, flips up when space below is insufficient */}
      {open && (
        <div
          className={cn(
            "absolute right-0 w-68 z-20 bg-card border border-line rounded-xl shadow-xl overflow-hidden select-none",
            dropUp ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {/* Header */}
          <div className="bg-brand px-4 pt-3 pb-3">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-medium text-white uppercase tracking-wider">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={() => setShowYearPicker((p) => !p)}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-colors"
              >
                {viewYear}
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    showYearPicker && "rotate-180",
                  )}
                />
              </button>
            </div>
            {/* Day-of-week headers inside brand header */}
            <div className="grid grid-cols-7">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-white/90 py-0.5"
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          {showYearPicker ? (
            <div className="grid grid-cols-4 gap-1 p-3 max-h-52 overflow-y-auto">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setViewYear(y);
                    setShowYearPicker(false);
                  }}
                  className={cn(
                    "py-1.5 rounded-md text-sm font-medium transition-colors",
                    y === viewYear
                      ? "bg-brand text-white"
                      : "hover:bg-subtle text-label",
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3">
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  const sel = cell.current && isSelected(cell.day);
                  const tod = cell.current && isToday(cell.day);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!cell.current}
                      onClick={() => cell.current && selectDay(cell.day)}
                      className={cn(
                        "h-9.5 w-full rounded-md text-sm transition-colors",
                        !cell.current && "text-placeholder/30 cursor-default",
                        cell.current &&
                          !sel &&
                          !tod &&
                          "font-medium text-label hover:bg-subtle",
                        tod && !sel && "font-bold text-brand",
                        sel && "bg-brand text-white font-semibold",
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
