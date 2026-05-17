"use client";

import { useForm, Controller } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input";
import { SelectGroup } from "@/components/ui/select";


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
  email: string;
  firstName: string;
  lastName: string;
  designation: string;
  phoneNumber: string;
}

interface SignupPersonalStepProps {
  defaultValues?: Partial<PersonalFormValues>;
  onSuccess: (data: PersonalFormValues) => void;
  onBack?: () => void;
}

export function SignupPersonalStep({
  defaultValues,
  onSuccess,
}: SignupPersonalStepProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<PersonalFormValues>({ mode: "onChange", defaultValues });

  return (
    <form onSubmit={handleSubmit(onSuccess)} className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold text-dark">Create your account</h1>
        <p className="text-sm text-secondary mt-1">Start with your details</p>
      </div>

      <div className="space-y-4">
        <InputGroup
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="Enter your email..."
          autoFocus
          {...register("email", {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          })}
        />

        <div className="grid grid-cols-2 gap-3">
          <InputGroup
            label="First name"
            placeholder="Enter your first name..."
            {...register("firstName", { required: true })}
          />
          <InputGroup
            label="Last name"
            placeholder="Enter your last name..."
            {...register("lastName", { required: true })}
          />
        </div>

        <Controller
          name="designation"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SelectGroup
              label="Designation"
              options={
                DESIGNATIONS as unknown as { value: string; label: string }[]
              }
              placeholder="Select your designation..."
              value={field.value ?? ""}
              onChange={field.onChange}
              required
            />
          )}
        />

        <InputGroup
          label="Phone number"
          type="tel"
          placeholder="Enter your phone number..."
          {...register("phoneNumber", { required: true })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!isValid}>
        Continue
      </Button>

      <div className="text-center">
        <p className="text-sm text-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
