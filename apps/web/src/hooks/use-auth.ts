import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/services/auth";
import { SignupPayload, VerifyOtpResponse } from "@/types/auth";
import { useAuthStore } from "@/store/auth-store";
import { maskEmail } from "@/lib/utils";

const MESSAGES = {
  otpSent: (email: string) => `Code sent to ${maskEmail(email)}`,
  otpSendFailed: "Failed to send code. Try again.",
  loginSuccess: "Welcome back.",
  loginFailed: "Invalid code. Try again.",
  signupFailed: "Signup failed. Try again.",
} as const;

export function useRequestOtp() {
  return useMutation<void, Error, { email: string }>({
    mutationFn: ({ email }) => authApi.requestOtp(email),
    onSuccess: (_, { email }) => toast.info(MESSAGES.otpSent(email)),
    onError: (err) => toast.error(err.message || MESSAGES.otpSendFailed),
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<VerifyOtpResponse, Error, { email: string; otp: string }>({
    mutationFn: ({ email, otp }) => authApi.verifyOtp(email, otp),
    onSuccess: ({ accessToken, user }) => {
      setAuth(accessToken, user);
      toast.success(MESSAGES.loginSuccess);
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message || MESSAGES.loginFailed),
  });
}

export function useSignup() {
  return useMutation<void, Error, SignupPayload>({
    mutationFn: (data) => authApi.signup(data),
    onError: (err) => toast.error(err.message || MESSAGES.signupFailed),
  });
}
