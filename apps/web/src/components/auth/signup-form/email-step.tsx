"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input";

const LABELS = {
  heading: "Create your account",
  subtext: "Start with your email address.",
  email: "Email address",
  emailPlaceholder: "you@example.com",
  submit: "Continue",
  hasAccount: "Already have an account?",
  signIn: "Sign in →",
} as const;

const EMAIL_RULES = {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

interface FormValues {
  email: string;
}

interface SignupEmailStepProps {
  onSuccess: (email: string) => void;
}

export function SignupEmailStep({ onSuccess }: SignupEmailStepProps) {
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({ mode: "onChange" });

  function onSubmit({ email }: FormValues) {
    onSuccess(email);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold text-dark">{LABELS.heading}</h1>
        <p className="text-sm text-secondary mt-1">{LABELS.subtext}</p>
      </div>

      <InputGroup
        label={LABELS.email}
        type="email"
        autoComplete="email"
        placeholder={LABELS.emailPlaceholder}
        autoFocus
        {...register("email", EMAIL_RULES)}
      />

      <Button type="submit" className="w-full" disabled={!isValid}>
        {LABELS.submit}
      </Button>

      <div className="border-t border-line pt-4 text-center">
        <p className="text-sm text-secondary">
          {LABELS.hasAccount}{" "}
          <Link href="/login" className="text-brand hover:underline font-medium">
            {LABELS.signIn}
          </Link>
        </p>
      </div>
    </form>
  );
}
