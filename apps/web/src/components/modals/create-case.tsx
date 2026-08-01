"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Modal } from "@/components/shared/modal";
import { InputGroup } from "@/components/ui/form/input";
import { SelectGroup } from "@/components/ui/form/select";
import { useCreateCase } from "@/hooks/use-cases";
import { CASE_TYPE_OPTIONS } from "@/lib/options";
import type { CaseType } from "@splexa-group/shared/enums";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  title: string;
  caseNumber: string;
  caseType: CaseType | "";
}

export function CreateCaseModal({ open, onClose }: Props) {
  const router = useRouter();
  const createCase = useCreateCase();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { title: "", caseNumber: "", caseType: "" },
  });

  const title = useWatch({ control, name: "title" });

  async function onSubmit(data: FormValues) {
    const result = await createCase.mutateAsync({
      title: data.title.trim(),
      ...(data.caseNumber.trim() ? { caseNumber: data.caseNumber.trim() } : {}),
      ...(data.caseType ? { caseType: data.caseType } : {}),
    });
    reset();
    onClose();
    router.push(`/cases/${result.id}?tab=case`);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create New Case"
      onSave={handleSubmit(onSubmit)}
      saveLabel="Create Case"
      saveLoading={createCase.isPending}
      saveDisabled={!title?.trim()}
    >
      <div className="p-5 flex flex-col gap-3">
        <InputGroup
          label="Case Title"
          required
          placeholder="Enter case title..."
          error={errors.title?.message}
          {...register("title", { required: "Case title is required" })}
        />
        <InputGroup
          label="Case Number"
          placeholder="Enter case number..."
          {...register("caseNumber")}
        />
        <Controller
          name="caseType"
          control={control}
          render={({ field }) => (
            <SelectGroup
              label="Case Type"
              options={CASE_TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select type..."
            />
          )}
        />
        <p className="text-xs text-placeholder text-left pt-1">
          You can add detailed case information, client details, hearing
          records, and supporting documents after creating the case.
        </p>
      </div>
    </Modal>
  );
}
