"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  useHearings,
  useCreateHearing,
  useUpdateHearing,
  useDeleteHearing,
} from "@/hooks/use-hearings";
import { HearingCard } from "./hearing-card";
import { HearingEditModal } from "./hearing-edit-modal";
import { ConfirmDeleteModal } from "@/components/ui/modals/confirm-delete";
import { PageFooter } from "@/components/layout/page-footer";
import { Button } from "@/components/ui/button";
import { HearingStatus } from "@splexa-group/shared/enums";
import type {
  Hearing,
  CreateHearingInput,
  UpdateHearingInput,
} from "@/types/hearings";

interface HearingsTabProps {
  caseId: string;
}

export function HearingsTab({ caseId }: HearingsTabProps) {
  const [editHearing, setEditHearing] = useState<Hearing | null | "new">(null);
  const [toDelete, setToDelete] = useState<Hearing | null>(null);

  const { data: hearings = [], isLoading } = useHearings(caseId);
  const createHearing = useCreateHearing(caseId);
  const updateHearing = useUpdateHearing(caseId);
  const deleteHearing = useDeleteHearing(caseId);

  const sorted = [...hearings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-placeholder">
            {isLoading ? "Loading…" : `${hearings.length} hearings`}
          </span>
          <Button size="sm" onClick={() => setEditHearing("new")}>
            <Plus className="size-3.5" /> Add Hearing
          </Button>
        </div>

        {!isLoading && hearings.length === 0 && (
          <p className="text-sm text-secondary text-center py-8">
            No hearings yet.
          </p>
        )}

        {/* Timeline */}
        <div className="relative space-y-3">
          {sorted.length > 1 && (
            <div className="absolute left-[5px] top-4 bottom-4 w-px bg-line" />
          )}
          {sorted.map((h, i) => (
            <HearingCard
              key={h.id}
              hearing={h}
              faded={i >= 3 && h.status === HearingStatus.Completed}
              onEdit={() => setEditHearing(h)}
              onDelete={() => setToDelete(h)}
            />
          ))}
        </div>
      </div>

      <PageFooter
        right={
          <Button size="sm" onClick={() => setEditHearing("new")}>
            <Plus className="size-3.5" /> Add Hearing
          </Button>
        }
      />

      <HearingEditModal
        open={editHearing !== null}
        hearing={editHearing === "new" ? null : editHearing}
        isPending={createHearing.isPending || updateHearing.isPending}
        onClose={() => setEditHearing(null)}
        onSave={async (data) => {
          if (editHearing === "new") {
            await createHearing.mutateAsync(data as CreateHearingInput);
          } else if (editHearing) {
            await updateHearing.mutateAsync({
              id: editHearing.id,
              data: data as UpdateHearingInput,
            });
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
