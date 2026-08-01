"use client";

import { parseISO, format } from "date-fns";
import { Clock, Landmark, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { CalendarDisplayEvent } from "@/types/calendar";

interface Props {
  dateKey: string;
  events: CalendarDisplayEvent[];
}

export function CalendarDayPanel({ dateKey, events }: Props) {
  const date = parseISO(dateKey);
  const dayLabel = format(date, "EEEE, d MMMM yyyy");

  const hearings = events.filter((e) => e.kind === "hearing");
  const importantDates = events.filter((e) => e.kind === "important-date");

  return (
    <div className="calendar-day-panel">
      <div className="calendar-day-panel-header">
        <span className="text-sm font-bold text-dark">{dayLabel}</span>
        <span className="text-xs text-secondary tabular-nums">
          {events.length === 0
            ? "No events"
            : `${events.length} event${events.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="calendar-day-panel-body">
        {events.length === 0 ? (
          <p className="text-sm text-placeholder text-center py-10">
            No hearings or important dates
          </p>
        ) : (
          <>
            {hearings.map((event) => (
              <div key={event.id} className="calendar-panel-event">
                <div className="flex items-center justify-between gap-2">
                  <span className="calendar-panel-badge--hearing">
                    {event.label}
                  </span>
                  {event.status && (
                    <span className="text-[10px] font-medium text-secondary">
                      {event.status}
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-dark leading-snug">
                  {event.caseTitle}
                </p>

                <div className="space-y-1">
                  {event.time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-placeholder shrink-0" />
                      <span className="text-xs text-secondary">{event.time}</span>
                    </div>
                  )}
                  {event.courtName && (
                    <div className="flex items-center gap-1.5">
                      <Landmark className="size-3.5 text-placeholder shrink-0" />
                      <span className="text-xs text-secondary">
                        {event.courtName}
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/cases/${event.caseId}`}
                  className="calendar-panel-view-btn"
                >
                  View Case
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            ))}

            {importantDates.map((event) => (
              <div key={event.id} className="calendar-panel-event">
                <span className="calendar-panel-badge--date">{event.label}</span>

                <p className="text-sm font-semibold text-dark leading-snug">
                  {event.caseTitle}
                </p>

                {event.description && (
                  <p className="text-xs text-secondary">{event.description}</p>
                )}

                <Link
                  href={`/cases/${event.caseId}`}
                  className="calendar-panel-view-btn"
                >
                  View Case
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
