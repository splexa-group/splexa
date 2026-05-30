"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { InputGroup } from "@/components/ui/input";
import { DateInputGroup } from "@/components/ui/date-input";
import { Button } from "@/components/ui/button";
import { useCreateCase } from "@/hooks/use-cases";
import { toISODatetime } from "@/lib/utils";

interface CreateCaseModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  title: string;
  caseNumber: string;
  filingDate: string;
}

export function CreateCaseModal({ open, onClose }: CreateCaseModalProps) {
  const router = useRouter();
  const createCase = useCreateCase();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { title: "", caseNumber: "", filingDate: "" },
  });

  const title = watch("title");

  async function onSubmit(data: FormValues) {
    const result = await createCase.mutateAsync({
      title: data.title.trim(),
      ...(data.caseNumber.trim() ? { caseNumber: data.caseNumber.trim() } : {}),
      ...(data.filingDate ? { filingDate: toISODatetime(data.filingDate) } : {}),
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
    <Modal open={open} onClose={handleClose} title="New Case">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-5 flex flex-col gap-3">
          <InputGroup
            label="Case Title"
            required
            placeholder="e.g. Sharma v State of AP"
            error={errors.title?.message}
            {...register("title", { required: "Case title is required" })}
          />
          <InputGroup
            label="Case Number"
            placeholder="e.g. OS / 234 / 2024"
            {...register("caseNumber")}
          />
          <DateInputGroup
            label="Filed Date"
            {...register("filingDate")}
          />
          <p className="text-xs text-placeholder text-center pt-1">
            Add client details, hearings, and documents after creating
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!title?.trim()}
            loading={createCase.isPending}
          >
            Create Case
          </Button>
        </div>
      </form>
    </Modal>
  );
}
