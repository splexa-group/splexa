"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "@/components/shared/modal";
import { DatePicker } from "@/components/ui/form/date-picker";
import { SelectGroup } from "@/components/ui/form/select";
import { TextareaGroup } from "@/components/ui/form/textarea";
import { IMPORTANT_DATE_TYPE_OPTIONS } from "@/constants/options";
import type { ImportantDate, CreateImportantDateInput } from "@/types/important-dates";
import { toISODatetime } from "@/lib/utils";

interface AddImportantDateModalProps {
  open: boolean;
  date?: ImportantDate | null;
  onClose: () => void;
  onSave: (data: CreateImportantDateInput) => void;
  isPending?: boolean;
}

export function AddImportantDateModal({
  open,
  date,
  onClose,
  onSave,
  isPending,
}: AddImportantDateModalProps) {
  const { register, control, handleSubmit, reset } = useForm<CreateImportantDateInput>({
    defaultValues: { dateType: undefined, date: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      if (date) {
        reset({
          dateType: date.dateType,
          date: date.date.substring(0, 10),
          description: date.description ?? "",
        });
      } else {
        reset({ dateType: undefined, date: "", description: "" });
      }
    }
  }, [date, open, reset]);

  const submit = handleSubmit((data) =>
    onSave({
      ...data,
      date: toISODatetime(data.date) ?? data.date,
    }),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={date ? "Edit Important Date" : "Add Important Date"}
      onSave={submit}
      saveLabel={date ? "Save Date" : "Add Date"}
      saveLoading={isPending}
    >
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="dateType"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <SelectGroup
                label="Date Type"
                options={IMPORTANT_DATE_TYPE_OPTIONS}
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Select type"
                required
              />
            )}
          />

          <Controller
            name="date"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <DatePicker
                label="Date"
                required
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />

          <TextareaGroup
            label="Description"
            placeholder="Enter description..."
            rows={3}
            className="col-span-2"
            {...register("description")}
          />
        </div>
      </div>
    </Modal>
  );
}
