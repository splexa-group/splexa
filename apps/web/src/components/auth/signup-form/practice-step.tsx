"use client";

import { ChevronLeft } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { useSignup } from "@/hooks/use-auth";
import { PRACTICE_TYPE_OPTIONS } from "@/lib/options";
import type { PersonalFormValues } from "./personal-step";

const LABELS = {
  heading: "About your practice",
  orgName: "Firm / chamber name",
  orgNamePlaceholder: "e.g. Iyer & Associates",
  practiceType: "Practice type",
  practiceTypePlaceholder: "Select practice type",
  city: "City",
  cityPlaceholder: "e.g. Chennai",
  submit: "Create account",
} as const;

interface PracticeFormValues {
  orgName: string;
  practiceType: string;
  city: string;
}

interface SignupPracticeStepProps {
  personalData: PersonalFormValues;
  defaultValues?: Partial<PracticeFormValues>;
  onSuccess: () => void;
  onBack: () => void;
}

export function SignupPracticeStep({
  personalData,
  defaultValues,
  onSuccess,
  onBack,
}: SignupPracticeStepProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<PracticeFormValues>({ mode: "onChange", defaultValues });

  const signup = useSignup();

  async function onSubmit(data: PracticeFormValues) {
    await signup.mutateAsync({ ...personalData, ...data });
    onSuccess();
  }

  const isPending = isSubmitting || signup.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h1 className="text-[26px] font-bold text-dark">{LABELS.heading}</h1>

      <div className="space-y-4">
        <InputGroup
          label="Firm / Chamber name"
          placeholder='e.g. "Iyer & Associates"'
          disabled={isPending}
          {...register("orgName", { required: true })}
        />

        <Controller
          name="practiceType"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SelectGroup
              label="Practice type"
              options={PRACTICE_TYPE_OPTIONS}
              placeholder="e.g. Criminal, Corporate, etc."
              value={field.value ?? ""}
              onChange={field.onChange}
              required
              disabled={isPending}
            />
          )}
        />

        <InputGroup
          label="City"
          placeholder="e.g. Hyderabad"
          disabled={isPending}
          {...register("city", { required: true })}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        loading={isPending}
        disabled={!isValid || isPending}
      >
        Create Account
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-secondary hover:text-dark"
      >
        <ChevronLeft size={14} />
        Back
      </button>
    </form>
  );
}
