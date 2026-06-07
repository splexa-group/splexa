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
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type {
  ImportantDate,
  CreateImportantDateInput,
} from "@/types/important-dates";

const CRITICAL_TYPES = [
  "Limitation",
  "BailExpiry",
  "StayExpiry",
  "AppealDeadline",
];

interface Props {
  caseId: string;
}

function urgencyColor(isoDate: string) {
  const date = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return "text-negative";
  if (date.toDateString() === today.toDateString()) return "text-amber-dark";
  return "text-dark";
}

function typeBadge(type: string) {
  return CRITICAL_TYPES.includes(type)
    ? "bg-negative-muted text-negative"
    : "bg-brand-soft text-brand";
}

export function ImportantDatesDetails({ caseId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [editDate, setEditDate] = useState<ImportantDate | null>(null);
  const [toDelete, setToDelete] = useState<ImportantDate | null>(null);

  const { data: dates = [], isLoading } = useImportantDates(caseId);
  const createDate = useCreateImportantDate(caseId);
  const updateDate = useUpdateImportantDate(caseId);
  const deleteDate = useDeleteImportantDate(caseId);

  const sorted = [...dates].sort(
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
          {sorted.map((importantDate, i) => (
            <div
              key={importantDate.id}
              className={cn(
                "grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 px-4 py-3",
                i < sorted.length - 1 && "border-b border-line",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0",
                  typeBadge(importantDate.dateType),
                )}
              >
                {importantDate.dateType.replace(/([A-Z])/g, " $1").trim()}
              </span>

              <span
                className={cn(
                  "text-sm font-semibold whitespace-nowrap",
                  urgencyColor(importantDate.date),
                )}
              >
                {new Date(importantDate.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>

              <span className="text-xs text-secondary truncate">
                {importantDate.description ?? <span className="text-placeholder">—</span>}
              </span>

              <div className="flex items-center gap-1.5">
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
          ))}
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
