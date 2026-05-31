"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/form/input";
import { useRequestOtp } from "@/hooks/use-auth";

interface EmailFormValues {
  email: string;
}

interface Props {
  onSuccess: (email: string) => void;
}

export function LoginEmailStep({ onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<EmailFormValues>({ mode: "onChange" });

  const requestOtp = useRequestOtp();

  async function onSubmit({ email }: EmailFormValues) {
    await requestOtp.mutateAsync({ email });
    onSuccess(email);
  }

  const isPending = isSubmitting || requestOtp.isPending;
  const isDisabled = !isValid || isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold text-dark">Welcome back!</h1>
        <p className="text-sm text-secondary mt-1">
          Enter your email to continue.
        </p>
      </div>

      <InputGroup
        label="Email address"
        required
        type="email"
        autoComplete="email"
        placeholder="Enter your email..."
        autoFocus
        {...register("email", {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        })}
      />

      <Button
        type="submit"
        className="w-full"
        loading={isPending}
        disabled={isDisabled}
      >
        Continue
      </Button>

      <div className="text-center">
        <p className="text-[13px] text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-brand hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
