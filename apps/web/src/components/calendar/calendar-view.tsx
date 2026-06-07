"use client";

import { useState } from "react";
import {
  useCalendarEvents,
  filterEventMap,
  toDateKey,
} from "@/hooks/use-calendar";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { CalendarDayPanel } from "./calendar-day-panel";
import type { CalendarFilter } from "@/types/calendar";

export function CalendarView() {
  const today = new Date();
  const todayKey = toDateKey(today);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [search, setSearch] = useState("");

  const { eventMap, isLoading, isError, refetch } = useCalendarEvents(
    year,
    month,
  );

  const filteredMap = filterEventMap(eventMap, filter, search);
  const panelEvents = filteredMap.get(selectedDateKey) ?? [];

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
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[7] min-w-0 overflow-hidden">
          <CalendarGrid
            year={year}
            month={month}
            eventMap={filteredMap}
            onSelectDate={setSelectedDateKey}
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
