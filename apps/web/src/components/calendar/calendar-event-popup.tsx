"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

interface Props {
  dateKey: string;
  events: CalendarEvent[];
  open: boolean;
  onClose: () => void;
}

export function CalendarEventPopup({ dateKey, events, open, onClose }: Props) {
  const router = useRouter();

  const formattedDate = dateKey
    ? new Date(dateKey + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  function handleViewCase(caseId: string) {
    onClose();
    router.push(`/cases/${caseId}`);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            // Mobile: full-width bottom sheet
            "fixed inset-x-0 bottom-0 z-50 max-h-[80vh] bg-card rounded-t-xl shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            // Desktop: centered modal
            "md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2",
            "md:-translate-x-1/2 md:-translate-y-1/2",
            "md:w-full md:max-w-sm md:rounded-xl",
            "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95",
            "md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-bottom-0",
          )}
        >
          {/* Drag handle — mobile only */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-line" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div>
              <Dialog.Title className="text-sm font-semibold text-dark">
                {formattedDate}
              </Dialog.Title>
              <p className="text-xs text-secondary">
                {events.length} event{events.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex items-center justify-center size-[44px] rounded text-placeholder hover:text-secondary hover:bg-subtle transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Event list */}
          <div className="overflow-y-auto p-3 space-y-2">
            {events.map((event) => (
              <div key={event.id} className="calendar-popup-event">
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mb-1",
                      event.kind === "hearing"
                        ? "bg-brand-soft text-brand"
                        : "bg-amber-muted text-amber",
                    )}
                  >
                    {event.kind === "hearing" ? "Hearing" : event.label}
                  </span>
                  <p className="text-sm font-semibold text-dark truncate">
                    {event.caseTitle}
                  </p>
                  <p className="text-xs text-secondary">{event.label}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleViewCase(event.caseId)}
                  className="calendar-popup-view-btn"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
