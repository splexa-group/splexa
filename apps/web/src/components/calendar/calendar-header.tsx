"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({ year, month, onPrev, onNext, onToday }: Props) {
  const label = format(new Date(year, month, 1), "MMMM yyyy");

  return (
    <div className="calendar-header">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="calendar-nav-btn"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="calendar-month-label">{label}</span>
        <button
          type="button"
          onClick={onNext}
          className="calendar-nav-btn"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={onToday}
        className="calendar-today-btn"
        aria-label="Go to today"
      >
        <span className="hidden sm:inline">Today</span>
        <CalendarDays className="size-4 sm:hidden" aria-hidden="true" />
      </button>
    </div>
  );
}
