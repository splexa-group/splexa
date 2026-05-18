"use client";

import { useState } from "react";
import { SignupPersonalStep, type PersonalFormValues } from "./personal-step";
import { SignupPracticeStep, type PracticeFormValues } from "./practice-step";
import { SignupOtpStep } from "./otp-step";

enum SignupStep {
  Personal = "PERSONAL",
  Practice = "PRACTICE",
  Otp = "OTP",
}

export function SignupForm() {
  const [step, setStep] = useState<SignupStep>(SignupStep.Otp);
  const [personalData, setPersonalData] = useState<PersonalFormValues | null>(null);
  const [practiceData, setPracticeData] = useState<Partial<PracticeFormValues> | null>(null);

  function handlePersonalSuccess(data: PersonalFormValues) {
    setPersonalData(data);
    setStep(SignupStep.Practice);
  }

  function handlePracticeSuccess(data: PracticeFormValues) {
    setPracticeData(data);
    setStep(SignupStep.Otp);
  }

  const prev: Record<SignupStep, SignupStep | null> = {
    [SignupStep.Personal]: null,
    [SignupStep.Practice]: SignupStep.Personal,
    [SignupStep.Otp]: SignupStep.Practice,
  };

  function handleBack() {
    const target = prev[step];
    if (target) setStep(target);
  }

  if (step === SignupStep.Otp && personalData) {
    return <SignupOtpStep email={personalData.email} onBack={handleBack} />;
  }

  if (step === SignupStep.Practice && personalData) {
    return (
      <SignupPracticeStep
        personalData={personalData}
        defaultValues={practiceData ?? undefined}
        onSuccess={handlePracticeSuccess}
        onBack={(draft) => { setPracticeData(draft); handleBack(); }}
      />
    );
  }

  return (
    <SignupPersonalStep
      defaultValues={personalData ?? undefined}
      onSuccess={handlePersonalSuccess}
    />
  );
}
