"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/form/otp-input";
import { useVerifyOtp, useRequestOtp } from "@/hooks/use-auth";
import { maskEmail } from "@splexa-group/shared/utils";

const RESEND_COOL_DOWN_SECONDS = 60;

interface Props {
  email: string;
  onBack: () => void;
}

export function LoginOtpStep({ email, onBack }: Props) {
  const [otp, setOtp] = useState("");
  const [hasError, setHasError] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOL_DOWN_SECONDS);

  const verifyOtp = useVerifyOtp();
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
    setResendSeconds(RESEND_COOL_DOWN_SECONDS);
  }

  const isVerifying = verifyOtp.isPending;
  const isResending = requestOtp.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-[380px]">
      <div>
        <h1 className="text-[26px] font-bold text-dark">Verify your email</h1>
        <p className="text-sm text-secondary mt-1">
          We sent a 6-digit code to{" "}
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
        disabled={otp.length !== 6 || isVerifying}
      >
        Verify Code
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendSeconds > 0 || isResending}
          className="text-brand disabled:text-disabled disabled:no-underline"
        >
          {resendSeconds > 0
            ? `Resend code (${resendSeconds}s)`
            : "Resend code"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-secondary hover:text-dark cursor-pointer"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>
    </form>
  );
}
