"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { useVerifyOtp, useRequestOtp } from "@/hooks/use-auth";
import { maskEmail } from "@/lib/utils";

const RESEND_COOLDOWN_SECONDS = 30;
const SUCCESS_MSG = "Welcome to Splexa!";

const LABELS = {
  heading: "Verify your email",
  codeSentTo: (email: string) => `We sent a 6-digit code to ${maskEmail(email)}`,
  verify: "Verify & continue",
  resend: "Resend code",
  resendCountdown: (s: number) => `Resend code (${s}s)`,
  back: "← Back",
} as const;

interface SignupOtpStepProps {
  email: string;
  onBack: () => void;
}

export function SignupOtpStep({ email, onBack }: SignupOtpStepProps) {
  const [otp, setOtp] = useState("");
  const [hasError, setHasError] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN_SECONDS);

  const verifyOtp = useVerifyOtp(SUCCESS_MSG);
  const requestOtp = useRequestOtp();

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setHasError(false);
    try {
      await verifyOtp.mutateAsync({ email, otp });
    } catch {
      setHasError(true);
      setOtp("");
    }
  }

  async function handleResend() {
    setOtp("");
    setHasError(false);
    await requestOtp.mutateAsync({ email });
    setResendSeconds(RESEND_COOLDOWN_SECONDS);
  }

  const isVerifying = verifyOtp.isPending;
  const isResending = requestOtp.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold text-dark">{LABELS.heading}</h1>
        <p className="text-sm text-secondary mt-1">{LABELS.codeSentTo(email)}</p>
      </div>

      <OtpInput value={otp} onChange={setOtp} hasError={hasError} disabled={isVerifying} />

      <Button
        type="submit"
        className="w-full"
        loading={isVerifying}
        disabled={otp.length !== 6 || isVerifying}
      >
        {LABELS.verify}
      </Button>

      <div className="flex items-center justify-between text-[13px]">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendSeconds > 0 || isResending}
          className="text-brand hover:underline disabled:text-disabled disabled:no-underline"
        >
          {resendSeconds > 0 ? LABELS.resendCountdown(resendSeconds) : LABELS.resend}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-secondary hover:text-dark"
        >
          {LABELS.back}
        </button>
      </div>
    </form>
  );
}
