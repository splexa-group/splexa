"use client";

import { Fragment, useState } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  Check,
  CornerDownRight,
  X,
  Hammer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useHearings,
  useCreateHearing,
  useUpdateHearing,
  useDeleteHearing,
} from "@/hooks/use-hearings";
import { useCase } from "@/hooks/use-cases";
import { HearingCard, UpNextCard } from "./hearing-card";
import { HearingModal } from "@/components/modals/add-hearing";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HearingStatus } from "@splexa-group/shared/enums";
import type { Hearing, UpdateHearingInput } from "@/types/hearings";

interface HearingsTabProps {
  caseId: string;
}

const STATUS_ICON: Record<HearingStatus, { Icon: LucideIcon; bg: string; color: string }> = {
  [HearingStatus.Scheduled]: { Icon: Clock, bg: "bg-amber-muted", color: "text-amber-dark" },
  [HearingStatus.Completed]: { Icon: Check, bg: "bg-positive", color: "text-white" },
  [HearingStatus.Adjourned]: { Icon: CornerDownRight, bg: "bg-brand-soft", color: "text-brand" },
  [HearingStatus.Cancelled]: { Icon: X, bg: "bg-negative-muted", color: "text-negative" },
};

export function HearingsTab({ caseId }: HearingsTabProps) {
  const [editHearing, setEditHearing] = useState<Hearing | null | "new">(null);
  const [toDelete, setToDelete] = useState<Hearing | null>(null);

  const { data: hearings = [], isLoading } = useHearings(caseId);
  const { data: caseData } = useCase(caseId);
  const createHearing = useCreateHearing(caseId);
  const updateHearing = useUpdateHearing(caseId);
  const deleteHearing = useDeleteHearing(caseId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upNext = [...hearings]
    .filter((h) => new Date(h.date) >= today && h.status === HearingStatus.Scheduled)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const sorted = [...hearings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const handleSave = async (data: UpdateHearingInput) => {
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
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteHearing.mutateAsync(toDelete.id);
    setToDelete(null);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Featured up-next card */}
        {upNext && (
          <UpNextCard
            hearing={upNext}
            courtName={caseData?.courtName}
            benchNumber={caseData?.benchNumber}
            onEdit={() => setEditHearing(upNext)}
            onMarkHeard={() =>
              void updateHearing.mutateAsync({
                id: upNext.id,
                data: { status: HearingStatus.Completed },
              })
            }
            onMarkMissed={() =>
              void updateHearing.mutateAsync({
                id: upNext.id,
                data: { status: HearingStatus.Cancelled },
              })
            }
            onAdjourn={() => setEditHearing(upNext)}
          />
        )}

        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-placeholder">
            {isLoading
              ? "Loading…"
              : `${hearings.length} hearing${hearings.length !== 1 ? "s" : ""}`}
          </span>
          <Button size="sm" onClick={() => setEditHearing("new")}>
            <Plus className="size-3.5" /> Add Hearing
          </Button>
        </div>

        {/* Empty state */}
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

        {/* Timeline */}
        <div>
          {sorted.map((h, i) => {
            const date = new Date(h.date);
            const day = date.toLocaleDateString("en-IN", { day: "2-digit" });
            const month = date
              .toLocaleDateString("en-IN", { month: "long" })
              .toUpperCase();
            const year = date.getFullYear();

            const iconCfg =
              upNext?.id === h.id
                ? { Icon: Hammer, bg: "bg-brand", color: "text-white" }
                : STATUS_ICON[h.status];

            const { Icon, bg, color } = iconCfg;

            const isLast = i === sorted.length - 1;

            return (
              <Fragment key={h.id}>
                <div className="flex gap-4">
                  {/* Date: stretches full row height, content centered */}
                  <div className="w-24 flex flex-col items-end justify-center text-right shrink-0 py-3">
                    <span className="text-3xl font-black text-dark leading-none">{day}</span>
                    <span className="text-[11px] font-bold text-label uppercase tracking-widest mt-1">
                      {month}
                    </span>
                    <span className="text-xs font-medium text-secondary mt-0.5">{year}</span>
                  </div>

                  {/* Connector: top-line | icon | bottom-line
                      Each segment is flex-1 → icon sits exactly in vertical center.
                      First row top segment is transparent; last row bottom segment is transparent. */}
                  <div className="flex flex-col items-center self-stretch shrink-0">
                    <div className={cn("w-0.5 flex-1", i > 0 ? "bg-brand" : "")} />
                    <div
                      className={cn(
                        "size-9 rounded-full flex items-center justify-center shrink-0",
                        bg,
                      )}
                    >
                      <Icon className={cn("size-4", color)} />
                    </div>
                    <div className={cn("w-0.5 flex-1", !isLast ? "bg-brand" : "")} />
                  </div>

                  {/* Card: py-3 sets row height, which drives line length */}
                  <div className="flex-1 min-w-0 py-3">
                    <HearingCard
                      hearing={h}
                      courtName={caseData?.courtName}
                      benchNumber={caseData?.benchNumber}
                      onEdit={() => setEditHearing(h)}
                      onDelete={() => setToDelete(h)}
                    />
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      <HearingModal
        open={editHearing !== null}
        hearing={editHearing === "new" ? null : editHearing}
        isPending={createHearing.isPending || updateHearing.isPending}
        onClose={() => setEditHearing(null)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={!!toDelete}
        title="hearing"
        entityName={
          toDelete ? new Date(toDelete.date).toLocaleDateString("en-IN") : ""
        }
        isPending={deleteHearing.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
