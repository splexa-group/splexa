"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, hasError, disabled }: OtpInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function getInputAt(index: number) {
    return containerRef.current?.querySelectorAll("input")[index] as
      | HTMLInputElement
      | undefined;
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const next = (value + digit).slice(0, OTP_LENGTH);
    onChange(next);
    if (next.length < OTP_LENGTH) getInputAt(next.length)?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Backspace" && value.length > 0) {
      e.preventDefault();
      const next = value.slice(0, -1);
      onChange(next);
      getInputAt(next.length)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    onChange(pasted);
    getInputAt(Math.min(pasted.length, OTP_LENGTH - 1))?.focus();
  }

  return (
    <div ref={containerRef} className="flex gap-2">
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-11 h-12 text-center text-lg font-semibold rounded-[6px] border bg-white transition-colors",
            "focus:outline-none focus:border-[#1e40af] focus:ring-[3px] focus:ring-[rgba(30,64,175,0.12)]",
            "disabled:bg-[#f8fafc] disabled:cursor-not-allowed",
            hasError
              ? "border-[#dc2626] ring-[3px] ring-[rgba(220,38,38,0.10)]"
              : "border-[#e2e8f0]"
          )}
        />
      ))}
    </div>
  );
}
