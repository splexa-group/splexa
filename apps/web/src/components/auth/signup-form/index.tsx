"use client";

import { useState } from "react";
import { SignupEmailStep } from "./email-step";
import { SignupPersonalStep, type PersonalFormValues } from "./personal-step";
import { SignupPracticeStep } from "./practice-step";
import { SignupOtpStep } from "./otp-step";

enum SignupStep {
  Email = "EMAIL",
  Personal = "PERSONAL",
  Practice = "PRACTICE",
  Otp = "OTP",
}

export function SignupForm() {
  const [step, setStep] = useState<SignupStep>(SignupStep.Email);
  const [email, setEmail] = useState("");
  const [personalData, setPersonalData] = useState<PersonalFormValues | null>(null);

  function handleEmailSuccess(submittedEmail: string) {
    setEmail(submittedEmail);
    setStep(SignupStep.Personal);
  }

  function handlePersonalSuccess(data: PersonalFormValues) {
    setPersonalData(data);
    setStep(SignupStep.Practice);
  }

  function handlePracticeSuccess() {
    setStep(SignupStep.Otp);
  }

  function handleBack() {
    const prev: Record<SignupStep, SignupStep | null> = {
      [SignupStep.Email]: null,
      [SignupStep.Personal]: SignupStep.Email,
      [SignupStep.Practice]: SignupStep.Personal,
      [SignupStep.Otp]: SignupStep.Practice,
    };
    const target = prev[step];
    if (target) setStep(target);
  }

  if (step === SignupStep.Otp) {
    return <SignupOtpStep email={email} onBack={handleBack} />;
  }

  if (step === SignupStep.Practice && personalData) {
    return (
      <SignupPracticeStep
        email={email}
        personalData={personalData}
        onSuccess={handlePracticeSuccess}
        onBack={handleBack}
      />
    );
  }

  if (step === SignupStep.Personal) {
    return (
      <SignupPersonalStep
        defaultValues={personalData ?? undefined}
        onSuccess={handlePersonalSuccess}
        onBack={handleBack}
      />
    );
  }

  return <SignupEmailStep onSuccess={handleEmailSuccess} />;
}
