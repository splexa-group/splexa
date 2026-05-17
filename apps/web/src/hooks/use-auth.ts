import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/services/auth";
import { SignupPayload, VerifyOtpResponse } from "@/types/auth";
import { useAuthStore } from "@/store/auth-store";
import { maskEmail } from "@/lib/utils";

export function useRequestOtp() {
  return useMutation<void, Error, { email: string }>({
    mutationFn: ({ email }) => authApi.requestOtp(email),
    onSuccess: (_, { email }) => toast.info(`Code sent to ${maskEmail(email)}`),
    onError: (err) =>
      toast.error(err.message || "Failed to send code. Try again."),
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<VerifyOtpResponse, Error, { email: string; otp: string }>({
    mutationFn: ({ email, otp }) => authApi.verifyOtp(email, otp),
    onSuccess: ({ accessToken, user }) => {
      setAuth(accessToken, user);
      toast.success("Welcome back to Splexa!");
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message || "Invalid code. Try again."),
  });
}

export function useSignup() {
  return useMutation<void, Error, SignupPayload>({
    mutationFn: (data) => authApi.signup(data),
    onSuccess: (_, { email }) => toast.info(`Code sent to ${maskEmail(email)}`),
    onError: (err) => {
      const msg = err.message || "Signup failed. Try again.";
      toast.error(
        msg.toLowerCase().includes("already")
          ? "An account with this email already exists. Sign in instead."
          : msg,
      );
    },
  });
}
