"use client";

import { CalendarView } from "@/components/calendar/calendar-view";
import { usePageTitle } from "@/components/layout/top/top-bar-context";

export default function Page() {
  usePageTitle({
    title: "Calendar",
  });

  return <CalendarView />;
}
