"use client";

import { useState } from "react";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  useImportantDates,
  useCreateImportantDate,
  useUpdateImportantDate,
  useDeleteImportantDate,
} from "@/hooks/use-important-dates";
import { ImportantDateModal } from "./important-date-modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { PageFooter } from "@/components/ui/page-footer";
import { Button } from "@/components/ui/button";
import type { ImportantDate, CreateImportantDateInput, UpdateImportantDateInput } from "@/types/important-dates";

const CRITICAL_TYPES = ["Limitation", "BailExpiry", "StayExpiry", "AppealDeadline"];

interface ImportantDatesTabProps {
  caseId: string;
}

export function ImportantDatesTab({ caseId }: ImportantDatesTabProps) {
  const [modal, setModal] = useState<ImportantDate | null | "new">(null);
  const [toDelete, setToDelete] = useState<ImportantDate | null>(null);

  const { data: dates = [], isLoading } = useImportantDates(caseId);
  const createDate = useCreateImportantDate(caseId);
  const updateDate = useUpdateImportantDate(caseId);
  const deleteDate = useDeleteImportantDate(caseId);

  const sorted = [...dates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  function dateColor(isoDate: string) {
    const d = new Date(isoDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return "text-negative";
    if (d.toDateString() === today.toDateString()) return "text-amber";
    return "text-dark";
  }

  function badgeClass(type: string) {
    return CRITICAL_TYPES.includes(type)
      ? "bg-negative-muted text-negative"
      : "bg-brand-soft text-brand";
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-placeholder">
            {isLoading ? "Loading…" : `${dates.length} dates`}
          </span>
          <Button size="sm" onClick={() => setModal("new")}>
            <Plus className="size-3.5" /> Add Date
          </Button>
        </div>

        {!isLoading && dates.length === 0 && (
          <p className="text-sm text-secondary text-center py-8">No important dates added yet.</p>
        )}

        {sorted.length > 0 && (
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            {sorted.map((d, i) => (
              <div
                key={d.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i < sorted.length - 1 && "border-b border-line",
                )}
              >
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", badgeClass(d.dateType))}>
                  {d.dateType.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold", dateColor(d.date))}>
                    {new Date(d.date).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                  {d.description && (
                    <p className="text-xs text-secondary truncate">{d.description}</p>
                  )}
                </div>
                <DateRowMenu
                  onEdit={() => setModal(d)}
                  onDelete={() => setToDelete(d)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <PageFooter
        right={
          <Button size="sm" onClick={() => setModal("new")}>
            <Plus className="size-3.5" /> Add Important Date
          </Button>
        }
      />

      <ImportantDateModal
        open={modal !== null}
        date={modal === "new" ? null : modal}
        isPending={createDate.isPending || updateDate.isPending}
        onClose={() => setModal(null)}
        onSave={async (data) => {
          if (modal === "new") {
            await createDate.mutateAsync(data as CreateImportantDateInput);
          } else if (modal) {
            await updateDate.mutateAsync({ dateId: modal.id, data: data as UpdateImportantDateInput });
          }
          setModal(null);
        }}
      />

      <ConfirmDeleteModal
        open={!!toDelete}
        title="date"
        entityName={toDelete ? toDelete.dateType : ""}
        isPending={deleteDate.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteDate.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}

function DateRowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="p-1 rounded text-placeholder hover:text-secondary hover:bg-subtle"
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-36 bg-card border border-line rounded-lg shadow-md py-1">
          <button type="button" onClick={() => { setOpen(false); onEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-label hover:bg-subtle">
            <Pencil className="size-3.5" /> Edit
          </button>
          <button type="button" onClick={() => { setOpen(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-negative hover:bg-negative-muted">
            <Trash2 className="size-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
