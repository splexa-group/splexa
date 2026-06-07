"use client";

import { useState } from "react";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { CalendarEventPopup } from "./calendar-event-popup";

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const { eventMap, isLoading, isError, refetch } = useCalendarEvents(
    year,
    month,
  );

  function handlePrev() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function handleNext() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function handleToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  const selectedEvents = selectedDateKey
    ? (eventMap.get(selectedDateKey) ?? [])
    : [];

  return (
    <div className="calendar-page">
      <CalendarHeader
        year={year}
        month={month}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />
      <CalendarGrid
        year={year}
        month={month}
        eventMap={eventMap}
        onSelectDate={setSelectedDateKey}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />
      <CalendarEventPopup
        dateKey={selectedDateKey ?? ""}
        events={selectedEvents}
        open={!!selectedDateKey}
        onClose={() => setSelectedDateKey(null)}
      />
    </div>
  );
}
