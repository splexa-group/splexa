import { useMutation } from "@tanstack/react-query";
import {
  requestOtp,
  signup,
  verifyOtp,
  type SignupPayload,
  type VerifyOtpResponse,
} from "@/lib/api/auth";

export function useRequestOtp() {
  return useMutation<void, Error, { email: string }>({
    mutationFn: ({ email }) => requestOtp(email),
  });
}

export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, Error, { email: string; otp: string }>({
    mutationFn: ({ email, otp }) => verifyOtp(email, otp),
  });
}

export function useSignup() {
  return useMutation<void, Error, SignupPayload>({
    mutationFn: (data) => signup(data),
  });
}
