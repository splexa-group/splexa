"use client";

import { useFormContext } from "react-hook-form";
import { TextareaField } from "@/components/ui/form/textarea";
import { Section } from "@/components/ui/section";
import type { UpdateCaseInput } from "@/types/cases";

export function CaseDescriptionSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<UpdateCaseInput>();

  return (
    <Section title="Description">
      <TextareaField
        placeholder="Enter a detailed case description..."
        rows={15}
        error={errors.description?.message}
        {...register("description")}
      />
    </Section>
  );
}
