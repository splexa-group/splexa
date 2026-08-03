import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/services/auth";
import { SignupPayload, VerifyOtpResponse } from "@/types/auth";
import { useAuthStore } from "@/store/auth-store";
import { maskEmail } from "@splexa-group/shared/utils";

const MESSAGES = {
  loginSuccess: "Logged in",
  signupSuccess: "Account created",
} as const;

export function useRequestOtp() {
  return useMutation<void, Error, { email: string }>({
    mutationFn: ({ email }) => authApi.requestOtp(email),
    onSuccess: (_, { email }) => toast.info(`Code sent to ${maskEmail(email)}`),
    onError: (err) => toast.error(err.message || "Failed to send code. Try again."),
  });
}

export function useVerifyOtp(successMessage: string = MESSAGES.loginSuccess) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<VerifyOtpResponse, Error, { email: string; otp: string }>({
    mutationFn: ({ email, otp }) => authApi.verifyOtp(email, otp),
    onSuccess: ({ user }) => {
      setAuth(user);
      toast.success(successMessage);
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
      toast.error(msg);
    },
  });
}

export { MESSAGES as AUTH_MESSAGES };
