"use client";

import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";
import { CalendarEventChip } from "./calendar-event-chip";

interface Props {
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function CalendarCell({
  date,
  events,
  isToday,
  isCurrentMonth,
  isLoading,
  onClick,
}: Props) {
  const hasEvents = isCurrentMonth && events.length > 0;
  const visibleEvents = events.slice(0, 2);
  const overflowCount = events.length - visibleEvents.length;

  return (
    <div
      className={cn(
        "calendar-cell",
        isToday && "calendar-cell--today",
        !isCurrentMonth && "calendar-cell--outside",
        hasEvents && "cursor-pointer active:bg-subtle",
      )}
      onClick={hasEvents ? onClick : undefined}
      role={hasEvents ? "button" : undefined}
      tabIndex={hasEvents ? 0 : undefined}
      onKeyDown={hasEvents ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <span
        className={cn(
          "calendar-date-num",
          isToday && "!text-brand font-bold",
          !isCurrentMonth && "!text-disabled",
        )}
      >
        {date.getDate()}
      </span>

      {isLoading && isCurrentMonth && (
        <div className="space-y-0.5 mt-1">
          <div className="h-3 bg-subtle animate-pulse rounded w-full" />
        </div>
      )}

      {!isLoading && hasEvents && (
        <div className="space-y-0.5 mt-1">
          {visibleEvents.map((event) => (
            <CalendarEventChip key={event.id} event={event} />
          ))}
          {overflowCount > 0 && (
            <span className="block text-[9px] text-brand font-medium pl-1 md:text-[10px]">
              +{overflowCount} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
