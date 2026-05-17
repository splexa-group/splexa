"use client";

import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";
import { useSignup } from "@/hooks/use-auth";
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
  back: "← Back",
} as const;

const PRACTICE_TYPES = [
  { value: "CRIMINAL", label: "Criminal" },
  { value: "CIVIL", label: "Civil" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "FAMILY", label: "Family" },
  { value: "MATRIMONIAL", label: "Matrimonial" },
  { value: "LABOUR", label: "Labour" },
  { value: "TAX", label: "Tax" },
  { value: "INTELLECTUAL_PROPERTY", label: "Intellectual Property" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "ARBITRATION", label: "Arbitration" },
  { value: "CONSUMER", label: "Consumer" },
  { value: "MOTOR_ACCIDENT", label: "Motor Accident" },
  { value: "CONSTITUTIONAL", label: "Constitutional" },
  { value: "BANKING_AND_FINANCE", label: "Banking & Finance" },
  { value: "REVENUE", label: "Revenue" },
  { value: "SERVICE_MATTERS", label: "Service Matters" },
  { value: "CYBER", label: "Cyber" },
  { value: "ENVIRONMENTAL", label: "Environmental" },
  { value: "GENERAL", label: "General" },
] as const;

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
          label={LABELS.orgName}
          placeholder={LABELS.orgNamePlaceholder}
          disabled={isPending}
          {...register("orgName", { required: true })}
        />

        <Controller
          name="practiceType"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SelectGroup
              label={LABELS.practiceType}
              options={
                PRACTICE_TYPES as unknown as { value: string; label: string }[]
              }
              placeholder={LABELS.practiceTypePlaceholder}
              value={field.value ?? ""}
              onChange={field.onChange}
              required
              disabled={isPending}
            />
          )}
        />

        <InputGroup
          label={LABELS.city}
          placeholder={LABELS.cityPlaceholder}
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
        {LABELS.submit}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-secondary hover:text-dark w-full text-left"
      >
        {LABELS.back}
      </button>
    </form>
  );
}
