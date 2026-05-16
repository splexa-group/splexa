import { useMutation } from "@tanstack/react-query";
import {
  authApi,
  type SignupPayload,
  type VerifyOtpResponse,
} from "@/services/auth";

export function useRequestOtp() {
  return useMutation<void, Error, { email: string }>({
    mutationFn: ({ email }) => authApi.requestOtp(email),
  });
}

export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, Error, { email: string; otp: string }>({
    mutationFn: ({ email, otp }) => authApi.verifyOtp(email, otp),
  });
}

export function useSignup() {
  return useMutation<void, Error, SignupPayload>({
    mutationFn: (data) => authApi.signup(data),
  });
}
