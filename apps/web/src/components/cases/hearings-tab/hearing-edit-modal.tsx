"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modals/modal";
import { Field } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { TextareaField } from "@/components/ui/form/textarea";
import { Button } from "@/components/ui/button";
import { HEARING_PURPOSE_OPTIONS, HEARING_STATUS_OPTIONS } from "@/lib/options";
import type {
  Hearing,
  UpdateHearingInput,
  CreateHearingInput,
} from "@/types/hearings";
import { HearingStatus } from "@splexa-group/shared/enums";
import { toISODatetime } from "@/lib/utils";

interface HearingEditModalProps {
  open: boolean;
  hearing?: Hearing | null;
  onClose: () => void;
  onSave: (data: UpdateHearingInput | CreateHearingInput) => void;
  isPending?: boolean;
}

export function HearingEditModal({
  open,
  hearing,
  onClose,
  onSave,
  isPending,
}: HearingEditModalProps) {
  const { register, control, watch, handleSubmit, reset } =
    useForm<UpdateHearingInput>({
      defaultValues: {
        date: "",
        purpose: undefined,
        status: HearingStatus.Scheduled,
        judgePresent: "",
        notes: "",
        nextDate: "",
        adjournmentReason: "",
      },
    });

  const status = watch("status");

  useEffect(() => {
    if (open) {
      if (hearing) {
        reset({
          date: hearing.date ? hearing.date.substring(0, 10) : "",
          purpose: hearing.purpose ?? undefined,
          status: hearing.status,
          judgePresent: hearing.judgePresent ?? "",
          notes: hearing.notes ?? "",
          nextDate: hearing.nextDate ? hearing.nextDate.substring(0, 10) : "",
          adjournmentReason: hearing.adjournmentReason ?? "",
        });
      } else {
        reset({ date: "", status: HearingStatus.Scheduled });
      }
    }
  }, [hearing, open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={hearing ? "Edit Hearing" : "Add Hearing"}
    >
      <form
        onSubmit={handleSubmit((data) =>
          onSave({
            ...data,
            date: toISODatetime(data.date) ?? data.date,
            nextDate: toISODatetime(data.nextDate),
          }),
        )}
        className="p-5 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Hearing Date"
            type="date"
            required
            {...register("date")}
          />
          <Controller
            name="purpose"
            control={control}
            render={({ field }) => (
              <SelectGroup
                label="Purpose"
                options={HEARING_PURPOSE_OPTIONS}
                value={field.value ?? ""}
                onChange={field.onChange}
                onClear={() => field.onChange(undefined)}
                placeholder="Select purpose"
              />
            )}
          />
        </div>

        {hearing && (
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <SelectGroup
                label="Status"
                options={HEARING_STATUS_OPTIONS}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
        )}

        <Field label="Judge Present" {...register("judgePresent")} />

        <TextareaField label="Notes" rows={3} {...register("notes")} />

        {status === HearingStatus.Adjourned && (
          <>
            <Field label="Next Date" type="date" {...register("nextDate")} />
            <Field
              label="Adjournment Reason"
              {...register("adjournmentReason")}
            />
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isPending}>
            {hearing ? "Save Hearing" : "Add Hearing"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
