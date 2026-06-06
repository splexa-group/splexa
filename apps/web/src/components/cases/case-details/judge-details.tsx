"use client";

import { useFormContext } from "react-hook-form";
import { InputGroup } from "@/components/ui/form/input";
import { Section } from "@/components/ui/section";
import type { UpdateCaseInput } from "@/types/cases";

export function JudgeDetailsSection() {
  const { register } = useFormContext<UpdateCaseInput>();

  return (
    <Section title="Judge Details" cols={2}>
      <InputGroup
        label="Judge Name"
        placeholder="Enter judge name..."
        {...register("judgeName")}
      />
      <InputGroup
        label="Designation"
        placeholder="Enter designation..."
        {...register("judgeDesignation")}
      />
    </Section>
  );
}
