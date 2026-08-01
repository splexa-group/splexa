"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useImportantDates,
  useCreateImportantDate,
  useUpdateImportantDate,
  useDeleteImportantDate,
} from "@/hooks/use-important-dates";
import { AddImportantDateModal } from "@/components/modals/add-important-date";
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { formatEnumLabel } from "@/lib/options";
import { ImportantDateType } from "@splexa-group/shared/enums";
import type {
  ImportantDate,
  CreateImportantDateInput,
} from "@/types/important-dates";

const CRITICAL_TYPES: ImportantDateType[] = [
  ImportantDateType.LIMITATION,
  ImportantDateType.BAIL_EXPIRY,
  ImportantDateType.STAY_EXPIRY,
  ImportantDateType.APPEAL_DEADLINE,
];

interface Props {
  caseId: string;
}

function typeBadgeClass(type: ImportantDateType) {
  return CRITICAL_TYPES.includes(type)
    ? "bg-negative-muted text-negative"
    : "bg-brand-soft text-brand";
}

function getUrgency(isoDate: string): { label: string; pill: string } | null {
  const date = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)
    return {
      label: `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago`,
      pill: "bg-negative-muted text-negative",
    };
  if (diff === 0)
    return { label: "Today", pill: "bg-amber-muted text-amber-dark" };
  if (diff === 1)
    return { label: "Tomorrow", pill: "bg-amber-muted text-amber-dark" };
  if (diff <= 7)
    return { label: `In ${diff} days`, pill: "bg-amber-muted text-amber-dark" };
  return null;
}

export function ImportantDatesDetails({ caseId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [editDate, setEditDate] = useState<ImportantDate | null>(null);
  const [toDelete, setToDelete] = useState<ImportantDate | null>(null);

  const { data: dates = [], isLoading } = useImportantDates(caseId);
  const createDate = useCreateImportantDate(caseId);
  const updateDate = useUpdateImportantDate(caseId);
  const deleteDate = useDeleteImportantDate(caseId);

  const sortedDates = [...dates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  function handleOpenModal(date?: ImportantDate) {
    setEditDate(date ?? null);
    setIsOpen(true);
  }

  function handleCloseModal() {
    setIsOpen(false);
    setEditDate(null);
  }

  const handleSave = async (data: CreateImportantDateInput) => {
    if (editDate) {
      await updateDate.mutateAsync({ dateId: editDate.id, data });
    } else {
      await createDate.mutateAsync(data);
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteDate.mutateAsync(toDelete.id);
    setToDelete(null);
  };

  return (
    <>
      <Section
        title={
          isLoading ? "Important Dates" : `Important Dates (${dates.length})`
        }
        action={
          <Button size="sm" onClick={() => handleOpenModal()}>
            <Plus className="size-3.5" /> Add Date
          </Button>
        }
        isEmpty={!isLoading && dates.length === 0}
        emptyLabel="No important dates yet. Track deadlines, bail expiry, limitation dates and more."
        onAdd={() => handleOpenModal()}
        addLabel="Add Date"
      >
        <div className="rounded border border-line bg-card overflow-hidden">
          {sortedDates.map((importantDate, i) => {
            const urgency = getUrgency(importantDate.date);
            const d = new Date(importantDate.date);
            const day = d.toLocaleDateString("en-IN", { day: "2-digit" });
            const month = d
              .toLocaleDateString("en-IN", { month: "short" })
              .toUpperCase();
            const year = d.getFullYear();

            return (
              <div
                key={importantDate.id}
                className={cn(
                  "flex items-center gap-4 px-4 py-3",
                  i < sortedDates.length - 1 && "border-b border-line",
                )}
              >
                {/* Date block */}
                <div className="flex flex-col items-center text-center shrink-0 w-10">
                  <span className="text-2xl font-black text-dark leading-none">
                    {day}
                  </span>
                  <span className="text-[9px] font-bold text-label uppercase tracking-widest mt-0.5">
                    {month}
                  </span>
                  <span className="text-[10px] font-medium text-secondary mt-0.5">
                    {year}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                        typeBadgeClass(importantDate.dateType),
                      )}
                    >
                      {formatEnumLabel(importantDate.dateType)}
                    </span>
                    {urgency && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          urgency.pill,
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current shrink-0" />
                        {urgency.label}
                      </span>
                    )}
                  </div>
                  {importantDate.description && (
                    <p className="text-sm font-medium text-dark truncate">
                      {importantDate.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(importantDate)}
                    className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(importantDate)}
                    className="p-1.5 rounded bg-negative-muted text-negative hover:opacity-80 transition-opacity"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <AddImportantDateModal
        open={isOpen}
        date={editDate}
        isPending={createDate.isPending || updateDate.isPending}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={!!toDelete}
        title="date"
        entityName={toDelete?.dateType ?? ""}
        isPending={deleteDate.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
