import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/services/auth";
import { SignupPayload, VerifyOtpResponse } from "@/types/auth";
import { maskEmail } from "@/lib/utils";

export function useRequestOtp() {
  return useMutation<void, Error, { email: string }>({
    mutationFn: ({ email }) => authApi.requestOtp(email),
    onSuccess: (_, { email }) =>
      toast.info(`OTP sent to ${maskEmail(email)}`),
    onError: (err) =>
      toast.error(err.message || "Failed to send OTP. Try again."),
  });
}

export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, Error, { email: string; otp: string }>({
    mutationFn: ({ email, otp }) => authApi.verifyOtp(email, otp),
    onError: (err) =>
      toast.error(err.message || "Invalid OTP. Try again."),
  });
}

export function useSignup() {
  return useMutation<void, Error, SignupPayload>({
    mutationFn: (data) => authApi.signup(data),
    onError: (err) =>
      toast.error(err.message || "Signup failed. Try again."),
  });
}
