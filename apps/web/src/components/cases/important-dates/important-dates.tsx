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
  const d = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return "text-negative";
  if (d.toDateString() === today.toDateString()) return "text-amber-dark";
  return "text-dark";
}

function typeBadge(type: string) {
  return CRITICAL_TYPES.includes(type)
    ? "bg-negative-muted text-negative"
    : "bg-brand-soft text-brand";
}

export function ImportantDatesDetails({ caseId }: Props) {
  const [modal, setModal] = useState<ImportantDate | null | "new">(null);
  const [toDelete, setToDelete] = useState<ImportantDate | null>(null);

  const { data: dates = [], isLoading } = useImportantDates(caseId);
  const createDate = useCreateImportantDate(caseId);
  const updateDate = useUpdateImportantDate(caseId);
  const deleteDate = useDeleteImportantDate(caseId);

  const sorted = [...dates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const handleSave = async (data: CreateImportantDateInput) => {
    if (modal === "new") {
      await createDate.mutateAsync(data);
    } else if (modal) {
      await updateDate.mutateAsync({ dateId: modal.id, data });
    }
    setModal(null);
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
          isLoading && dates.length === 0
            ? "Important Dates"
            : `Important Dates (${dates.length})`
        }
        action={
          <Button size="sm" onClick={() => setModal("new")}>
            Add New Date
          </Button>
        }
        isEmpty={!isLoading && dates.length === 0}
        emptyLabel="No important dates yet. Track deadlines, bail expiry, limitation dates and more."
        onAdd={() => setModal("new")}
        addLabel="Add Date"
      >
        <div className="rounded border border-line bg-card overflow-hidden">
          {sorted.map((d, i) => (
            <div
              key={d.id}
              className={cn(
                "grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 px-4 py-3",
                i < sorted.length - 1 && "border-b border-line",
              )}
            >
              {/* Type badge */}
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0",
                  typeBadge(d.dateType),
                )}
              >
                {d.dateType.replace(/([A-Z])/g, " $1").trim()}
              </span>

              {/* Date */}
              <span
                className={cn(
                  "text-sm font-semibold whitespace-nowrap",
                  urgencyColor(d.date),
                )}
              >
                {new Date(d.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>

              {/* Description */}
              <span className="text-xs text-secondary truncate">
                {d.description ?? <span className="text-placeholder">—</span>}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setModal(d)}
                  className="p-1.5 rounded bg-subtle text-secondary hover:text-dark transition-colors"
                  aria-label="Edit"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(d)}
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
        open={modal !== null}
        date={modal === "new" ? null : modal}
        isPending={createDate.isPending || updateDate.isPending}
        onClose={() => setModal(null)}
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
