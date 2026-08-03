import { cn } from "@/utils/tailwind";
import type { CalendarDisplayEvent } from "@/types/calendar";

interface Props {
  event: CalendarDisplayEvent;
}

export function CalendarEventChip({ event }: Props) {
  return (
    <span
      className={cn(
        "calendar-chip",
        event.kind === "hearing" ? "calendar-chip--hearing" : "calendar-chip--date",
      )}
      title={event.caseTitle}
    >
      {event.caseTitle}
    </span>
  );
}
