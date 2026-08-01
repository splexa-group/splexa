"use client";

import { ChevronLeft } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/form/input";
import { MultiSelectGroup } from "@/components/ui/form/multi-select";
import { useSignup } from "@/hooks/use-auth";
import { PRACTICE_TYPE_OPTIONS } from "@/utils/options";
import type { PersonalFormValues } from "./personal-step";

export interface PracticeFormValues {
  orgName: string;
  practiceTypes: string[];
  city: string;
}

interface Props {
  personalData: PersonalFormValues;
  defaultValues?: Partial<PracticeFormValues>;
  onSuccess: (data: PracticeFormValues) => void;
  onBack: (draft: Partial<PracticeFormValues>) => void;
}

export function SignupPracticeStep({ personalData, defaultValues, onSuccess, onBack }: Props) {
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { isValid, isSubmitting },
  } = useForm<PracticeFormValues>({ mode: "onChange", defaultValues });

  const signup = useSignup();

  async function onSubmit(data: PracticeFormValues) {
    await signup.mutateAsync({ ...personalData, ...data });
    onSuccess(data);
  }

  const isPending = isSubmitting || signup.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h1 className="text-[26px] font-bold text-dark">About your practice</h1>

      <div className="space-y-4">
        <InputGroup
          label="Firm / Chamber name"
          placeholder='e.g. "Iyer & Associates"'
          disabled={isPending}
          {...register("orgName", { required: true })}
        />

        <Controller
          name="practiceTypes"
          control={control}
          defaultValue={[]}
          rules={{ validate: (v) => v.length > 0 }}
          render={({ field }) => (
            <MultiSelectGroup
              label="Practice types"
              options={PRACTICE_TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              placeholder="e.g. Criminal, Corporate, etc"
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

      <Button type="submit" className="w-full" loading={isPending} disabled={!isValid || isPending}>
        Create Account
      </Button>

      <button
        type="button"
        onClick={() => onBack(getValues())}
        className="flex items-center gap-1 text-sm text-secondary hover:text-dark"
      >
        <ChevronLeft size={14} />
        Back
      </button>
    </form>
  );
}
