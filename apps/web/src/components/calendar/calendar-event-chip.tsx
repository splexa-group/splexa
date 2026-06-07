import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

interface Props {
  event: CalendarEvent;
}

export function CalendarEventChip({ event }: Props) {
  return (
    <span
      className={cn(
        "calendar-chip",
        event.kind === "hearing"
          ? "calendar-chip--hearing"
          : "calendar-chip--date",
      )}
      title={event.caseTitle}
    >
      {event.caseTitle}
    </span>
  );
}
