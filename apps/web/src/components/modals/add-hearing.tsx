"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Modal } from "./modal";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { TextareaGroup } from "@/components/ui/form/textarea";
import { DatePicker } from "@/components/ui/form/date-picker";
import { HEARING_PURPOSE_OPTIONS, HEARING_STATUS_OPTIONS } from "@/lib/options";
import type { Hearing, UpdateHearingInput } from "@/types/hearings";
import { HearingStatus } from "@splexa-group/shared/enums";
import { toISODatetime } from "@/lib/utils";

interface Props {
  open: boolean;
  hearing?: Hearing | null;
  defaultStatus?: HearingStatus;
  onClose: () => void;
  onSave: (data: UpdateHearingInput) => void;
  isPending?: boolean;
}

const defaultValues: UpdateHearingInput = {
  date: "",
  purpose: undefined,
  status: HearingStatus.Scheduled,
  judgePresent: "",
  notes: "",
  nextDate: "",
  adjournmentReason: "",
};

export function AddHearingModal({
  open,
  hearing,
  onClose,
  onSave,
  isPending,
}: Props) {
  const { register, control, handleSubmit, reset } =
    useForm<UpdateHearingInput>({ defaultValues });

  const status = useWatch({ control, name: "status" });

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

  const submit = handleSubmit((data) =>
    onSave({
      ...data,
      date: toISODatetime(data.date) ?? data.date,
      nextDate: toISODatetime(data.nextDate),
    }),
  );

  return (
    <Modal
      size="lg"
      open={open}
      onClose={onClose}
      title={hearing ? "Edit Hearing" : "Add Hearing"}
      onSave={submit}
      saveLabel={hearing ? "Save Hearing" : "Add Hearing"}
      saveLoading={isPending}
    >
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Hearing Date"
                required
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
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
                placeholder="Select purpose"
              />
            )}
          />
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
          <InputGroup
            label="Judge Present"
            placeholder="Enter judge name..."
            {...register("judgePresent")}
          />

          {status === HearingStatus.Adjourned && (
            <>
              <Controller
                name="nextDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Next Date"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
              <InputGroup
                label="Adjournment Reason"
                placeholder="Enter reason..."
                {...register("adjournmentReason")}
              />
            </>
          )}

          <TextareaGroup
            label="Notes"
            placeholder="Enter notes..."
            rows={3}
            className="col-span-2"
            {...register("notes")}
          />
        </div>
      </div>
    </Modal>
  );
}
