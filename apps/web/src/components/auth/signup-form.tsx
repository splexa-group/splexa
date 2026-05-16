"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OtpInput } from "@/components/auth/otp-input";
import { useSignup, useVerifyOtp } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { maskEmail } from "@/lib/utils";

type Step = "email" | "personal" | "practice" | "otp";

const RESEND_COOLDOWN = 30;

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
];

const PRACTICE_TYPES = [
  { value: "CRIMINAL", label: "Criminal" },
  { value: "CIVIL", label: "Civil" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "FAMILY", label: "Family" },
  { value: "MATRIMONIAL", label: "Matrimonial" },
  { value: "LABOUR", label: "Labour" },
  { value: "TAX", label: "Tax" },
  { value: "INTELLECTUAL_PROPERTY", label: "Intellectual Property" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "ARBITRATION", label: "Arbitration" },
  { value: "CONSUMER", label: "Consumer" },
  { value: "MOTOR_ACCIDENT", label: "Motor Accident" },
  { value: "CONSTITUTIONAL", label: "Constitutional" },
  { value: "BANKING_AND_FINANCE", label: "Banking & Finance" },
  { value: "REVENUE", label: "Revenue" },
  { value: "SERVICE_MATTERS", label: "Service Matters" },
  { value: "CYBER", label: "Cyber" },
  { value: "ENVIRONMENTAL", label: "Environmental" },
  { value: "GENERAL", label: "General" },
];

export function SignupForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orgName, setOrgName] = useState("");
  const [practiceType, setPracticeType] = useState("");
  const [city, setCity] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const signup = useSignup();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  function handleEmailNext(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("personal");
  }

  function handlePersonalNext(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !designation || !phoneNumber.trim()) return;
    setStep("practice");
  }

  async function handlePracticeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || !practiceType || !city.trim()) return;
    try {
      await signup.mutateAsync({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        designation,
        phoneNumber: phoneNumber.trim(),
        orgName: orgName.trim(),
        practiceType,
        city: city.trim(),
      });
      toast.info(`Code sent to ${maskEmail(email.trim())}`);
      setStep("otp");
      setResendSeconds(RESEND_COOLDOWN);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("already")) {
        toast.error("An account with this email already exists. Sign in instead.");
      } else {
        toast.error(msg);
      }
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return;
    setOtpError(false);
    try {
      const result = await verifyOtp.mutateAsync({ email: email.trim(), otp });
      setAuth(result.accessToken, result.user);
      toast.success("Welcome to Splexa!");
      router.push("/dashboard");
    } catch (err) {
      setOtpError(true);
      setOtp("");
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  async function handleResend() {
    try {
      await signup.mutateAsync({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        designation,
        phoneNumber: phoneNumber.trim(),
        orgName: orgName.trim(),
        practiceType,
        city: city.trim(),
      });
      toast.info(`Code sent to ${maskEmail(email.trim())}`);
      setResendSeconds(RESEND_COOLDOWN);
      setOtp("");
      setOtpError(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0f172a]">
            Verify your email
          </h1>
          <p className="text-[14px] text-[#475569] mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-[#0f172a]">
              {maskEmail(email)}
            </span>
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
          {verifyOtp.isPending ? "Verifying…" : "Verify & continue"}
        </Button>

        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSeconds > 0 || signup.isPending}
            className="text-[#1e40af] hover:underline disabled:text-[#94a3b8] disabled:no-underline"
          >
            {resendSeconds > 0
              ? `Resend (in ${resendSeconds}s)`
              : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => setStep("practice")}
            className="text-[#475569] hover:text-[#0f172a]"
          >
            ← Back
          </button>
        </div>
      </form>
    );
  }

  if (step === "practice") {
    return (
      <form onSubmit={handlePracticeSubmit} className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0f172a]">
            About your practice
          </h1>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="orgName">Firm / chamber name</Label>
            <Input
              id="orgName"
              placeholder="e.g. Iyer & Associates"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              disabled={signup.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Practice type</Label>
            <Select value={practiceType} onValueChange={setPracticeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select practice type" />
              </SelectTrigger>
              <SelectContent>
                {PRACTICE_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. Chennai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              disabled={signup.isPending}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !orgName.trim() || !practiceType || !city.trim() || signup.isPending
          }
        >
          {signup.isPending ? "Creating account…" : "Create account"}
        </Button>

        <button
          type="button"
          onClick={() => setStep("personal")}
          className="text-[13px] text-[#475569] hover:text-[#0f172a]"
        >
          ← Back
        </button>
      </form>
    );
  }

  if (step === "personal") {
    return (
      <form onSubmit={handlePersonalNext} className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0f172a]">
            Tell us about yourself
          </h1>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="Ramesh"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Iyer"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Select value={designation} onValueChange={setDesignation}>
              <SelectTrigger>
                <SelectValue placeholder="Select your designation" />
              </SelectTrigger>
              <SelectContent>
                {DESIGNATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number (for reminders)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !firstName.trim() ||
            !lastName.trim() ||
            !designation ||
            !phoneNumber.trim()
          }
        >
          Continue
        </Button>

        <button
          type="button"
          onClick={() => setStep("email")}
          className="text-[13px] text-[#475569] hover:text-[#0f172a]"
        >
          ← Back
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailNext} className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-[#0f172a]">
          Create your account
        </h1>
        <p className="text-[14px] text-[#475569] mt-1">
          Start with your email address.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={!email.trim()}>
        Continue
      </Button>

      <div className="border-t border-[#e2e8f0] pt-4 text-center">
        <p className="text-[13px] text-[#475569]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#1e40af] hover:underline font-medium"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </form>
  );
}
