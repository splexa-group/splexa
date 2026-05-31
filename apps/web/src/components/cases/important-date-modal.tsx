"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modals/modal";
import { Field } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { TextareaField } from "@/components/ui/form/textarea";
import { Button } from "@/components/ui/button";
import { IMPORTANT_DATE_TYPE_OPTIONS } from "@/lib/options";
import type {
  ImportantDate,
  CreateImportantDateInput,
  UpdateImportantDateInput,
} from "@/types/important-dates";
import { toISODatetime } from "@/lib/utils";

interface ImportantDateModalProps {
  open: boolean;
  date?: ImportantDate | null;
  onClose: () => void;
  onSave: (data: CreateImportantDateInput | UpdateImportantDateInput) => void;
  isPending?: boolean;
}

export function ImportantDateModal({
  open,
  date,
  onClose,
  onSave,
  isPending,
}: ImportantDateModalProps) {
  const { register, control, handleSubmit, reset } =
    useForm<CreateImportantDateInput>({
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={date ? "Edit Date" : "Add Important Date"}
    >
      <form
        onSubmit={handleSubmit((data) =>
          onSave({
            ...data,
            date: toISODatetime(data.date) ?? data.date,
          }),
        )}
        className="p-5 space-y-4"
      >
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
        <Field
          label="Date"
          type="date"
          required
          {...register("date", { required: true })}
        />
        <TextareaField
          label="Description"
          rows={2}
          {...register("description")}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isPending}>
            Save Date
          </Button>
        </div>
      </form>
    </Modal>
  );
}
