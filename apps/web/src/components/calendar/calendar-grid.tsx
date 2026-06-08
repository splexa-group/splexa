"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { getGridDays, toDateKey } from "@/hooks/use-calendar";
import type { CalendarEventMap } from "@/types/calendar";
import { CalendarCell } from "./calendar-cell";

const DAY_LABELS_DESKTOP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_MOBILE = ["S", "M", "T", "W", "T", "F", "S"];

interface Props {
  year: number;
  month: number;
  eventMap: CalendarEventMap;
  onSelectDate: (dateKey: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function CalendarGrid({
  year,
  month,
  eventMap,
  onSelectDate,
  isLoading,
  isError,
  onRetry,
}: Props) {
  const gridDays = getGridDays(year, month);
  const todayKey = toDateKey(new Date());

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          text="Could not load calendar."
          action={{ label: "Retry", onClick: onRetry }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid grid-cols-7 bg-subtle border-b border-line flex-shrink-0">
        {DAY_LABELS_DESKTOP.map((label, i) => (
          <div
            key={label + i}
            className={cn(
              "py-2.5 text-center text-xs font-semibold border-r border-line last:border-r-0 md:text-xs text-body",
            )}
          >
            <span className="hidden md:inline">{DAY_LABELS_DESKTOP[i]}</span>
            <span className="md:hidden">{DAY_LABELS_MOBILE[i]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 overflow-hidden content-start">
        {gridDays.map((day) => {
          const key = toDateKey(day);
          return (
            <CalendarCell
              key={key}
              date={day}
              events={isLoading ? [] : (eventMap.get(key) ?? [])}
              isToday={key === todayKey}
              isCurrentMonth={day.getMonth() === month}
              isLoading={isLoading}
              onClick={() => onSelectDate(key)}
            />
          );
        })}
      </div>
    </div>
  );
}
