import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/services/auth";
import { SignupPayload, VerifyOtpResponse } from "@/types/auth";

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
