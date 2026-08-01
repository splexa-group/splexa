"use client";

import { Fragment, useState } from "react";
import { Hammer } from "lucide-react";
import {
  useHearings,
  useCreateHearing,
  useUpdateHearing,
  useDeleteHearing,
} from "@/hooks/use-hearings";
import { useCase } from "@/hooks/use-cases";
import { HearingCard, NextHearingCard } from "./hearing-card";
import { AddHearingModal } from "@/components/modals/add-hearing";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HearingStatus } from "@splexa-group/shared/enums";
import type { Hearing, UpdateHearingInput } from "@/types/hearings";
import { HEARING_TIMELINE_STATUS_ICON } from "./hearing-status";

interface Props {
  caseId: string;
}

export function HearingsDetails({ caseId }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [hearingToEdit, setHearingToEdit] = useState<Hearing | null>(null);
  const [toDelete, setToDelete] = useState<Hearing | null>(null);

  const { data: hearings = [], isLoading } = useHearings(caseId);
  const { data: caseData } = useCase(caseId);
  const createHearing = useCreateHearing(caseId);
  const updateHearing = useUpdateHearing(caseId);
  const deleteHearing = useDeleteHearing(caseId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upNext = [...hearings]
    .filter(
      (h) => new Date(h.date) >= today && h.status === HearingStatus.SCHEDULED,
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const openCreate = () => {
    setHearingToEdit(null);
    setModalOpen(true);
  };
  const openEdit = (h: Hearing) => {
    setHearingToEdit(h);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setHearingToEdit(null);
  };

  const handleSave = async (data: UpdateHearingInput) => {
    if (!hearingToEdit) {
      const { date, time, purpose, status, notes, judgeName } = data;
      if (!date) {
        toast.error("Hearing date is required");
        return;
      }
      await createHearing.mutateAsync({
        date,
        time: time || undefined,
        purpose,
        status,
        notes,
        judgeName,
      });
    } else {
      await updateHearing.mutateAsync({ id: hearingToEdit.id, data });
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteHearing.mutateAsync(toDelete.id);
    setToDelete(null);
  };

  const handleHearingStatus = (id: string, status: HearingStatus) =>
    updateHearing.mutateAsync({
      id,
      data: { status },
    });

  return (
    <>
      <div className="space-y-4">
        {/* Featured up-next card */}
        {upNext && (
          <NextHearingCard
            hearing={upNext}
            courtName={caseData?.courtName}
            benchNumber={caseData?.benchNumber}
            onEdit={() => openEdit(upNext)}
            onMarkHeard={() =>
              void handleHearingStatus(upNext.id, HearingStatus.COMPLETED)
            }
            onMarkMissed={() =>
              void handleHearingStatus(upNext.id, HearingStatus.CANCELLED)
            }
            onAdjourn={() => openEdit(upNext)}
          />
        )}

        <Section
          title={isLoading ? "Hearings" : `Hearings (${hearings.length})`}
          action={<Button onClick={openCreate}>Add Hearing</Button>}
          isEmpty={!isLoading && hearings.length === 0}
          emptyLabel="No hearings yet. Add your first hearing to start tracking court dates."
          onAdd={openCreate}
          addLabel="Add Hearing"
        >
          {hearings.map((hearing, index) => {
            const hearingDate = new Date(hearing.date);
            const day = hearingDate.toLocaleDateString("en-IN", {
              day: "2-digit",
            });
            const month = hearingDate
              .toLocaleDateString("en-IN", { month: "short" })
              .toUpperCase();
            const year = hearingDate.getFullYear();

            const iconCfg =
              upNext?.id === hearing.id
                ? { Icon: Hammer, bg: "bg-brand", color: "text-white" }
                : HEARING_TIMELINE_STATUS_ICON[hearing.status];

            const { Icon, bg, color } = iconCfg;

            const isLast = index === hearings.length - 1;

            return (
              <Fragment key={hearing.id}>
                <div className="flex gap-4">
                  {/* Date: stretches full row height, content centered */}
                  <div className="w-24 flex flex-col items-end justify-center text-right shrink-0 py-3">
                    <span className="text-3xl font-black text-dark leading-none">
                      {day}
                    </span>
                    <span className="text-[11px] font-bold text-label uppercase tracking-widest mt-1">
                      {month}
                    </span>
                    <span className="text-xs font-medium text-secondary mt-0.5">
                      {year}
                    </span>
                  </div>

                  {/* Connector: top-line | icon | bottom-line
                      Each segment is flex-1 → icon sits exactly in vertical center.
                      First row top segment is transparent; last row bottom segment is transparent. */}
                  <div className="flex flex-col items-center self-stretch shrink-0">
                    <div
                      className={cn(
                        "w-0.5 flex-1",
                        index > 0 ? "bg-brand" : "",
                      )}
                    />
                    <div
                      className={cn(
                        "size-9 rounded-full flex items-center justify-center shrink-0",
                        bg,
                      )}
                    >
                      <Icon className={cn("size-4", color)} />
                    </div>
                    <div
                      className={cn("w-0.5 flex-1", !isLast ? "bg-brand" : "")}
                    />
                  </div>

                  <div className="flex-1 min-w-0 py-3">
                    <HearingCard
                      hearing={hearing}
                      onEdit={() => openEdit(hearing)}
                      onDelete={() => setToDelete(hearing)}
                    />
                  </div>
                </div>
              </Fragment>
            );
          })}
        </Section>
      </div>

      {/** Modals */}
      <AddHearingModal
        open={modalOpen}
        hearing={hearingToEdit}
        isPending={createHearing.isPending || updateHearing.isPending}
        onClose={closeModal}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={!!toDelete}
        title="hearing"
        entityName={
          toDelete
            ? `hearing details on ${new Date(toDelete.date).toLocaleDateString("en-IN")}`
            : ""
        }
        isPending={deleteHearing.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
