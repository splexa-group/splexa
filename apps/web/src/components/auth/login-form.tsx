"use client";

import { useState } from "react";
import { LoginEmailStep } from "@/components/auth/login-email-step";
import { LoginOtpStep } from "@/components/auth/login-otp-step";

enum LoginStep {
  Email = "EMAIL",
  Otp = "OTP",
}

export function LoginForm() {
  const [step, setStep] = useState<LoginStep>(LoginStep.Email);
  const [email, setEmail] = useState("");

  function handleEmailSuccess(submittedEmail: string) {
    setEmail(submittedEmail);
    setStep(LoginStep.Otp);
  }

  function handleBack() {
    setStep(LoginStep.Email);
    setEmail("");
  }

  if (step === LoginStep.Otp) {
    return <LoginOtpStep email={email} onBack={handleBack} />;
  }

  return <LoginEmailStep onSuccess={handleEmailSuccess} />;
}
