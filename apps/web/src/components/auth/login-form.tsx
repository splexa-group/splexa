"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input";
import { OtpInput } from "@/components/auth/otp-input";
import { useRequestOtp, useVerifyOtp } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { maskEmail } from "@/lib/utils";

type Step = "email" | "otp";

const RESEND_COOLDOWN = 30;

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await requestOtp.mutateAsync({ email: email.trim() });
      toast.info(`Code sent to ${maskEmail(email.trim())}`);
      setStep("otp");
      setResendSeconds(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return;
    setOtpError(false);
    try {
      const result = await verifyOtp.mutateAsync({ email: email.trim(), otp });
      setAuth(result.accessToken, result.user);
      toast.success("Welcome back.");
      router.push("/dashboard");
    } catch (err) {
      setOtpError(true);
      setOtp("");
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  async function handleResend() {
    try {
      await requestOtp.mutateAsync({ email: email.trim() });
      toast.info(`Code sent to ${maskEmail(email.trim())}`);
      setResendSeconds(RESEND_COOLDOWN);
      setOtp("");
      setOtpError(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-dark">Check your email</h1>
          <p className="text-[14px] text-secondary mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-dark">{maskEmail(email)}</span>
          </p>
        </div>

        <OtpInput
          value={otp}
          onChange={setOtp}
          hasError={otpError}
          disabled={verifyOtp.isPending}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={otp.length < 6 || verifyOtp.isPending}
        >
          {verifyOtp.isPending ? "Verifying…" : "Verify code"}
        </Button>

        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSeconds > 0 || requestOtp.isPending}
            className="text-brand hover:underline disabled:text-disabled disabled:no-underline"
          >
            {resendSeconds > 0
              ? `Resend code (in ${resendSeconds}s)`
              : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setOtpError(false);
            }}
            className="text-secondary hover:text-dark"
          >
            ← Back to email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-dark">Welcome back.</h1>
        <p className="text-[14px] text-secondary mt-1">
          Enter your email to continue.
        </p>
      </div>

      <InputGroup
        label="Email address"
        id="email"
        type="email"
        autoComplete="email"
        placeholder="Enter your email..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={requestOtp.isPending}
        autoFocus
      />

      <Button
        type="submit"
        className="w-full"
        disabled={!email.trim() || requestOtp.isPending}
      >
        Continue
      </Button>

      <div className="border-t border-line pt-4 text-center">
        <p className="text-[13px] text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-brand hover:underline font-medium"
          >
            Create one →
          </Link>
        </p>
      </div>
    </form>
  );
}
