"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { filterEventMap } from "@/utils/calendar";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { CalendarDayPanel } from "./calendar-day-panel";

export function CalendarView() {
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [search, setSearch] = useState("");

  const { eventMap, isLoading, isError, refetch } = useCalendarEvents(
    year,
    month,
  );

  const filteredMap = filterEventMap(eventMap, search);
  const panelEvents = filteredMap.get(selectedDateKey) ?? [];

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
  }, []);

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

  return (
    <div className="calendar-page">
      <CalendarHeader
        year={year}
        month={month}
        onPrev={handlePrev}
        onNext={handleNext}
        search={search}
        onSearchChange={setSearch}
      />
      <div className="flex flex-1 overflow-hidden pb-4 gap-4 pt-2 px-4 md:px-6 items-start">
        <div className="flex-[7] min-w-0 overflow-hidden rounded-lg border border-line flex flex-col">
          <CalendarGrid
            year={year}
            month={month}
            eventMap={filteredMap}
            onSelectDate={handleSelectDate}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </div>
        <CalendarDayPanel dateKey={selectedDateKey} events={panelEvents} />
      </div>

    </div>
  );
}
