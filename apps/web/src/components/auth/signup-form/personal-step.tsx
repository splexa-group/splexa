"use client";

import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";

const LABELS = {
  heading: "Tell us about yourself",
  firstName: "First name",
  firstNamePlaceholder: "Ramesh",
  lastName: "Last name",
  lastNamePlaceholder: "Iyer",
  designation: "Designation",
  designationPlaceholder: "Select your designation",
  phone: "Phone number",
  phonePlaceholder: "+91 98765 43210",
  submit: "Continue",
  back: "← Back",
} as const;

const DESIGNATIONS = [
  { value: "ADVOCATE", label: "Advocate" },
  { value: "SENIOR_ADVOCATE", label: "Senior Advocate" },
  { value: "JUNIOR_ADVOCATE", label: "Junior Advocate" },
  { value: "ASSOCIATE", label: "Associate" },
  { value: "SENIOR_ASSOCIATE", label: "Senior Associate" },
  { value: "PARTNER", label: "Partner" },
  { value: "SENIOR_PARTNER", label: "Senior Partner" },
  { value: "MANAGING_PARTNER", label: "Managing Partner" },
  { value: "PARALEGAL", label: "Paralegal" },
  { value: "LEGAL_INTERN", label: "Legal Intern" },
  { value: "CLERK", label: "Clerk" },
] as const;

export interface PersonalFormValues {
  firstName: string;
  lastName: string;
  designation: string;
  phoneNumber: string;
}

interface SignupPersonalStepProps {
  defaultValues?: Partial<PersonalFormValues>;
  onSuccess: (data: PersonalFormValues) => void;
  onBack: () => void;
}

export function SignupPersonalStep({ defaultValues, onSuccess, onBack }: SignupPersonalStepProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<PersonalFormValues>({ mode: "onChange", defaultValues });

  return (
    <form onSubmit={handleSubmit(onSuccess)} className="space-y-6">
      <h1 className="text-[26px] font-bold text-dark">{LABELS.heading}</h1>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputGroup
            label={LABELS.firstName}
            placeholder={LABELS.firstNamePlaceholder}
            {...register("firstName", { required: true })}
          />
          <InputGroup
            label={LABELS.lastName}
            placeholder={LABELS.lastNamePlaceholder}
            {...register("lastName", { required: true })}
          />
        </div>

        <Controller
          name="designation"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SelectGroup
              label={LABELS.designation}
              options={DESIGNATIONS as unknown as { value: string; label: string }[]}
              placeholder={LABELS.designationPlaceholder}
              value={field.value ?? ""}
              onChange={field.onChange}
              required
            />
          )}
        />

        <InputGroup
          label={LABELS.phone}
          type="tel"
          placeholder={LABELS.phonePlaceholder}
          {...register("phoneNumber", { required: true })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!isValid}>
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
