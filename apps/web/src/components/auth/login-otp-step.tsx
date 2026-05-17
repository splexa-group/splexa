"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import { useVerifyOtp, useRequestOtp } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { maskEmail } from "@/lib/utils";

const RESEND_COOLDOWN_SECONDS = 30;

const LABELS = {
  heading: "Check your email",
  codeSentTo: "We sent a 6-digit code to",
  verify: "Verify code",
  resend: "Resend code",
  resendCountdown: (s: number) => `Resend code (${s}s)`,
  back: "← Back",
  successMsg: "Welcome back.",
} as const;

interface LoginOtpStepProps {
  email: string;
  onBack: () => void;
}

export function LoginOtpStep({ email, onBack }: LoginOtpStepProps) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState("");
  const [hasError, setHasError] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN_SECONDS);

  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return;
    setHasError(false);
    try {
      const result = await verifyOtp.mutateAsync({ email, otp });
      setAuth(result.accessToken, result.user);
      toast.success(LABELS.successMsg);
      router.push("/dashboard");
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
        <h1 className="text-[28px] font-bold text-dark">{LABELS.heading}</h1>
        <p className="text-sm text-secondary mt-1">
          {LABELS.codeSentTo}{" "}
          <span className="font-medium text-dark">{maskEmail(email)}</span>
        </p>
      </div>

      <OtpInput
        value={otp}
        onChange={setOtp}
        hasError={hasError}
        disabled={isVerifying}
      />

      <Button
        type="submit"
        className="w-full"
        loading={isVerifying}
        disabled={otp.length < 6 || isVerifying}
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
          {resendSeconds > 0
            ? LABELS.resendCountdown(resendSeconds)
            : LABELS.resend}
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
