"use client";

import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import {
  useHearings,
  useCreateHearing,
  useUpdateHearing,
  useDeleteHearing,
} from "@/hooks/use-hearings";
import { useCase } from "@/hooks/use-cases";
import { HearingCard } from "./hearing-card";
import { HearingEditModal } from "./hearing-edit-modal";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Hearing } from "@/types/hearings";

interface HearingsTabProps {
  caseId: string;
}

export function HearingsTab({ caseId }: HearingsTabProps) {
  const [editHearing, setEditHearing] = useState<Hearing | null | "new">(null);
  const [toDelete, setToDelete] = useState<Hearing | null>(null);

  const { data: hearings = [], isLoading } = useHearings(caseId);
  const { data: caseData } = useCase(caseId);
  const courtName = caseData?.courtName;
  const benchNumber = caseData?.benchNumber;
  const createHearing = useCreateHearing(caseId);
  const updateHearing = useUpdateHearing(caseId);
  const deleteHearing = useDeleteHearing(caseId);

  const sorted = [...hearings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-placeholder">
            {isLoading ? "Loading…" : `${hearings.length} hearing${hearings.length !== 1 ? "s" : ""}`}
          </span>
          <Button size="sm" onClick={() => setEditHearing("new")}>
            <Plus className="size-3.5" /> Add Hearing
          </Button>
        </div>

        {!isLoading && hearings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center mb-4">
              <CalendarDays className="size-5 text-placeholder" />
            </div>
            <p className="text-sm font-semibold text-dark mb-1">No hearings yet</p>
            <p className="text-xs text-secondary mb-5">
              Add your first hearing to start tracking court dates
            </p>
            <Button size="sm" onClick={() => setEditHearing("new")}>
              <Plus className="size-3.5" /> Add Hearing
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {sorted.map((h) => (
            <HearingCard
              key={h.id}
              hearing={h}
              courtName={courtName}
              benchNumber={benchNumber}
              onEdit={() => setEditHearing(h)}
              onDelete={() => setToDelete(h)}
            />
          ))}
        </div>
      </div>

      <HearingEditModal
        open={editHearing !== null}
        hearing={editHearing === "new" ? null : editHearing}
        isPending={createHearing.isPending || updateHearing.isPending}
        onClose={() => setEditHearing(null)}
        onSave={async (data) => {
          if (editHearing === "new") {
            const { date, purpose, notes, judgePresent } = data;
            if (!date) {
              toast.error("Hearing date is required");
              return;
            }
            await createHearing.mutateAsync({ date, purpose, notes, judgePresent });
          } else if (editHearing) {
            await updateHearing.mutateAsync({ id: editHearing.id, data });
          }
          setEditHearing(null);
        }}
      />

      <ConfirmDeleteModal
        open={!!toDelete}
        title="hearing"
        entityName={
          toDelete ? new Date(toDelete.date).toLocaleDateString("en-IN") : ""
        }
        isPending={deleteHearing.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteHearing.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}
